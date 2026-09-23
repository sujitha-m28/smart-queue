package com.trialroom.repository;

import com.trialroom.entity.QueueEntry;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, UUID> {

    Optional<QueueEntry> findByToken(String token);

    List<QueueEntry> findByStoreIdAndStatusIn(UUID storeId, List<String> statuses, Sort sort);

    List<QueueEntry> findByStoreIdAndStatus(UUID storeId, String status);

    List<QueueEntry> findByStoreIdAndStatus(UUID storeId, String status, Sort sort);

    int countByStoreIdAndStatus(UUID storeId, String status);

    int countByStoreIdAndCreatedAtAfter(UUID storeId, LocalDateTime after);

    long countByStoreIdAndStatusIn(UUID storeId, List<String> statuses);

    Optional<QueueEntry> findTopByStoreIdOrderByQueuePositionDesc(UUID storeId);

    List<QueueEntry> findByStoreIdAndStatusAndJoinedAtBetween(
            UUID storeId, String status, LocalDateTime start, LocalDateTime end);

    List<QueueEntry> findByStoreIdAndJoinedAtBetween(
            UUID storeId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(qe) FROM QueueEntry qe WHERE qe.store.id = :storeId " +
           "AND qe.status IN :statuses AND qe.joinedAt BETWEEN :start AND :end")
    long countByStoreIdAndStatusInAndJoinedAtBetween(
            @Param("storeId") UUID storeId,
            @Param("statuses") List<String> statuses,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('HOUR', qe.joinedAt) AS hour, COUNT(qe) AS cnt " +
           "FROM QueueEntry qe " +
           "WHERE qe.store.id = :storeId AND qe.joinedAt BETWEEN :start AND :end " +
           "GROUP BY FUNCTION('HOUR', qe.joinedAt) " +
           "ORDER BY cnt DESC")
    List<Object[]> findHourlyCountsByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(qe.estimatedWaitMinutes) FROM QueueEntry qe " +
           "WHERE qe.store.id = :storeId AND qe.status = 'COMPLETED' " +
           "AND qe.joinedAt BETWEEN :start AND :end")
    Double findAvgWaitMinutesByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT qe FROM QueueEntry qe " +
           "WHERE qe.store.id = :storeId AND qe.status = 'WAITING' " +
           "ORDER BY " +
           "  CASE qe.priority " +
           "    WHEN 'APPOINTMENT'    THEN 1 " +
           "    WHEN 'VIP'           THEN 2 " +
           "    WHEN 'SENIOR_CITIZEN' THEN 3 " +
           "    ELSE 4 " +
           "  END ASC, qe.joinedAt ASC")
    List<QueueEntry> findNextWaitingByPriorityAndFifo(@Param("storeId") UUID storeId);

    @Query("SELECT CAST(qe.joinedAt AS date), COUNT(qe) FROM QueueEntry qe " +
           "WHERE qe.store.id = :storeId AND qe.joinedAt BETWEEN :start AND :end " +
           "GROUP BY CAST(qe.joinedAt AS date) ORDER BY CAST(qe.joinedAt AS date)")
    List<Object[]> findDailyCountsByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
