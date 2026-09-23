-- V3: Create stores table
CREATE TABLE stores (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    address    TEXT,
    city       VARCHAR(100),
    state      VARCHAR(100),
    pincode    VARCHAR(10),
    phone      VARCHAR(20),
    is_active  BOOLEAN      DEFAULT TRUE,
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW()
);

INSERT INTO stores (name, address, city, state, pincode, phone, is_active)
VALUES ('Azorte Fashion — Demo Store', 'MG Road, Bengaluru', 'Bengaluru', 'Karnataka', '560001', '08012345678', TRUE);
