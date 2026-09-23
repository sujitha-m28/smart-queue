package com.trialroom.repository;

import com.trialroom.entity.CustomerFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, UUID> {

    Optional<CustomerFeedback> findByQueueEntryId(UUID queueEntryId);

    @Query("SELECT cf FROM CustomerFeedback cf " +
           "WHERE cf.queueEntry.store.id = :storeId " +
           "AND cf.createdAt BETWEEN :start AND :end")
    List<CustomerFeedback> findByStoreIdAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(cf.rating) FROM CustomerFeedback cf " +
           "WHERE cf.queueEntry.store.id = :storeId " +
           "AND cf.createdAt BETWEEN :start AND :end")
    Double findAvgRatingByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
