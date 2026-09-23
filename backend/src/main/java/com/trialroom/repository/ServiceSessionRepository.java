package com.trialroom.repository;

import com.trialroom.entity.ServiceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceSessionRepository extends JpaRepository<ServiceSession, UUID> {

    Optional<ServiceSession> findByQueueEntryId(UUID queueEntryId);

    List<ServiceSession> findByTrialRoomId(UUID trialRoomId);

    @Query("SELECT ss FROM ServiceSession ss " +
           "WHERE ss.queueEntry.store.id = :storeId " +
           "AND ss.startedAt BETWEEN :start AND :end")
    List<ServiceSession> findByStoreIdAndStartedAtBetween(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(ss.durationMinutes) FROM ServiceSession ss " +
           "WHERE ss.queueEntry.store.id = :storeId " +
           "AND ss.startedAt BETWEEN :start AND :end")
    Double findAvgDurationByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT AVG(ss.durationMinutes) FROM ServiceSession ss " +
           "WHERE ss.queueEntry.store.id = :storeId " +
           "AND ss.startedAt >= :since")
    Double findAvgDurationByStoreIdSince(
            @Param("storeId") UUID storeId,
            @Param("since") LocalDateTime since);

    @Query("SELECT ss.trialRoom.displayName, " +
           "  SUM(ss.durationMinutes) " +
           "FROM ServiceSession ss " +
           "WHERE ss.queueEntry.store.id = :storeId " +
           "AND ss.startedAt BETWEEN :start AND :end " +
           "GROUP BY ss.trialRoom.id, ss.trialRoom.displayName")
    List<Object[]> findRoomUtilizationByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
