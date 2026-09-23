package com.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    /**
     * Type: DAILY | WEEKLY
     */
    @Column(name = "report_type", length = 20)
    @Builder.Default
    private String reportType = "DAILY";

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "report_content", columnDefinition = "TEXT")
    private String reportContent;

    @Column(name = "total_customers")
    private Integer totalCustomers;

    @Column(name = "completed_sessions")
    private Integer completedSessions;

    @Column(name = "cancelled_sessions")
    private Integer cancelledSessions;

    @Column(name = "avg_wait_minutes", precision = 5, scale = 2)
    private BigDecimal avgWaitMinutes;

    @Column(name = "avg_service_minutes", precision = 5, scale = 2)
    private BigDecimal avgServiceMinutes;

    @Column(name = "peak_hour", length = 10)
    private String peakHour;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private User generatedBy;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}
