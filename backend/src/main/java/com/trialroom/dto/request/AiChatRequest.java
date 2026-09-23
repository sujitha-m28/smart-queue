package com.trialroom.dto.request;

import lombok.Data;

@Data
public class AiChatRequest {
    private String token;
    private String storeId;
    private String conversationId;
    private String message;
    // For manager: userId comes from JWT
}
