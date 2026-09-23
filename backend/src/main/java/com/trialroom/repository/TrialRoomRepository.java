package com.trialroom.repository;

import com.trialroom.entity.TrialRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrialRoomRepository extends JpaRepository<TrialRoom, UUID> {

    List<TrialRoom> findByStoreId(UUID storeId);

    List<TrialRoom> findByStoreIdAndStatus(UUID storeId, String status);

    long countByStoreIdAndStatus(UUID storeId, String status);

    @Query("SELECT tr FROM TrialRoom tr WHERE tr.store.id = :storeId AND tr.status IN :statuses")
    List<TrialRoom> findByStoreIdAndStatusIn(@Param("storeId") UUID storeId,
                                              @Param("statuses") List<String> statuses);
}
