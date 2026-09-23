package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyDataPoint {
    private Integer hour;
    private String label;
    private Long count;
    private Double avgWaitMinutes;
    private Double avgServiceMinutes;
}
