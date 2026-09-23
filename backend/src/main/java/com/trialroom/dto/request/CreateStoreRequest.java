package com.trialroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateStoreRequest {
    @NotBlank(message = "Store name is required")
    private String name;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
}
