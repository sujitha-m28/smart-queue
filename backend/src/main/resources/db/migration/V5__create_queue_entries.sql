-- V5: Create queue_entries table
CREATE TABLE queue_entries (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id              UUID        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    token                 VARCHAR(20) UNIQUE NOT NULL,
    customer_name         VARCHAR(255) NOT NULL,
    mobile_number         VARCHAR(20) NOT NULL,
    email                 VARCHAR(255),
    number_of_items       INT         DEFAULT 1,
    priority              VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
                              CHECK (priority IN ('NORMAL','SENIOR_CITIZEN','VIP','APPOINTMENT')),
    status                VARCHAR(30) NOT NULL DEFAULT 'WAITING'
                              CHECK (status IN ('WAITING','CALLED','SERVING','COMPLETED','SKIPPED','CANCELLED','NO_SHOW')),
    queue_position        INT,
    trial_room_id         UUID        REFERENCES trial_rooms(id),
    estimated_wait_minutes INT,
    joined_at             TIMESTAMP   DEFAULT NOW(),
    called_at             TIMESTAMP,
    service_started_at    TIMESTAMP,
    service_ended_at      TIMESTAMP,
    created_at            TIMESTAMP   DEFAULT NOW(),
    updated_at            TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_queue_entries_store_status ON queue_entries (store_id, status);
CREATE INDEX idx_queue_entries_token        ON queue_entries (token);
CREATE INDEX idx_queue_entries_store_joined ON queue_entries (store_id, joined_at);
