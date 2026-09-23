package com.trialroom.dto.request;

import lombok.Data;

@Data
public class QueueActionRequest {
    private String trialRoomId;
    private String storeId;
    private String notes;
}
