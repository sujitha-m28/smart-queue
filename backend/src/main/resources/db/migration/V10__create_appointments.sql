-- V10: Create appointments table
CREATE TABLE appointments (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id         UUID        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_name    VARCHAR(255) NOT NULL,
    mobile_number    VARCHAR(20) NOT NULL,
    email            VARCHAR(255),
    appointment_time TIMESTAMP   NOT NULL,
    status           VARCHAR(30) DEFAULT 'SCHEDULED',
    queue_entry_id   UUID        REFERENCES queue_entries(id),
    created_at       TIMESTAMP   DEFAULT NOW(),
    updated_at       TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_appointments_store      ON appointments (store_id);
CREATE INDEX idx_appointments_store_time ON appointments (store_id, appointment_time);
