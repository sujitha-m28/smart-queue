package com.trialroom.prediction;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Rule-based waiting time prediction service.
 *
 * Algorithm:
 *   baseTime = peopleAhead × avgServiceTime / max(activeRooms, 1)
 *   peakMultiplier = getPeakMultiplier(dayOfWeek, hourOfDay)
 *   itemAdjustment = (numberOfItems - 1) × 1.5 minutes
 *   estimated = (baseTime × peakMultiplier) + itemAdjustment
 *
 * This implementation is intentionally stateless and deterministic.
 * It does NOT use a machine-learning model.
 *
 * TODO (Future Enhancement): Replace this class with an MLPredictionService
 * that loads a trained XGBoost or similar model.
 * Switch by adding @ConditionalOnProperty(name="app.prediction.provider", havingValue="ml")
 * and making this class @ConditionalOnProperty(..., havingValue="rule-based").
 */
@Service
public class PredictionService {

    @Value("${app.prediction.avg-service-time-minutes:8}")
    private double defaultAvgServiceTime;

    @Value("${app.prediction.peak-multiplier:1.4}")
    private double peakMultiplier;

    public PredictionResult predict(PredictionInput input) {
        double avgServiceTime = input.getAvgServiceTimeMinutes() > 0
                ? input.getAvgServiceTimeMinutes()
                : defaultAvgServiceTime;

        int rooms = Math.max(input.getActiveRooms(), 1);
        double baseTime = (double) input.getPeopleAhead() * avgServiceTime / rooms;

        double multiplier = getPeakMultiplier(input.getDayOfWeek(), input.getHourOfDay());
        double itemAdjustment = (input.getNumberOfItems() - 1) * 1.5;

        int estimated = (int) Math.round(baseTime * multiplier + itemAdjustment);
        estimated = Math.max(estimated, 0);

        double confidence = calculateConfidence(input.getPeopleAhead(), rooms);

        String explanation = buildExplanation(input, avgServiceTime, estimated);

        return PredictionResult.builder()
                .estimatedMinutes(estimated)
                .confidence(confidence)
                .explanation(explanation)
                .build();
    }

    /**
     * Peak hour multipliers based on typical retail patterns.
     * Weekends and lunch/evening hours have higher multipliers.
     */
    private double getPeakMultiplier(int dayOfWeek, int hourOfDay) {
        boolean isWeekend = (dayOfWeek == 6 || dayOfWeek == 7);
        boolean isLunchPeak = (hourOfDay >= 12 && hourOfDay <= 14);
        boolean isEveningPeak = (hourOfDay >= 17 && hourOfDay <= 20);

        if (isWeekend && (isLunchPeak || isEveningPeak)) return peakMultiplier;
        if (isWeekend) return 1.2;
        if (isEveningPeak) return 1.3;
        if (isLunchPeak) return 1.1;
        return 1.0;
    }

    /**
     * Higher confidence when queue is shorter and more rooms are active.
     */
    private double calculateConfidence(int peopleAhead, int activeRooms) {
        if (peopleAhead == 0) return 0.95;
        if (peopleAhead <= 3 && activeRooms >= 2) return 0.85;
        if (peopleAhead <= 6) return 0.75;
        if (peopleAhead <= 10) return 0.65;
        return 0.50;
    }

    private String buildExplanation(PredictionInput input, double avgServiceTime, int estimated) {
        if (input.getPeopleAhead() == 0) {
            return "No one is ahead of you. You may be called very soon.";
        }
        return String.format(
            "Estimated based on %d people ahead, %d active trial room(s), and an average service time of %.0f min. " +
            "Prediction uses current queue size and historical patterns.",
            input.getPeopleAhead(),
            input.getActiveRooms(),
            avgServiceTime
        );
    }
}
