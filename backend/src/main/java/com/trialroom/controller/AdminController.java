package com.trialroom.controller;

import com.trialroom.dto.request.CreateRoomRequest;
import com.trialroom.dto.request.CreateStoreRequest;
import com.trialroom.dto.request.RegisterRequest;
import com.trialroom.dto.response.ApiResponse;
import com.trialroom.dto.response.StoreResponse;
import com.trialroom.dto.response.TrialRoomResponse;
import com.trialroom.entity.Store;
import com.trialroom.entity.TrialRoom;
import com.trialroom.exception.ResourceNotFoundException;
import com.trialroom.repository.StoreRepository;
import com.trialroom.repository.TrialRoomRepository;
import com.trialroom.repository.UserRepository;
import com.trialroom.service.AuthService;
import com.trialroom.service.QRCodeService;
import com.trialroom.service.TrialRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final StoreRepository storeRepository;
    private final TrialRoomRepository trialRoomRepository;
    private final UserRepository userRepository;
    private final TrialRoomService trialRoomService;
    private final AuthService authService;
    private final QRCodeService qrCodeService;

    // ===== STORES =====

    @GetMapping("/stores")
    public ResponseEntity<ApiResponse<List<StoreResponse>>> getStores() {
        List<StoreResponse> stores = storeRepository.findAll().stream()
            .map(this::toStoreResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(stores));
    }

    @PostMapping("/stores")
    public ResponseEntity<ApiResponse<StoreResponse>> createStore(
            @RequestBody CreateStoreRequest request) {
        Store store = Store.builder()
            .name(request.getName())
            .address(request.getAddress())
            .city(request.getCity())
            .state(request.getState())
            .pincode(request.getPincode())
            .phone(request.getPhone())
            .isActive(true)
            .build();
        storeRepository.save(store);
        return ResponseEntity.status(201).body(ApiResponse.success("Store created", toStoreResponse(store)));
    }

    @PutMapping("/stores/{id}")
    public ResponseEntity<ApiResponse<StoreResponse>> updateStore(
            @PathVariable UUID id, @RequestBody CreateStoreRequest request) {
        Store store = storeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id));
        if (request.getName() != null) store.setName(request.getName());
        if (request.getAddress() != null) store.setAddress(request.getAddress());
        if (request.getCity() != null) store.setCity(request.getCity());
        if (request.getState() != null) store.setState(request.getState());
        if (request.getPincode() != null) store.setPincode(request.getPincode());
        if (request.getPhone() != null) store.setPhone(request.getPhone());
        storeRepository.save(store);
        return ResponseEntity.ok(ApiResponse.success("Store updated", toStoreResponse(store)));
    }

    /** Returns QR code PNG for a store */
    @GetMapping("/stores/{storeId}/qr")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> getStoreQRCode(@PathVariable String storeId) {
        byte[] qrPng = qrCodeService.generateStoreQRCode(storeId);
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_PNG)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"qr-store-" + storeId + ".png\"")
            .body(qrPng);
    }

    /** Returns QR URL for a store (for displaying in UI) */
    @GetMapping("/stores/{storeId}/qr-url")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Map<String,String>>> getStoreQRUrl(@PathVariable String storeId) {
        String url = qrCodeService.getStoreQRUrl(storeId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url, "storeId", storeId)));
    }

    // ===== ROOMS =====

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<TrialRoomResponse>>> getRooms(
            @RequestParam(required = false) String storeId) {
        List<TrialRoomResponse> rooms;
        if (storeId != null) {
            rooms = trialRoomService.getRoomsByStore(UUID.fromString(storeId));
        } else {
            rooms = trialRoomRepository.findAll().stream()
                .map(r -> trialRoomService.getRoom(r.getId()))
                .collect(Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<TrialRoomResponse>> createRoom(
            @RequestBody CreateRoomRequest request) {
        Store store = storeRepository.findById(UUID.fromString(request.getStoreId()))
            .orElseThrow(() -> new ResourceNotFoundException("Store", "id", request.getStoreId()));

        TrialRoom room = TrialRoom.builder()
            .store(store)
            .roomNumber(request.getRoomNumber())
            .displayName(request.getDisplayName() != null
                ? request.getDisplayName() : "Room " + request.getRoomNumber())
            .maxItems(request.getMaxItems() != null ? request.getMaxItems() : 5)
            .status("AVAILABLE")
            .notes(request.getNotes())
            .build();
        trialRoomRepository.save(room);
        return ResponseEntity.status(201)
            .body(ApiResponse.success("Room created", trialRoomService.getRoom(room.getId())));
    }

    @PutMapping("/rooms/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','MANAGER')")
    public ResponseEntity<ApiResponse<TrialRoomResponse>> updateRoomStatus(
            @PathVariable UUID id, @RequestBody Map<String, String> body) {
        TrialRoomResponse room = trialRoomService.updateRoomStatus(id, body.get("status"));
        return ResponseEntity.ok(ApiResponse.success("Room status updated", room));
    }

    // ===== USERS =====

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
            .map(u -> Map.<String, Object>of(
                "id", u.getId().toString(),
                "username", u.getUsername(),
                "email", u.getEmail() != null ? u.getEmail() : "",
                "fullName", u.getFullName() != null ? u.getFullName() : "",
                "isActive", u.getIsActive(),
                "roles", u.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList())
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<?>> createUser(@RequestBody RegisterRequest request) {
        var response = authService.register(request);
        return ResponseEntity.status(201).body(ApiResponse.success("User created", response));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<Void>> toggleUserActive(@PathVariable UUID id) {
        var user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(
            "User " + (user.getIsActive() ? "activated" : "deactivated"), null));
    }

    private StoreResponse toStoreResponse(Store store) {
        int totalRooms = (int) trialRoomRepository.findByStoreId(store.getId()).size();
        int availableRooms = (int) trialRoomRepository.countByStoreIdAndStatus(store.getId(), "AVAILABLE");
        return StoreResponse.builder()
            .id(store.getId().toString())
            .name(store.getName())
            .address(store.getAddress())
            .city(store.getCity())
            .state(store.getState())
            .pincode(store.getPincode())
            .phone(store.getPhone())
            .isActive(store.getIsActive())
            .totalRooms(totalRooms)
            .availableRooms(availableRooms)
            .build();
    }
}
