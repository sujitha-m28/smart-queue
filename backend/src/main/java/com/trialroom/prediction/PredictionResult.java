package com.trialroom.prediction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResult {
    private int estimatedMinutes;
    private double confidence;  // 0.0 to 1.0
    private String explanation;
}
