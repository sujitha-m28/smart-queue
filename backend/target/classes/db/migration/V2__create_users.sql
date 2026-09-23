-- V2: Create users and user_roles tables
CREATE TABLE users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    mobile_number   VARCHAR(20),
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Demo users — password for all accounts is: password
-- Hash below is BCrypt(cost=10) of 'password'
INSERT INTO users (id, username, email, password_hash, full_name, mobile_number, is_active)
VALUES
    (gen_random_uuid(), 'admin',    'admin@azorte.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'System Admin',      '9900000001', TRUE),
    (gen_random_uuid(), 'manager',  'manager@azorte.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Store Manager',     '9900000002', TRUE),
    (gen_random_uuid(), 'staff1',   'staff@azorte.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Staff One',         '9900000003', TRUE),
    (gen_random_uuid(), 'staff2',   'staff2@azorte.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Staff Two',         '9900000004', TRUE);

-- Assign roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE (u.username = 'admin'   AND r.name = 'ADMIN')
   OR (u.username = 'manager' AND r.name = 'MANAGER')
   OR (u.username = 'staff1'  AND r.name = 'STAFF')
   OR (u.username = 'staff2'  AND r.name = 'STAFF');
