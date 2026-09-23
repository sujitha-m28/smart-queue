-- V6: Create queue_events table
CREATE TABLE queue_events (
    id             BIGSERIAL   PRIMARY KEY,
    queue_entry_id UUID        NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
    event_type     VARCHAR(50) NOT NULL,
    notes          TEXT,
    performed_by   UUID        REFERENCES users(id),
    created_at     TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_queue_events_entry ON queue_events (queue_entry_id);
