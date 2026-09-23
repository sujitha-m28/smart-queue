package com.trialroom.prediction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionInput {
    private int peopleAhead;
    private int activeRooms;
    private double avgServiceTimeMinutes;
    private int dayOfWeek;      // 1=Monday...7=Sunday
    private int hourOfDay;      // 0-23
    private int numberOfItems;
    private int currentOccupancy;
}
