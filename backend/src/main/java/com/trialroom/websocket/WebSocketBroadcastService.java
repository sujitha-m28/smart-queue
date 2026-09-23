package com.trialroom.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    /** Broadcast queue state change to all subscribers watching the store queue */
    public void broadcastQueueUpdate(String storeId, Object payload) {
        String destination = "/topic/queue/" + storeId;
        log.debug("Broadcasting queue update to {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    /** Broadcast room status change to all subscribers watching the store rooms */
    public void broadcastRoomUpdate(String storeId, Object payload) {
        String destination = "/topic/rooms/" + storeId;
        log.debug("Broadcasting room update to {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    /** Broadcast token-specific update (used for individual customer screens) */
    public void broadcastTokenUpdate(String token, Object payload) {
        String destination = "/topic/token/" + token;
        log.debug("Broadcasting token update to {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }

    /** Broadcast TV/kiosk display update */
    public void broadcastDisplayUpdate(String storeId, Object payload) {
        String destination = "/topic/display/" + storeId;
        log.debug("Broadcasting display update to {}", destination);
        messagingTemplate.convertAndSend(destination, payload);
    }
}
