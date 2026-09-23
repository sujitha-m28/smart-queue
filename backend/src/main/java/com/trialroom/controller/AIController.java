package com.trialroom.controller;

import com.trialroom.ai.AIService;
import com.trialroom.dto.request.AiChatRequest;
import com.trialroom.dto.response.ApiResponse;
import com.trialroom.dto.response.AiChatResponse;
import com.trialroom.dto.response.QueueStatusResponse;
import com.trialroom.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final QueueService queueService;

    /**
     * Customer chatbot — public endpoint (verified by queue token).
     * AI gets real-time queue context from the database.
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> customerChat(
            @RequestBody AiChatRequest request) {

        // Load real queue context for the customer — never hallucinate data
        QueueStatusResponse queueContext = null;
        if (request.getToken() != null && !request.getToken().isBlank()) {
            try {
                queueContext = queueService.getQueueStatus(request.getToken());
            } catch (Exception e) {
                // Token not found — proceed without context
            }
        }

        AiChatResponse response = aiService.customerChat(request, queueContext);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
