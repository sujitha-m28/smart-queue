package com.trialroom.controller;

import com.trialroom.dto.request.JoinQueueRequest;
import com.trialroom.dto.response.ApiResponse;
import com.trialroom.dto.response.QueueEntryResponse;
import com.trialroom.dto.response.QueueStatusResponse;
import com.trialroom.service.QueueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    /** Public — customer joins queue by scanning QR code */
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<QueueStatusResponse>> joinQueue(
            @Valid @RequestBody JoinQueueRequest request) {
        QueueStatusResponse response = queueService.joinQueue(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Joined queue successfully", response));
    }

    /** Public — get queue status by token */
    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<QueueStatusResponse>> getQueueStatus(@PathVariable String token) {
        QueueStatusResponse response = queueService.getQueueStatus(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** Public — cancel queue entry */
    @DeleteMapping("/{token}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelQueue(@PathVariable String token) {
        queueService.cancelQueue(token);
        return ResponseEntity.ok(ApiResponse.success("Queue entry cancelled", null));
    }

    /** Public — get overall queue status for a store (for display/kiosk) */
    @GetMapping("/status/{storeId}")
    public ResponseEntity<ApiResponse<QueueStatusResponse>> getPublicQueueStatus(
            @PathVariable String storeId) {
        QueueStatusResponse response = queueService.getQueuePublicStatus(UUID.fromString(storeId));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** Staff/Manager — get live queue */
    @GetMapping("/live/{storeId}")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<QueueEntryResponse>>> getLiveQueue(
            @PathVariable String storeId) {
        List<QueueEntryResponse> queue = queueService.getLiveQueue(UUID.fromString(storeId));
        return ResponseEntity.ok(ApiResponse.success(queue));
    }
}
