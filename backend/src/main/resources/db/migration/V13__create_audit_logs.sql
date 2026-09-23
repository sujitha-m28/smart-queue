-- V13: Create audit_logs table
CREATE TABLE audit_logs (
    id           BIGSERIAL    PRIMARY KEY,
    entity_type  VARCHAR(100),
    entity_id    VARCHAR(100),
    action       VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255),
    details      JSONB,
    ip_address   VARCHAR(45),
    created_at   TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_performer  ON audit_logs (performed_by);
