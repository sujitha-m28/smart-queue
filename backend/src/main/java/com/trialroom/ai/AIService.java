package com.trialroom.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.trialroom.dto.request.AiChatRequest;
import com.trialroom.dto.response.AiChatResponse;
import com.trialroom.dto.response.AnalyticsOverviewResponse;
import com.trialroom.dto.response.QueueStatusResponse;
import com.trialroom.entity.AiConversation;
import com.trialroom.entity.AiMessage;
import com.trialroom.repository.AiConversationRepository;
import com.trialroom.repository.AiMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AI service using direct OpenAI Chat Completions API via RestTemplate.
 * Gracefully degrades when API key is missing or call fails.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.openai.api-key:sk-placeholder}")
    private String apiKey;

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String model;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String FALLBACK_MESSAGE =
        "AI assistant is currently unavailable. Please ask our staff for assistance.";

    @Transactional
    public AiChatResponse customerChat(AiChatRequest request, QueueStatusResponse queueContext) {
        AiConversation conversation = getOrCreateConversation(
            request.getConversationId(), request.getStoreId(), request.getToken(), "CUSTOMER");

        saveMessage(conversation, "USER", request.getMessage());

        String systemPrompt = buildCustomerSystemPrompt(queueContext);

        try {
            String aiResponse = callOpenAI(systemPrompt, request.getMessage());
            saveMessage(conversation, "ASSISTANT", aiResponse);
            return buildResponse(conversation.getId().toString(), aiResponse, true);
        } catch (Exception e) {
            log.warn("AI API call failed (customer chat): {}", e.getMessage());
            String fallback = generateRuleBasedCustomerResponse(request.getMessage(), queueContext);
            saveMessage(conversation, "ASSISTANT", fallback);
            return buildResponse(conversation.getId().toString(), fallback, false);
        }
    }

    @Transactional
    public AiChatResponse managerInsight(AiChatRequest request, AnalyticsOverviewResponse analytics,
                                          String storeId) {
        AiConversation conversation = getOrCreateConversation(
            request.getConversationId(), storeId, null, "MANAGER");

        saveMessage(conversation, "USER", request.getMessage());

        String systemPrompt = buildManagerSystemPrompt(analytics);

        try {
            String aiResponse = callOpenAI(systemPrompt, request.getMessage());
            saveMessage(conversation, "ASSISTANT", aiResponse);
            return buildResponse(conversation.getId().toString(), aiResponse, true);
        } catch (Exception e) {
            log.warn("AI API call failed (manager insight): {}", e.getMessage());
            String fallback = generateManagerFallback(analytics);
            saveMessage(conversation, "ASSISTANT", fallback);
            return buildResponse(conversation.getId().toString(), fallback, false);
        }
    }

    public String generateDailyReport(AnalyticsOverviewResponse analytics, String date, String storeName) {
        String userPrompt = String.format(
            "Generate a professional daily queue management report for %s on %s.\n" +
            "Data: Total=%d, Completed=%d, Cancelled=%d, AvgWait=%.1f min, AvgService=%.1f min, " +
            "PeakHour=%s, Satisfaction=%.1f/5.0\n" +
            "Include: Executive Summary, Key Metrics, Peak Hour Analysis, Customer Experience, Recommendations.",
            storeName, date,
            analytics.getTotalToday(), analytics.getCompletedToday(), analytics.getCancelledToday(),
            analytics.getAvgWaitMinutes(), analytics.getAvgServiceMinutes(),
            analytics.getPeakHour(), analytics.getSatisfactionRating()
        );
        try {
            return callOpenAI("You are a retail operations analyst.", userPrompt);
        } catch (Exception e) {
            log.warn("AI daily report generation failed: {}", e.getMessage());
            return generateFallbackReport(analytics, date, storeName, "Daily");
        }
    }

    public String generateWeeklyReport(AnalyticsOverviewResponse analytics, String weekStart, String storeName) {
        String userPrompt = String.format(
            "Generate a professional weekly queue management report for %s, week starting %s.\n" +
            "Data: TotalWeek=%d, Completed=%d, Cancelled=%d, AvgWait=%.1f min, AvgService=%.1f min, " +
            "PeakPattern=%s, Satisfaction=%.1f/5.0\n" +
            "Include: Weekly Overview, Trends, Peak Hours, Staff Efficiency, Recommendations.",
            storeName, weekStart,
            analytics.getTotalThisPeriod(), analytics.getCompletedToday(), analytics.getCancelledToday(),
            analytics.getAvgWaitThisPeriod(), analytics.getAvgServiceMinutes(),
            analytics.getPeakHour(), analytics.getSatisfactionRating()
        );
        try {
            return callOpenAI("You are a retail operations analyst.", userPrompt);
        } catch (Exception e) {
            log.warn("AI weekly report generation failed: {}", e.getMessage());
            return generateFallbackReport(analytics, weekStart, storeName, "Weekly");
        }
    }

    // ===== PRIVATE HELPERS =====

    private String callOpenAI(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("sk-placeholder")) {
            throw new IllegalStateException("AI API key not configured");
        }

        RestTemplate restTemplate = new RestTemplate();

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.put("max_tokens", 1024);
        requestBody.put("temperature", 0.7);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        ObjectNode userMsg = objectMapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);

        requestBody.set("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(OPENAI_URL, entity, String.class);

        JsonNode root = null;
        try {
            root = objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
        return root.path("choices").path(0).path("message").path("content").asText(FALLBACK_MESSAGE);
    }

    private AiConversation getOrCreateConversation(String conversationId, String storeId,
                                                    String token, String type) {
        if (conversationId != null && !conversationId.isBlank()) {
            try {
                return conversationRepository.findById(UUID.fromString(conversationId))
                    .orElseGet(() -> createConversation(type));
            } catch (Exception e) {
                return createConversation(type);
            }
        }
        return createConversation(type);
    }

    private AiConversation createConversation(String type) {
        AiConversation conv = new AiConversation();
        conv.setConversationType(type);
        return conversationRepository.save(conv);
    }

    private void saveMessage(AiConversation conversation, String role, String content) {
        AiMessage msg = new AiMessage();
        msg.setConversation(conversation);
        msg.setRole(role);
        msg.setContent(content != null ? content : "");
        messageRepository.save(msg);
    }

    private AiChatResponse buildResponse(String conversationId, String message, boolean aiAvailable) {
        return AiChatResponse.builder()
            .conversationId(conversationId)
            .message(message)
            .role("ASSISTANT")
            .timestamp(LocalDateTime.now())
            .aiAvailable(aiAvailable)
            .build();
    }

    private String buildCustomerSystemPrompt(QueueStatusResponse ctx) {
        if (ctx == null) {
            return "You are a helpful, concise assistant for Smart Trial Room. " +
                   "Help customers with general trial room queue questions. " +
                   "Keep answers under 3 sentences.";
        }
        return String.format(
            "You are a helpful, concise assistant for the Smart Trial Room queue system.\n\n" +
            "Customer's real-time queue data:\n" +
            "- Token: %s | Status: %s\n" +
            "- Queue Position: %d | People Ahead: %d\n" +
            "- Estimated Wait: %d minutes\n" +
            "- Trial Room: %s\n" +
            "- Currently Serving: %s | Available Rooms: %d\n\n" +
            "Rules: Only answer questions about this customer's queue. Keep answers under 3 sentences. " +
            "Do NOT reveal other customers' information. Do NOT allow queue manipulation.",
            ctx.getToken(), ctx.getStatus(),
            ctx.getQueuePosition(), ctx.getPeopleAhead(),
            ctx.getEstimatedWaitMinutes(),
            ctx.getTrialRoomNumber() != null ? ctx.getTrialRoomNumber() : "Not yet assigned",
            ctx.getCurrentlyServingToken() != null ? ctx.getCurrentlyServingToken() : "None",
            ctx.getAvailableRooms()
        );
    }

    private String buildManagerSystemPrompt(AnalyticsOverviewResponse analytics) {
        return String.format(
            "You are an AI analytics assistant for store managers. Provide evidence-based insights.\n\n" +
            "Live analytics: Customers today=%d, Completed=%d, Cancelled=%d, Waiting now=%d\n" +
            "Performance: AvgWait=%.1f min, AvgService=%.1f min, PeakHour=%s\n" +
            "Satisfaction=%.1f/5.0, Available rooms=%d/%d\n\n" +
            "Do NOT share individual customer personal information.",
            analytics.getTotalToday(), analytics.getCompletedToday(), analytics.getCancelledToday(),
            analytics.getWaitingNow(),
            analytics.getAvgWaitMinutes(), analytics.getAvgServiceMinutes(), analytics.getPeakHour(),
            analytics.getSatisfactionRating(), analytics.getAvailableRooms(), analytics.getTotalRooms()
        );
    }

    private String generateRuleBasedCustomerResponse(String message, QueueStatusResponse ctx) {
        if (ctx == null) return FALLBACK_MESSAGE;
        String msg = message.toLowerCase();
        if (msg.contains("wait") || msg.contains("long") || msg.contains("time")) {
            return String.format("Your estimated waiting time is approximately %d minutes. " +
                "%d people are ahead of you.", ctx.getEstimatedWaitMinutes(), ctx.getPeopleAhead());
        }
        if (msg.contains("position") || msg.contains("ahead") || msg.contains("many")) {
            return String.format("You are at position #%d with %d people ahead.",
                ctx.getQueuePosition(), ctx.getPeopleAhead());
        }
        if (msg.contains("room") || msg.contains("where") || msg.contains("go")) {
            return ctx.getTrialRoomNumber() != null
                ? "Please proceed to " + ctx.getTrialRoomNumber() + "."
                : "You haven't been assigned a trial room yet. Wait to be called.";
        }
        if (msg.contains("cancel")) {
            return "You can cancel by clicking 'Cancel' on your queue status page.";
        }
        return String.format("Token %s | Position #%d | Est. wait: %d min.",
            ctx.getToken(), ctx.getQueuePosition(), ctx.getEstimatedWaitMinutes());
    }

    private String generateManagerFallback(AnalyticsOverviewResponse analytics) {
        return String.format("Today: %d customers, %d completed, avg wait %.1f min, " +
            "peak hour %s, satisfaction %.1f/5.0. AI assistant temporarily unavailable.",
            analytics.getTotalToday(), analytics.getCompletedToday(),
            analytics.getAvgWaitMinutes(), analytics.getPeakHour(), analytics.getSatisfactionRating());
    }

    private String generateFallbackReport(AnalyticsOverviewResponse a, String date,
                                           String storeName, String type) {
        return String.format("%s Report — %s — %s\n\nSUMMARY\nTotal: %d | Completed: %d | Cancelled: %d\n" +
            "Avg Wait: %.1f min | Avg Service: %.1f min | Peak Hour: %s | Rating: %.1f/5.0\n\n" +
            "Note: AI narrative generation unavailable. Data is accurate.",
            type, storeName, date,
            a.getTotalToday(), a.getCompletedToday(), a.getCancelledToday(),
            a.getAvgWaitMinutes(), a.getAvgServiceMinutes(), a.getPeakHour(), a.getSatisfactionRating());
    }
}
