package com.trialroom.controller;

import com.trialroom.ai.AIService;
import com.trialroom.dto.request.AiChatRequest;
import com.trialroom.dto.response.*;
import com.trialroom.service.AnalyticsService;
import com.trialroom.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
public class ManagerController {

    private final AnalyticsService analyticsService;
    private final AIService aiService;

    @GetMapping("/analytics/overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewResponse>> getOverview(
            @RequestParam String storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        AnalyticsOverviewResponse overview = analyticsService.getOverview(UUID.fromString(storeId), date);
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/analytics/hourly")
    public ResponseEntity<ApiResponse<List<HourlyDataPoint>>> getHourlyData(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<HourlyDataPoint> data = analyticsService.getHourlyData(UUID.fromString(storeId), start, end);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/analytics/peak-hours")
    public ResponseEntity<ApiResponse<List<HourlyDataPoint>>> getPeakHours(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<HourlyDataPoint> data = analyticsService.getPeakHours(UUID.fromString(storeId), start, end);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/analytics/room-utilization")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoomUtilization(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        Map<String, Object> data = analyticsService.getRoomUtilization(UUID.fromString(storeId), start, end);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/analytics/wait-time")
    public ResponseEntity<ApiResponse<List<HourlyDataPoint>>> getWaitTimeSeries(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<HourlyDataPoint> data = analyticsService.getWaitTimeSeries(UUID.fromString(storeId), start, end);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/ai/insight")
    public ResponseEntity<ApiResponse<AiChatResponse>> getManagerInsight(
            @RequestBody AiChatRequest request) {
        LocalDate today = LocalDate.now();
        AnalyticsOverviewResponse analytics = analyticsService.getOverview(
            UUID.fromString(request.getStoreId()), today);
        AiChatResponse response = aiService.managerInsight(request, analytics, request.getStoreId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/reports/daily")
    public ResponseEntity<ApiResponse<ReportResponse>> generateDailyReport(
            @RequestBody Map<String, String> body) {
        String storeId = body.get("storeId");
        LocalDate date = body.containsKey("date") ? LocalDate.parse(body.get("date")) : LocalDate.now();

        AnalyticsOverviewResponse analytics = analyticsService.getOverview(UUID.fromString(storeId), date);
        String content = aiService.generateDailyReport(analytics, date.toString(), "Azorte Demo Store");

        ReportResponse report = ReportResponse.builder()
            .reportType("DAILY")
            .reportDate(date.toString())
            .content(content)
            .totalCustomers(analytics.getTotalToday())
            .completedSessions(analytics.getCompletedToday())
            .cancelledSessions(analytics.getCancelledToday())
            .avgWaitMinutes(analytics.getAvgWaitMinutes())
            .avgServiceMinutes(analytics.getAvgServiceMinutes())
            .peakHour(analytics.getPeakHour())
            .generatedAt(java.time.LocalDateTime.now())
            .build();

        return ResponseEntity.ok(ApiResponse.success("Daily report generated", report));
    }

    @PostMapping("/reports/weekly")
    public ResponseEntity<ApiResponse<ReportResponse>> generateWeeklyReport(
            @RequestBody Map<String, String> body) {
        String storeId = body.get("storeId");
        LocalDate weekStart = body.containsKey("weekStart")
            ? LocalDate.parse(body.get("weekStart"))
            : LocalDate.now().minusDays(7);

        // Aggregate analytics for the week
        AnalyticsOverviewResponse analytics = analyticsService.getOverview(
            UUID.fromString(storeId), weekStart.plusDays(6));
        String content = aiService.generateWeeklyReport(analytics, weekStart.toString(), "Azorte Demo Store");

        ReportResponse report = ReportResponse.builder()
            .reportType("WEEKLY")
            .reportDate(weekStart.toString())
            .content(content)
            .totalCustomers(analytics.getTotalToday())
            .completedSessions(analytics.getCompletedToday())
            .cancelledSessions(analytics.getCancelledToday())
            .avgWaitMinutes(analytics.getAvgWaitMinutes())
            .avgServiceMinutes(analytics.getAvgServiceMinutes())
            .peakHour(analytics.getPeakHour())
            .generatedAt(java.time.LocalDateTime.now())
            .build();

        return ResponseEntity.ok(ApiResponse.success("Weekly report generated", report));
    }
}
