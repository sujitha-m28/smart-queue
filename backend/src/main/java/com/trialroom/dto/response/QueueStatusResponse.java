package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueStatusResponse {
    private String entryId;
    private String token;
    private String customerName;
    private String storeId;
    private String storeName;
    private Integer queuePosition;
    private Integer peopleAhead;
    private Integer estimatedWaitMinutes;
    private String status;
    private String currentlyServingToken;
    private Integer availableRooms;
    private Integer occupiedRooms;
    private String trialRoomNumber;
    private String trialRoomId;
    private String explanation;
    private String joinedAt;
    private String priority;
}
