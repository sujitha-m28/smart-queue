package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {
    private String id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private Boolean isActive;
    private Integer totalRooms;
    private Integer availableRooms;
}
