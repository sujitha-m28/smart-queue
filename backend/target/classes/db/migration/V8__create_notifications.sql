-- V8: Create notifications table
CREATE TABLE notifications (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id    UUID        REFERENCES queue_entries(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    channel           VARCHAR(20) DEFAULT 'MOCK',
    recipient         VARCHAR(255),
    message           TEXT,
    status            VARCHAR(20) DEFAULT 'PENDING',
    sent_at           TIMESTAMP,
    created_at        TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_notifications_entry ON notifications (queue_entry_id);
