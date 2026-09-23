package com.trialroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateRoomRequest {
    @NotBlank(message = "Store ID is required")
    private String storeId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    private String displayName;
    private Integer maxItems = 5;
    private String notes;
}
