package com.trialroom.service;

import com.trialroom.dto.request.JoinQueueRequest;
import com.trialroom.dto.request.QueueActionRequest;
import com.trialroom.dto.response.QueueEntryResponse;
import com.trialroom.dto.response.QueueStatusResponse;
import com.trialroom.entity.*;
import com.trialroom.exception.BadRequestException;
import com.trialroom.exception.ResourceNotFoundException;
import com.trialroom.notification.NotificationService;
import com.trialroom.prediction.PredictionInput;
import com.trialroom.prediction.PredictionResult;
import com.trialroom.prediction.PredictionService;
import com.trialroom.repository.*;
import com.trialroom.websocket.WebSocketBroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueService {

    private final QueueEntryRepository queueEntryRepository;
    private final QueueEventRepository queueEventRepository;
    private final StoreRepository storeRepository;
    private final TrialRoomRepository trialRoomRepository;
    private final ServiceSessionRepository serviceSessionRepository;
    private final UserRepository userRepository;
    private final PredictionService predictionService;
    private final NotificationService notificationService;
    private final WebSocketBroadcastService broadcastService;

    // Priority order: lower = higher priority
    private static final Map<String, Integer> PRIORITY_ORDER = Map.of(
        "APPOINTMENT",    1,
        "VIP",            2,
        "SENIOR_CITIZEN", 3,
        "NORMAL",         4
    );

    @Transactional
    public QueueStatusResponse joinQueue(JoinQueueRequest request) {
        Store store = storeRepository.findById(UUID.fromString(request.getStoreId()))
            .filter(Store::getIsActive)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found or inactive: " + request.getStoreId()));

        // Validate priority — customers can only self-assign NORMAL or SENIOR_CITIZEN
        String priority = request.getPriority();
        if (priority == null || (!priority.equals("NORMAL") && !priority.equals("SENIOR_CITIZEN"))) {
            priority = "NORMAL";
        }

        // Generate unique token for today
        String token = generateToken(store.getId());

        // Count current WAITING queue ahead (considering priority)
        int waitingCount = queueEntryRepository.countByStoreIdAndStatus(store.getId(), "WAITING");
        int calledCount  = queueEntryRepository.countByStoreIdAndStatus(store.getId(), "CALLED");
        int peopleAhead  = waitingCount + calledCount;
        int position     = peopleAhead + 1;

        // Active trial rooms for prediction
        int availableRooms = (int) trialRoomRepository.countByStoreIdAndStatus(store.getId(), "AVAILABLE");
        int occupiedRooms  = (int) trialRoomRepository.countByStoreIdAndStatus(store.getId(), "OCCUPIED");
        int activeRooms    = Math.max(occupiedRooms + availableRooms, 1);

        // Get avg service time from recent history (fall back to default)
        double avgServiceTime = getAvgServiceTime(store.getId());

        LocalDateTime now = LocalDateTime.now();
        PredictionResult prediction = predictionService.predict(PredictionInput.builder()
            .peopleAhead(peopleAhead)
            .activeRooms(activeRooms)
            .avgServiceTimeMinutes(avgServiceTime)
            .dayOfWeek(now.getDayOfWeek().getValue())
            .hourOfDay(now.getHour())
            .numberOfItems(request.getNumberOfItems() != null ? request.getNumberOfItems() : 1)
            .currentOccupancy(occupiedRooms)
            .build());

        QueueEntry entry = QueueEntry.builder()
            .store(store)
            .token(token)
            .customerName(request.getCustomerName())
            .mobileNumber(request.getMobileNumber())
            .email(request.getEmail())
            .numberOfItems(request.getNumberOfItems() != null ? request.getNumberOfItems() : 1)
            .priority(priority)
            .status("WAITING")
            .queuePosition(position)
            .estimatedWaitMinutes(prediction.getEstimatedMinutes())
            .joinedAt(now)
            .build();

        queueEntryRepository.save(entry);

        // Record event
        recordEvent(entry, "JOINED", null, null);

        // Notify customer
        notificationService.sendQueueJoined(entry);

        // Broadcast to staff and display
        broadcastQueueChange(store.getId().toString());

        // Get currently serving token
        String currentlyServing = getCurrentlyServingToken(store.getId());

        return QueueStatusResponse.builder()
            .entryId(entry.getId().toString())
            .token(token)
            .customerName(entry.getCustomerName())
            .storeId(store.getId().toString())
            .storeName(store.getName())
            .queuePosition(position)
            .peopleAhead(peopleAhead)
            .estimatedWaitMinutes(prediction.getEstimatedMinutes())
            .status("WAITING")
            .currentlyServingToken(currentlyServing)
            .availableRooms(availableRooms)
            .occupiedRooms(occupiedRooms)
            .explanation(prediction.getExplanation())
            .joinedAt(now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .priority(priority)
            .build();
    }

    @Transactional(readOnly = true)
    public QueueStatusResponse getQueueStatus(String token) {
        QueueEntry entry = queueEntryRepository.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found for token: " + token));

        UUID storeId = entry.getStore().getId();

        // Recalculate live position
        int livePosition = calculateLivePosition(entry);
        int peopleAhead  = Math.max(livePosition - 1, 0);

        int availableRooms = (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "AVAILABLE");
        int occupiedRooms  = (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "OCCUPIED");
        int activeRooms    = Math.max(occupiedRooms + availableRooms, 1);
        double avgServiceTime = getAvgServiceTime(storeId);

        LocalDateTime now = LocalDateTime.now();
        PredictionResult prediction = predictionService.predict(PredictionInput.builder()
            .peopleAhead(peopleAhead)
            .activeRooms(activeRooms)
            .avgServiceTimeMinutes(avgServiceTime)
            .dayOfWeek(now.getDayOfWeek().getValue())
            .hourOfDay(now.getHour())
            .numberOfItems(entry.getNumberOfItems())
            .currentOccupancy(occupiedRooms)
            .build());

        String trialRoomNumber = entry.getTrialRoom() != null ? entry.getTrialRoom().getDisplayName() : null;
        String trialRoomId     = entry.getTrialRoom() != null ? entry.getTrialRoom().getId().toString() : null;
        String currentlyServing = getCurrentlyServingToken(storeId);

        return QueueStatusResponse.builder()
            .entryId(entry.getId().toString())
            .token(entry.getToken())
            .customerName(entry.getCustomerName())
            .storeId(storeId.toString())
            .storeName(entry.getStore().getName())
            .queuePosition(livePosition)
            .peopleAhead(peopleAhead)
            .estimatedWaitMinutes(prediction.getEstimatedMinutes())
            .status(entry.getStatus())
            .currentlyServingToken(currentlyServing)
            .availableRooms(availableRooms)
            .occupiedRooms(occupiedRooms)
            .trialRoomNumber(trialRoomNumber)
            .trialRoomId(trialRoomId)
            .explanation(prediction.getExplanation())
            .joinedAt(entry.getJoinedAt() != null
                ? entry.getJoinedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
            .priority(entry.getPriority())
            .build();
    }

    @Transactional
    public void cancelQueue(String token) {
        QueueEntry entry = queueEntryRepository.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found for token: " + token));

        if (List.of("COMPLETED", "CANCELLED", "NO_SHOW").contains(entry.getStatus())) {
            throw new BadRequestException("Cannot cancel entry with status: " + entry.getStatus());
        }

        entry.setStatus("CANCELLED");
        queueEntryRepository.save(entry);
        recordEvent(entry, "CANCELLED", null, "Customer self-cancelled");
        broadcastQueueChange(entry.getStore().getId().toString());
    }

    @Transactional
    public QueueEntryResponse callNext(String storeId, String staffUsername) {
        UUID storeUUID = UUID.fromString(storeId);
        User staff = staffUsername != null ? userRepository.findByUsername(staffUsername).orElse(null) : null;

        // Find next customer: priority order, then FIFO
        List<QueueEntry> waiting = queueEntryRepository
            .findByStoreIdAndStatus(storeUUID, "WAITING",
                Sort.by(Sort.Direction.ASC, "joinedAt"));

        if (waiting.isEmpty()) {
            throw new BadRequestException("No customers waiting in the queue");
        }

        // Sort by priority then joinedAt
        QueueEntry next = waiting.stream()
            .min(Comparator
                .comparingInt((QueueEntry e) -> PRIORITY_ORDER.getOrDefault(e.getPriority(), 99))
                .thenComparing(QueueEntry::getJoinedAt))
            .orElseThrow(() -> new BadRequestException("No customers waiting"));

        next.setStatus("CALLED");
        next.setCalledAt(LocalDateTime.now());
        queueEntryRepository.save(next);

        recordEvent(next, "CALLED", staff, "Customer called to trial room");
        notificationService.sendTurnCalled(next);

        broadcastQueueChange(storeId);
        broadcastService.broadcastTokenUpdate(next.getToken(), toQueueEntryResponse(next));

        return toQueueEntryResponse(next);
    }

    @Transactional
    public QueueEntryResponse startService(UUID entryId, String trialRoomId, String staffUsername) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry", "id", entryId));

        if (!"CALLED".equals(entry.getStatus()) && !"WAITING".equals(entry.getStatus())) {
            throw new BadRequestException("Cannot start service for entry with status: " + entry.getStatus());
        }

        TrialRoom room = trialRoomRepository.findById(UUID.fromString(trialRoomId))
            .orElseThrow(() -> new ResourceNotFoundException("Trial room", "id", trialRoomId));

        if (!"AVAILABLE".equals(room.getStatus())) {
            throw new BadRequestException("Trial room " + room.getDisplayName() + " is not available (status: " + room.getStatus() + ")");
        }

        User staff = staffUsername != null ? userRepository.findByUsername(staffUsername).orElse(null) : null;

        // Update entry
        entry.setStatus("SERVING");
        entry.setTrialRoom(room);
        entry.setServiceStartedAt(LocalDateTime.now());
        queueEntryRepository.save(entry);

        // Mark room as occupied
        room.setStatus("OCCUPIED");
        trialRoomRepository.save(room);

        // Create service session
        ServiceSession session = ServiceSession.builder()
            .queueEntry(entry)
            .trialRoom(room)
            .startedAt(LocalDateTime.now())
            .staff(staff)
            .build();
        serviceSessionRepository.save(session);

        recordEvent(entry, "SERVING_STARTED", staff, "Assigned to " + room.getDisplayName());

        broadcastQueueChange(entry.getStore().getId().toString());
        broadcastService.broadcastRoomUpdate(entry.getStore().getId().toString(), null);
        broadcastService.broadcastTokenUpdate(entry.getToken(), toQueueEntryResponse(entry));

        return toQueueEntryResponse(entry);
    }

    @Transactional
    public QueueEntryResponse completeService(UUID entryId, String staffUsername) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry", "id", entryId));

        if (!"SERVING".equals(entry.getStatus())) {
            throw new BadRequestException("Cannot complete entry with status: " + entry.getStatus());
        }

        User staff = staffUsername != null ? userRepository.findByUsername(staffUsername).orElse(null) : null;

        LocalDateTime endTime = LocalDateTime.now();
        entry.setStatus("COMPLETED");
        entry.setServiceEndedAt(endTime);
        queueEntryRepository.save(entry);

        // Free the trial room
        if (entry.getTrialRoom() != null) {
            TrialRoom room = entry.getTrialRoom();
            room.setStatus("AVAILABLE");
            trialRoomRepository.save(room);
        }

        // Update service session
        serviceSessionRepository.findByQueueEntryId(entryId).ifPresent(session -> {
            session.setEndedAt(endTime);
            if (session.getStartedAt() != null) {
                long minutes = java.time.Duration.between(session.getStartedAt(), endTime).toMinutes();
                session.setDurationMinutes((int) minutes);
            }
            serviceSessionRepository.save(session);
        });

        recordEvent(entry, "COMPLETED", staff, "Service completed");
        notificationService.sendSessionCompleted(entry);

        broadcastQueueChange(entry.getStore().getId().toString());
        broadcastService.broadcastRoomUpdate(entry.getStore().getId().toString(), null);
        broadcastService.broadcastTokenUpdate(entry.getToken(), toQueueEntryResponse(entry));

        return toQueueEntryResponse(entry);
    }

    @Transactional
    public QueueEntryResponse skipCustomer(UUID entryId, String staffUsername) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry", "id", entryId));

        User staff = staffUsername != null ? userRepository.findByUsername(staffUsername).orElse(null) : null;

        entry.setStatus("SKIPPED");
        queueEntryRepository.save(entry);
        recordEvent(entry, "SKIPPED", staff, "Customer skipped");

        broadcastQueueChange(entry.getStore().getId().toString());
        return toQueueEntryResponse(entry);
    }

    @Transactional
    public QueueEntryResponse recallCustomer(UUID entryId, String staffUsername) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry", "id", entryId));

        User staff = staffUsername != null ? userRepository.findByUsername(staffUsername).orElse(null) : null;

        entry.setStatus("CALLED");
        entry.setCalledAt(LocalDateTime.now());
        queueEntryRepository.save(entry);
        recordEvent(entry, "RECALLED", staff, "Customer recalled");
        notificationService.sendTurnCalled(entry);

        broadcastQueueChange(entry.getStore().getId().toString());
        broadcastService.broadcastTokenUpdate(entry.getToken(), toQueueEntryResponse(entry));
        return toQueueEntryResponse(entry);
    }

    @Transactional
    public QueueEntryResponse markNoShow(UUID entryId, String staffUsername) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Queue entry", "id", entryId));

        User staff = staffUsername != null ? userRepository.findByUsername(staffUsername).orElse(null) : null;

        entry.setStatus("NO_SHOW");
        queueEntryRepository.save(entry);
        recordEvent(entry, "NO_SHOW", staff, "Customer marked as no-show");

        broadcastQueueChange(entry.getStore().getId().toString());
        return toQueueEntryResponse(entry);
    }

    @Transactional(readOnly = true)
    public List<QueueEntryResponse> getLiveQueue(UUID storeId) {
        List<QueueEntry> active = queueEntryRepository.findByStoreIdAndStatusIn(
            storeId,
            List.of("WAITING", "CALLED", "SERVING"),
            Sort.by(Sort.Direction.ASC, "joinedAt")
        );
        return active.stream()
            .sorted(Comparator
                .comparingInt((QueueEntry e) -> statusOrder(e.getStatus()))
                .thenComparingInt(e -> PRIORITY_ORDER.getOrDefault(e.getPriority(), 99))
                .thenComparing(QueueEntry::getJoinedAt))
            .map(this::toQueueEntryResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QueueStatusResponse getQueuePublicStatus(UUID storeId) {
        storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store", "id", storeId));

        int waitingCount   = queueEntryRepository.countByStoreIdAndStatus(storeId, "WAITING");
        int availableRooms = (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "AVAILABLE");
        int occupiedRooms  = (int) trialRoomRepository.countByStoreIdAndStatus(storeId, "OCCUPIED");
        String currentlyServing = getCurrentlyServingToken(storeId);

        return QueueStatusResponse.builder()
            .storeId(storeId.toString())
            .queuePosition(waitingCount)
            .peopleAhead(waitingCount)
            .availableRooms(availableRooms)
            .occupiedRooms(occupiedRooms)
            .currentlyServingToken(currentlyServing)
            .status("OPEN")
            .build();
    }

    // ===== PRIVATE HELPERS =====

    private String generateToken(UUID storeId) {
        // Count entries created today for this store to get sequential number
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        int todayCount = queueEntryRepository.countByStoreIdAndCreatedAtAfter(storeId, startOfDay);
        int nextNumber = todayCount + 1;
        return "TR-" + String.format("%03d", nextNumber);
    }

    private int calculateLivePosition(QueueEntry entry) {
        if (!"WAITING".equals(entry.getStatus())) return 0;
        List<QueueEntry> ahead = queueEntryRepository.findByStoreIdAndStatus(
            entry.getStore().getId(), "WAITING", Sort.by(Sort.Direction.ASC, "joinedAt"));

        AtomicInteger pos = new AtomicInteger(0);
        for (QueueEntry e : ahead) {
            if (e.getId().equals(entry.getId())) break;
            // Count only entries with higher or equal priority that joined earlier
            if (PRIORITY_ORDER.getOrDefault(e.getPriority(), 99)
                    <= PRIORITY_ORDER.getOrDefault(entry.getPriority(), 99)) {
                pos.incrementAndGet();
            }
        }
        return pos.get() + 1;
    }

    private String getCurrentlyServingToken(UUID storeId) {
        return queueEntryRepository.findByStoreIdAndStatus(storeId, "SERVING",
            Sort.by(Sort.Direction.DESC, "serviceStartedAt"))
            .stream().findFirst()
            .map(QueueEntry::getToken)
            .orElse(null);
    }

    private double getAvgServiceTime(UUID storeId) {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(7);
            Double avg = serviceSessionRepository.findAvgDurationByStoreIdSince(storeId, since);
            return (avg != null && avg > 0) ? avg : 8.0;
        } catch (Exception e) {
            return 8.0;
        }
    }

    private void recordEvent(QueueEntry entry, String eventType, User performedBy, String notes) {
        QueueEvent event = QueueEvent.builder()
            .queueEntry(entry)
            .eventType(eventType)
            .performedBy(performedBy)
            .notes(notes)
            .build();
        queueEventRepository.save(event);
    }

    private void broadcastQueueChange(String storeId) {
        try {
            UUID storeUUID = UUID.fromString(storeId);
            List<QueueEntryResponse> liveQueue = getLiveQueue(storeUUID);
            broadcastService.broadcastQueueUpdate(storeId, liveQueue);
            broadcastService.broadcastDisplayUpdate(storeId, buildDisplayPayload(storeUUID, liveQueue));
        } catch (Exception e) {
            log.error("Failed to broadcast queue change: {}", e.getMessage());
        }
    }

    private Object buildDisplayPayload(UUID storeId, List<QueueEntryResponse> liveQueue) {
        String currentlyServing = liveQueue.stream()
            .filter(e -> "SERVING".equals(e.getStatus()))
            .findFirst().map(QueueEntryResponse::getToken).orElse(null);

        List<String> nextTokens = liveQueue.stream()
            .filter(e -> "WAITING".equals(e.getStatus()) || "CALLED".equals(e.getStatus()))
            .limit(4)
            .map(QueueEntryResponse::getToken)
            .collect(Collectors.toList());

        return Map.of(
            "currentlyServing", currentlyServing != null ? currentlyServing : "",
            "nextTokens", nextTokens,
            "waitingCount", liveQueue.stream().filter(e -> "WAITING".equals(e.getStatus())).count()
        );
    }

    private int statusOrder(String status) {
        return switch (status) {
            case "SERVING"  -> 1;
            case "CALLED"   -> 2;
            case "WAITING"  -> 3;
            default         -> 4;
        };
    }

    private QueueEntryResponse toQueueEntryResponse(QueueEntry entry) {
        return QueueEntryResponse.builder()
            .id(entry.getId().toString())
            .token(entry.getToken())
            .customerName(entry.getCustomerName())
            .mobileNumber(entry.getMobileNumber())
            .email(entry.getEmail())
            .numberOfItems(entry.getNumberOfItems())
            .priority(entry.getPriority())
            .status(entry.getStatus())
            .queuePosition(entry.getQueuePosition())
            .estimatedWaitMinutes(entry.getEstimatedWaitMinutes())
            .joinedAt(entry.getJoinedAt() != null
                ? entry.getJoinedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
            .calledAt(entry.getCalledAt() != null
                ? entry.getCalledAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
            .serviceStartedAt(entry.getServiceStartedAt() != null
                ? entry.getServiceStartedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
            .serviceEndedAt(entry.getServiceEndedAt() != null
                ? entry.getServiceEndedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
            .trialRoomId(entry.getTrialRoom() != null ? entry.getTrialRoom().getId().toString() : null)
            .trialRoomNumber(entry.getTrialRoom() != null ? entry.getTrialRoom().getDisplayName() : null)
            .storeId(entry.getStore().getId().toString())
            .build();
    }
}
