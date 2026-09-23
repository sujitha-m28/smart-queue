package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueEntryResponse {
    private String id;
    private String token;
    private String customerName;
    private String mobileNumber;
    private String email;
    private Integer numberOfItems;
    private String priority;
    private String status;
    private Integer queuePosition;
    private Integer estimatedWaitMinutes;
    private String joinedAt;
    private String calledAt;
    private String serviceStartedAt;
    private String serviceEndedAt;
    private String trialRoomId;
    private String trialRoomNumber;
    private String storeId;
}
