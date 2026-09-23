package com.trialroom.controller;

import com.trialroom.dto.request.QueueActionRequest;
import com.trialroom.dto.response.ApiResponse;
import com.trialroom.dto.response.QueueEntryResponse;
import com.trialroom.dto.response.TrialRoomResponse;
import com.trialroom.service.QueueService;
import com.trialroom.service.TrialRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
public class StaffController {

    private final QueueService queueService;
    private final TrialRoomService trialRoomService;

    @PostMapping("/queue/next")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> callNext(
            @RequestBody QueueActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        QueueEntryResponse entry = queueService.callNext(request.getStoreId(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Next customer called", entry));
    }

    @PostMapping("/queue/{id}/start")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> startService(
            @PathVariable UUID id,
            @RequestBody QueueActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        QueueEntryResponse entry = queueService.startService(id, request.getTrialRoomId(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Service started", entry));
    }

    @PostMapping("/queue/{id}/complete")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> completeService(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        QueueEntryResponse entry = queueService.completeService(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Service completed", entry));
    }

    @PostMapping("/queue/{id}/skip")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> skipCustomer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        QueueEntryResponse entry = queueService.skipCustomer(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Customer skipped", entry));
    }

    @PostMapping("/queue/{id}/recall")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> recallCustomer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        QueueEntryResponse entry = queueService.recallCustomer(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Customer recalled", entry));
    }

    @PostMapping("/queue/{id}/no-show")
    public ResponseEntity<ApiResponse<QueueEntryResponse>> markNoShow(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        QueueEntryResponse entry = queueService.markNoShow(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Customer marked as no-show", entry));
    }

    @GetMapping("/queue/{storeId}/live")
    public ResponseEntity<ApiResponse<List<QueueEntryResponse>>> getLiveQueue(@PathVariable UUID storeId) {
        List<QueueEntryResponse> queue = queueService.getLiveQueue(storeId);
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    @GetMapping("/rooms/{storeId}")
    public ResponseEntity<ApiResponse<List<TrialRoomResponse>>> getRooms(@PathVariable UUID storeId) {
        List<TrialRoomResponse> rooms = trialRoomService.getRoomsByStore(storeId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }
}
