package com.trialroom.controller;

import com.trialroom.dto.request.FeedbackRequest;
import com.trialroom.dto.response.ApiResponse;
import com.trialroom.entity.CustomerFeedback;
import com.trialroom.entity.QueueEntry;
import com.trialroom.exception.BadRequestException;
import com.trialroom.exception.ConflictException;
import com.trialroom.exception.ResourceNotFoundException;
import com.trialroom.repository.CustomerFeedbackRepository;
import com.trialroom.repository.QueueEntryRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final CustomerFeedbackRepository feedbackRepository;
    private final QueueEntryRepository queueEntryRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        UUID entryId = UUID.fromString(request.getQueueEntryId());

        QueueEntry entry = queueEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry", "id", entryId));

        if (!"COMPLETED".equals(entry.getStatus())) {
            throw new BadRequestException("Feedback can only be submitted after session is completed");
        }

        if (feedbackRepository.findByQueueEntryId(entryId).isPresent()) {
            throw new ConflictException("Feedback has already been submitted for this session");
        }

        CustomerFeedback feedback = CustomerFeedback.builder()
            .queueEntry(entry)
            .rating(request.getRating())
            .comments(request.getComments())
            .build();
        feedbackRepository.save(feedback);

        return ResponseEntity.status(201).body(ApiResponse.success("Feedback submitted. Thank you!", null));
    }

    @GetMapping("/{storeId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFeedbackByStore(
            @PathVariable UUID storeId) {
        List<Map<String, Object>> feedback = feedbackRepository.findAll().stream()
            .filter(f -> f.getQueueEntry().getStore().getId().equals(storeId))
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(100)
            .map(f -> Map.<String, Object>of(
                "id", f.getId().toString(),
                "rating", f.getRating(),
                "comments", f.getComments() != null ? f.getComments() : "",
                "token", f.getQueueEntry().getToken(),
                "createdAt", f.getCreatedAt().toString()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(feedback));
    }
}
