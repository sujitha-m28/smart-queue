package com.trialroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private String reportId;
    private String reportType;
    private String reportDate;
    private String content;
    private Integer totalCustomers;
    private Integer completedSessions;
    private Integer cancelledSessions;
    private Double avgWaitMinutes;
    private Double avgServiceMinutes;
    private String peakHour;
    private LocalDateTime generatedAt;
}
