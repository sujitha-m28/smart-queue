package com.trialroom.dto.request;

import jakarta.validation.constraints.*;

public class JoinQueueRequest {

    @NotBlank(message = "Store ID is required")
    private String storeId;

    @NotBlank(message = "Customer name is required")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String customerName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String mobileNumber;

    @Email(message = "Please enter a valid email address")
    private String email;

    @Min(value = 1, message = "Number of items must be at least 1")
    @Max(value = 15, message = "Maximum 15 items allowed")
    private Integer numberOfItems = 1;

    private String priority = "NORMAL";
    private String appointmentId;

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getNumberOfItems() { return numberOfItems; }
    public void setNumberOfItems(Integer numberOfItems) { this.numberOfItems = numberOfItems; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
}
