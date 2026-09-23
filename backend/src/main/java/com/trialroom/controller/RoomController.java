package com.trialroom.controller;

import com.trialroom.dto.response.ApiResponse;
import com.trialroom.dto.response.TrialRoomResponse;
import com.trialroom.service.TrialRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final TrialRoomService trialRoomService;

    /** Public endpoint — customers can see room availability */
    @GetMapping("/status/{storeId}")
    public ResponseEntity<ApiResponse<List<TrialRoomResponse>>> getRoomStatus(@PathVariable UUID storeId) {
        List<TrialRoomResponse> rooms = trialRoomService.getRoomsByStore(storeId);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }
}
