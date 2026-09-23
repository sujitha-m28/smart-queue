package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrialRoomResponse {
    private String id;
    private String storeId;
    private String roomNumber;
    private String displayName;
    private String status;
    private Integer maxItems;
    private String notes;
    private String currentCustomerToken;
}
