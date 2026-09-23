package com.trialroom.repository;

import com.trialroom.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    List<AiConversation> findByQueueEntryId(UUID queueEntryId);

    List<AiConversation> findByUserId(UUID userId);
}
