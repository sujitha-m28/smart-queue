package com.trialroom;

import com.trialroom.prediction.PredictionInput;
import com.trialroom.prediction.PredictionResult;
import com.trialroom.prediction.PredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PredictionServiceTest {

    private PredictionService predictionService;

    @BeforeEach
    void setUp() {
        predictionService = new PredictionService();
        // Inject values normally done by Spring
        try {
            var secretField = PredictionService.class.getDeclaredField("defaultAvgServiceTime");
            secretField.setAccessible(true);
            secretField.set(predictionService, 8.0);

            var multiplierField = PredictionService.class.getDeclaredField("peakMultiplier");
            multiplierField.setAccessible(true);
            multiplierField.set(predictionService, 1.4);
        } catch (Exception e) {
            // Fields will use defaults
        }
    }

    @Test
    @DisplayName("No people ahead — wait time should be 0")
    void zeroWaitWhenNoOneAhead() {
        PredictionInput input = PredictionInput.builder()
            .peopleAhead(0).activeRooms(2).avgServiceTimeMinutes(8)
            .dayOfWeek(3).hourOfDay(10).numberOfItems(1).build();
        PredictionResult result = predictionService.predict(input);
        assertThat(result.getEstimatedMinutes()).isEqualTo(0);
    }

    @Test
    @DisplayName("5 people ahead, 3 rooms — reasonable wait time")
    void calculateWaitWithPeopleAndRooms() {
        PredictionInput input = PredictionInput.builder()
            .peopleAhead(5).activeRooms(3).avgServiceTimeMinutes(9)
            .dayOfWeek(3).hourOfDay(10).numberOfItems(1).build();
        PredictionResult result = predictionService.predict(input);
        // Expected: 5 * 9 / 3 = 15 minutes (off-peak multiplier = 1.0)
        assertThat(result.getEstimatedMinutes()).isBetween(12, 20);
    }

    @Test
    @DisplayName("Peak hour (Saturday evening) increases estimated time")
    void peakHourIncreasesWait() {
        PredictionInput offPeak = PredictionInput.builder()
            .peopleAhead(5).activeRooms(2).avgServiceTimeMinutes(8)
            .dayOfWeek(3).hourOfDay(10).numberOfItems(1).build();
        PredictionInput peak = PredictionInput.builder()
            .peopleAhead(5).activeRooms(2).avgServiceTimeMinutes(8)
            .dayOfWeek(6).hourOfDay(18).numberOfItems(1).build();

        int offPeakWait = predictionService.predict(offPeak).getEstimatedMinutes();
        int peakWait = predictionService.predict(peak).getEstimatedMinutes();

        assertThat(peakWait).isGreaterThan(offPeakWait);
    }

    @Test
    @DisplayName("More items increases wait time")
    void moreItemsIncreasesWait() {
        PredictionInput oneItem = PredictionInput.builder()
            .peopleAhead(3).activeRooms(2).avgServiceTimeMinutes(8)
            .dayOfWeek(2).hourOfDay(11).numberOfItems(1).build();
        PredictionInput fiveItems = PredictionInput.builder()
            .peopleAhead(3).activeRooms(2).avgServiceTimeMinutes(8)
            .dayOfWeek(2).hourOfDay(11).numberOfItems(5).build();

        int oneItemWait = predictionService.predict(oneItem).getEstimatedMinutes();
        int fiveItemWait = predictionService.predict(fiveItems).getEstimatedMinutes();

        assertThat(fiveItemWait).isGreaterThan(oneItemWait);
    }

    @Test
    @DisplayName("No divide by zero when activeRooms is 0")
    void handlesZeroRooms() {
        PredictionInput input = PredictionInput.builder()
            .peopleAhead(5).activeRooms(0).avgServiceTimeMinutes(8)
            .dayOfWeek(2).hourOfDay(10).numberOfItems(1).build();
        PredictionResult result = predictionService.predict(input);
        // Should not throw, result should be > 0
        assertThat(result.getEstimatedMinutes()).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("Explanation is not empty")
    void explanationNotEmpty() {
        PredictionInput input = PredictionInput.builder()
            .peopleAhead(3).activeRooms(2).avgServiceTimeMinutes(8)
            .dayOfWeek(2).hourOfDay(10).numberOfItems(2).build();
        PredictionResult result = predictionService.predict(input);
        assertThat(result.getExplanation()).isNotBlank();
    }
}
