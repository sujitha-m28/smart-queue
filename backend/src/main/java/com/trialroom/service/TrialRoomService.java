package com.trialroom.service;

import com.trialroom.dto.response.TrialRoomResponse;
import com.trialroom.entity.TrialRoom;
import com.trialroom.exception.BadRequestException;
import com.trialroom.exception.ResourceNotFoundException;
import com.trialroom.repository.TrialRoomRepository;
import com.trialroom.websocket.WebSocketBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrialRoomService {

    private final TrialRoomRepository trialRoomRepository;
    private final WebSocketBroadcastService broadcastService;

    private static final List<String> VALID_STATUSES =
        List.of("AVAILABLE", "OCCUPIED", "CLEANING", "OUT_OF_SERVICE");

    public List<TrialRoomResponse> getRoomsByStore(UUID storeId) {
        return trialRoomRepository.findByStoreId(storeId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<TrialRoomResponse> getAvailableRooms(UUID storeId) {
        return trialRoomRepository.findByStoreIdAndStatus(storeId, "AVAILABLE").stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public int getAvailableRoomCount(UUID storeId) {
        return (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "AVAILABLE");
    }

    @Transactional
    public TrialRoomResponse updateRoomStatus(UUID roomId, String newStatus) {
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new BadRequestException("Invalid room status: " + newStatus + ". Valid values: " + VALID_STATUSES);
        }
        TrialRoom room = trialRoomRepository.findById(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Trial room", "id", roomId));
        room.setStatus(newStatus);
        trialRoomRepository.save(room);
        broadcastService.broadcastRoomUpdate(room.getStore().getId().toString(), null);
        return toResponse(room);
    }

    public TrialRoomResponse getRoom(UUID roomId) {
        return trialRoomRepository.findById(roomId)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Trial room", "id", roomId));
    }

    private TrialRoomResponse toResponse(TrialRoom room) {
        return TrialRoomResponse.builder()
            .id(room.getId().toString())
            .storeId(room.getStore().getId().toString())
            .roomNumber(room.getRoomNumber())
            .displayName(room.getDisplayName())
            .status(room.getStatus())
            .maxItems(room.getMaxItems())
            .notes(room.getNotes())
            .build();
    }
}
