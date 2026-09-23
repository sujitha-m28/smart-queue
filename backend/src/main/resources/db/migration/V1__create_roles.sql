-- V1: Create roles table
CREATE TABLE roles (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES
    ('CUSTOMER'),
    ('STAFF'),
    ('MANAGER'),
    ('ADMIN');
