package com.trialroom.repository;

import com.trialroom.entity.QueueEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QueueEventRepository extends JpaRepository<QueueEvent, Long> {

    List<QueueEvent> findByQueueEntryId(UUID queueEntryId);

    List<QueueEvent> findByQueueEntryIdOrderByCreatedAtAsc(UUID queueEntryId);
}
