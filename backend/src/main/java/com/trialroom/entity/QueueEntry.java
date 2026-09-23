package com.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "queue_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false, unique = true, length = 20)
    private String token;

    @Column(name = "customer_name", nullable = false, length = 255)
    private String customerName;

    @Column(name = "mobile_number", nullable = false, length = 20)
    private String mobileNumber;

    @Column(length = 255)
    private String email;

    @Column(name = "number_of_items")
    @Builder.Default
    private Integer numberOfItems = 1;

    /**
     * Priority: NORMAL | SENIOR_CITIZEN | VIP | APPOINTMENT
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "NORMAL";

    /**
     * Status: WAITING | CALLED | SERVING | COMPLETED | SKIPPED | CANCELLED | NO_SHOW
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "WAITING";

    @Column(name = "queue_position")
    private Integer queuePosition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trial_room_id")
    private TrialRoom trialRoom;

    @Column(name = "estimated_wait_minutes")
    private Integer estimatedWaitMinutes;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "service_started_at")
    private LocalDateTime serviceStartedAt;

    @Column(name = "service_ended_at")
    private LocalDateTime serviceEndedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (joinedAt == null) joinedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
