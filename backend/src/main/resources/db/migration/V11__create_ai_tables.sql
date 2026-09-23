-- V11: Create AI conversation tables
CREATE TABLE ai_conversations (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id          UUID        REFERENCES stores(id),
    queue_entry_id    UUID        REFERENCES queue_entries(id),
    user_id           UUID        REFERENCES users(id),
    conversation_type VARCHAR(30) DEFAULT 'CUSTOMER'
                          CHECK (conversation_type IN ('CUSTOMER','MANAGER')),
    created_at        TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE ai_messages (
    id              BIGSERIAL   PRIMARY KEY,
    conversation_id UUID        NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('USER','ASSISTANT','SYSTEM')),
    content         TEXT        NOT NULL,
    created_at      TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages (conversation_id);
