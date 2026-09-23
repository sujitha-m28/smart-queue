-- V9: Create customer_feedback table
CREATE TABLE customer_feedback (
    id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id UUID      NOT NULL UNIQUE REFERENCES queue_entries(id) ON DELETE CASCADE,
    rating         INT       CHECK (rating BETWEEN 1 AND 5),
    comments       TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);
