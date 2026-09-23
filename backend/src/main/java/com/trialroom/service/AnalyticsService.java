package com.trialroom.service;

import com.trialroom.dto.response.AnalyticsOverviewResponse;
import com.trialroom.dto.response.HourlyDataPoint;
import com.trialroom.repository.CustomerFeedbackRepository;
import com.trialroom.repository.QueueEntryRepository;
import com.trialroom.repository.ServiceSessionRepository;
import com.trialroom.repository.TrialRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsService {

    private final QueueEntryRepository queueEntryRepository;
    private final ServiceSessionRepository serviceSessionRepository;
    private final CustomerFeedbackRepository feedbackRepository;
    private final TrialRoomRepository trialRoomRepository;

    public AnalyticsOverviewResponse getOverview(UUID storeId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end   = date.atTime(LocalTime.MAX);

        int totalToday     = (int) queueEntryRepository.countByStoreIdAndStatusInAndJoinedAtBetween(
            storeId, List.of("WAITING","CALLED","SERVING","COMPLETED","SKIPPED","CANCELLED","NO_SHOW"), start, end);
        int completedToday = (int) queueEntryRepository.countByStoreIdAndStatusInAndJoinedAtBetween(
            storeId, List.of("COMPLETED"), start, end);
        int cancelledToday = (int) queueEntryRepository.countByStoreIdAndStatusInAndJoinedAtBetween(
            storeId, List.of("CANCELLED"), start, end);

        int waitingNow   = queueEntryRepository.countByStoreIdAndStatus(storeId, "WAITING");
        int servedToday  = completedToday;

        Double avgWait    = queueEntryRepository.findAvgWaitMinutesByStoreAndDateRange(storeId, start, end);
        Double avgService = serviceSessionRepository.findAvgDurationByStoreAndDateRange(storeId, start, end);

        Double satisfaction = feedbackRepository.findAvgRatingByStoreAndDateRange(storeId, start, end);

        // Find peak hour
        List<Object[]> hourlyCounts = queueEntryRepository.findHourlyCountsByStoreAndDateRange(storeId,
            date.minusDays(7).atStartOfDay(), end);
        String peakHour = hourlyCounts.isEmpty() ? "N/A"
            : formatHour(((Number) hourlyCounts.get(0)[0]).intValue());

        int availableRooms = (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "AVAILABLE");
        int occupiedRooms  = (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "OCCUPIED");
        int totalRooms     = (int) trialRoomRepository.findByStoreId(storeId).size();

        return AnalyticsOverviewResponse.builder()
            .totalToday(totalToday)
            .waitingNow(waitingNow)
            .servedToday(servedToday)
            .completedToday(completedToday)
            .cancelledToday(cancelledToday)
            .avgWaitMinutes(avgWait != null ? Math.round(avgWait * 10.0) / 10.0 : 0)
            .avgServiceMinutes(avgService != null ? Math.round(avgService * 10.0) / 10.0 : 0)
            .peakHour(peakHour)
            .satisfactionRating(satisfaction != null ? Math.round(satisfaction * 10.0) / 10.0 : 0)
            .availableRooms(availableRooms)
            .activeRooms(occupiedRooms)
            .totalRooms(totalRooms)
            .totalThisPeriod((long) totalToday)
            .avgWaitThisPeriod(avgWait != null ? avgWait : 0)
            .build();
    }

    public List<HourlyDataPoint> getHourlyData(UUID storeId, LocalDate start, LocalDate end) {
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt   = end.atTime(LocalTime.MAX);

        List<Object[]> rawData = queueEntryRepository
            .findHourlyCountsByStoreAndDateRange(storeId, startDt, endDt);

        List<HourlyDataPoint> result = new ArrayList<>();
        for (Object[] row : rawData) {
            int hour  = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            result.add(HourlyDataPoint.builder()
                .hour(hour)
                .label(formatHour(hour))
                .count(count)
                .build());
        }
        // Fill missing hours with 0
        Set<Integer> presentHours = new HashSet<>();
        result.forEach(d -> presentHours.add(d.getHour()));
        for (int h = 9; h <= 22; h++) {
            if (!presentHours.contains(h)) {
                result.add(HourlyDataPoint.builder().hour(h).label(formatHour(h)).count(0L).build());
            }
        }
        result.sort(Comparator.comparingInt(HourlyDataPoint::getHour));
        return result;
    }

    public List<HourlyDataPoint> getPeakHours(UUID storeId, LocalDate start, LocalDate end) {
        List<HourlyDataPoint> hourlyData = getHourlyData(storeId, start, end);
        hourlyData.sort(Comparator.comparingLong(HourlyDataPoint::getCount).reversed());
        return hourlyData;
    }

    public Map<String, Object> getRoomUtilization(UUID storeId, LocalDate start, LocalDate end) {
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt   = end.atTime(LocalTime.MAX);

        List<Object[]> rows = serviceSessionRepository
            .findRoomUtilizationByStoreAndDateRange(storeId, startDt, endDt);

        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String roomName   = (String) row[0];
            Number totalMins  = (Number) row[1];
            result.put(roomName, totalMins != null ? totalMins.longValue() : 0);
        }
        return result;
    }

    public List<HourlyDataPoint> getWaitTimeSeries(UUID storeId, LocalDate start, LocalDate end) {
        return getHourlyData(storeId, start, end);
    }

    private String formatHour(int hour) {
        if (hour == 0)  return "12 AM";
        if (hour < 12)  return hour + " AM";
        if (hour == 12) return "12 PM";
        return (hour - 12) + " PM";
    }
}
