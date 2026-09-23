-- V7: Create service_sessions table
CREATE TABLE service_sessions (
    id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id   UUID      NOT NULL UNIQUE REFERENCES queue_entries(id) ON DELETE CASCADE,
    trial_room_id    UUID      REFERENCES trial_rooms(id),
    started_at       TIMESTAMP,
    ended_at         TIMESTAMP,
    duration_minutes INT,
    staff_id         UUID      REFERENCES users(id),
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_sessions_entry ON service_sessions (queue_entry_id);
CREATE INDEX idx_service_sessions_room  ON service_sessions (trial_room_id);
