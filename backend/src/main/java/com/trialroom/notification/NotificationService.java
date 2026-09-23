package com.trialroom.notification;

import com.trialroom.entity.Notification;
import com.trialroom.entity.QueueEntry;
import com.trialroom.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Mock notification service.
 * Logs notifications to the console and saves records to the database.
 * No real SMS/email is sent.
 *
 * To enable real notifications, implement an SMS or Email NotificationService
 * and configure notification.provider=sms or notification.provider=email.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void sendQueueJoined(QueueEntry entry) {
        String message = String.format(
            "Your Smart Trial Room token is %s. You are #%d in queue. Estimated wait: %d minutes.",
            entry.getToken(), entry.getQueuePosition(), entry.getEstimatedWaitMinutes()
        );
        send(entry, "QUEUE_JOINED", message);
    }

    public void sendTurnApproaching(QueueEntry entry) {
        String message = String.format(
            "Your turn is approaching! Token %s — please stay near the trial room area.",
            entry.getToken()
        );
        send(entry, "TURN_APPROACHING", message);
    }

    public void sendTurnCalled(QueueEntry entry) {
        String message = String.format(
            "Token %s is now being called. Please proceed to the trial room area immediately.",
            entry.getToken()
        );
        send(entry, "TURN_CALLED", message);
    }

    public void sendSessionCompleted(QueueEntry entry) {
        String message = "Thank you for using Smart Trial Room. We hope you had a great experience!";
        send(entry, "SESSION_COMPLETED", message);
    }

    private void send(QueueEntry entry, String type, String message) {
        log.info("[NOTIFICATION] [{}] To: {} ({}): {}",
                type, entry.getCustomerName(), entry.getMobileNumber(), message);

        Notification notification = Notification.builder()
                .queueEntry(entry)
                .notificationType(type)
                .channel("MOCK")
                .recipient(entry.getMobileNumber())
                .message(message)
                .status("SENT")
                .sentAt(LocalDateTime.now())
                .build();

        try {
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to save notification record: {}", e.getMessage());
        }
    }
}
