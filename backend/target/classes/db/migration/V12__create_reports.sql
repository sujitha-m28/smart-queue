-- V12: Create daily_reports table
CREATE TABLE daily_reports (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id            UUID         NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    report_type         VARCHAR(20)  DEFAULT 'DAILY'
                            CHECK (report_type IN ('DAILY','WEEKLY')),
    report_date         DATE         NOT NULL,
    report_content      TEXT,
    total_customers     INT,
    completed_sessions  INT,
    cancelled_sessions  INT,
    avg_wait_minutes    NUMERIC(5,2),
    avg_service_minutes NUMERIC(5,2),
    peak_hour           VARCHAR(10),
    generated_at        TIMESTAMP    DEFAULT NOW(),
    generated_by        UUID         REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_daily_reports_store_type_date ON daily_reports (store_id, report_type, report_date);
