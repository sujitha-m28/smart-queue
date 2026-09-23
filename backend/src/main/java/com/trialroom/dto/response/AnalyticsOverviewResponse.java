package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewResponse {
    private Integer totalToday;
    private Integer waitingNow;
    private Integer servedToday;
    private Integer completedToday;
    private Integer cancelledToday;
    private Double avgWaitMinutes;
    private Double avgServiceMinutes;
    private String peakHour;
    private Double satisfactionRating;
    private Integer activeRooms;
    private Integer availableRooms;
    private Integer totalRooms;
    private Long totalThisPeriod;
    private Double avgWaitThisPeriod;
}
