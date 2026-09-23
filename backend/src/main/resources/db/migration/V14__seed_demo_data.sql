-- V14: Seed historical demo data (30 days, 200+ entries)
-- We generate queue_entries across 30 days with realistic peak hour distribution.
-- Peak hours: 11:00-13:00, 17:00-20:00

DO $$
DECLARE
    v_store_id          UUID;
    v_staff1_id         UUID;
    v_staff2_id         UUID;
    v_room_ids          UUID[];
    v_room_id           UUID;
    v_entry_id          UUID;
    v_session_id        UUID;
    v_token             TEXT;
    v_day_offset        INT;
    v_hour              INT;
    v_minute            INT;
    v_joined            TIMESTAMP;
    v_started           TIMESTAMP;
    v_ended             TIMESTAMP;
    v_wait_min          INT;
    v_service_min       INT;
    v_token_counter     INT := 1;
    v_rating            INT;
    v_priority          TEXT;
    v_entry_count       INT;
    v_statuses          TEXT[] := ARRAY['COMPLETED','COMPLETED','COMPLETED','CANCELLED'];
    v_status            TEXT;
    v_peaks             INT[] := ARRAY[11,12,13,17,18,19,20];
    v_off_peak          INT[] := ARRAY[10,14,15,16,21];
    v_names             TEXT[] := ARRAY['Priya Sharma','Rahul Verma','Anjali Singh','Deepak Mehta','Sunita Patel',
                                         'Vikram Nair','Kavitha Reddy','Arjun Krishnan','Meera Iyer','Suresh Babu',
                                         'Ananya Das','Rajesh Kumar','Lakshmi Pillai','Kiran Joshi','Divya Rao',
                                         'Arun Gupta','Pooja Menon','Sanjay Bose','Nisha Agarwal','Vivek Tiwari'];
    v_name              TEXT;
    v_i                 INT;
BEGIN
    SELECT id INTO v_store_id FROM stores WHERE name = 'Azorte Fashion — Demo Store' LIMIT 1;
    SELECT id INTO v_staff1_id FROM users WHERE username = 'staff1' LIMIT 1;
    SELECT id INTO v_staff2_id FROM users WHERE username = 'staff2' LIMIT 1;

    SELECT ARRAY_AGG(id) INTO v_room_ids FROM trial_rooms WHERE store_id = v_store_id;

    -- Iterate over past 30 days
    FOR v_day_offset IN 1..30 LOOP
        v_token_counter := 1;

        -- Peak hours: generate 6-10 entries per peak hour
        FOREACH v_hour IN ARRAY v_peaks LOOP
            v_entry_count := 6 + (RANDOM() * 4)::INT;
            FOR v_i IN 1..v_entry_count LOOP
                v_minute       := (RANDOM() * 59)::INT;
                v_joined       := (NOW() - (v_day_offset || ' days')::INTERVAL)
                                    + (v_hour || ' hours')::INTERVAL
                                    + (v_minute || ' minutes')::INTERVAL;
                v_wait_min     := 5  + (RANDOM() * 15)::INT;
                v_service_min  := 7  + (RANDOM() * 13)::INT;
                v_started      := v_joined + (v_wait_min || ' minutes')::INTERVAL;
                v_ended        := v_started + (v_service_min || ' minutes')::INTERVAL;
                v_token        := 'D' || LPAD(v_day_offset::TEXT, 2, '0') || '-' || LPAD(v_token_counter::TEXT, 3, '0');
                v_name         := v_names[1 + (RANDOM() * (ARRAY_LENGTH(v_names,1) - 1))::INT];
                v_status       := v_statuses[1 + (RANDOM() * 3)::INT];
                v_rating       := 3 + (RANDOM() * 2)::INT;
                v_room_id      := v_room_ids[1 + (RANDOM() * (ARRAY_LENGTH(v_room_ids,1) - 1))::INT];

                -- priority distribution
                IF RANDOM() < 0.05 THEN v_priority := 'VIP';
                ELSIF RANDOM() < 0.1  THEN v_priority := 'SENIOR_CITIZEN';
                ELSE v_priority := 'NORMAL';
                END IF;

                v_entry_id := gen_random_uuid();
                INSERT INTO queue_entries
                    (id, store_id, token, customer_name, mobile_number, email,
                     number_of_items, priority, status, queue_position,
                     trial_room_id, estimated_wait_minutes,
                     joined_at, called_at, service_started_at, service_ended_at,
                     created_at, updated_at)
                VALUES
                    (v_entry_id, v_store_id, v_token,
                     v_name,
                     '98' || LPAD((RANDOM()*99999999)::BIGINT::TEXT, 8, '0'),
                     LOWER(REPLACE(v_name,' ','.')) || '@example.com',
                     1 + (RANDOM()*4)::INT,
                     v_priority,
                     v_status,
                     v_token_counter,
                     CASE WHEN v_status = 'COMPLETED' THEN v_room_id ELSE NULL END,
                     v_wait_min,
                     v_joined,
                     CASE WHEN v_status IN ('COMPLETED','CANCELLED') THEN v_started ELSE NULL END,
                     CASE WHEN v_status = 'COMPLETED' THEN v_started ELSE NULL END,
                     CASE WHEN v_status = 'COMPLETED' THEN v_ended   ELSE NULL END,
                     v_joined, v_joined);

                -- Queue event
                INSERT INTO queue_events (queue_entry_id, event_type, performed_by, created_at)
                VALUES (v_entry_id, 'JOINED', NULL, v_joined);

                -- Service session for completed entries
                IF v_status = 'COMPLETED' THEN
                    v_session_id := gen_random_uuid();
                    INSERT INTO service_sessions
                        (id, queue_entry_id, trial_room_id, started_at, ended_at, duration_minutes, staff_id, created_at)
                    VALUES
                        (v_session_id, v_entry_id, v_room_id,
                         v_started, v_ended, v_service_min,
                         CASE WHEN RANDOM() > 0.5 THEN v_staff1_id ELSE v_staff2_id END,
                         v_joined);

                    -- Feedback (80% chance)
                    IF RANDOM() < 0.8 THEN
                        INSERT INTO customer_feedback (queue_entry_id, rating, comments, created_at)
                        VALUES (v_entry_id, v_rating,
                                CASE v_rating
                                    WHEN 5 THEN 'Excellent service, very quick!'
                                    WHEN 4 THEN 'Good experience overall.'
                                    WHEN 3 THEN 'Average wait, but helpful staff.'
                                    ELSE 'Could improve wait time.'
                                END,
                                v_ended);
                    END IF;
                END IF;

                v_token_counter := v_token_counter + 1;
            END LOOP;
        END LOOP;

        -- Off-peak hours: generate 2-4 entries per hour
        FOREACH v_hour IN ARRAY v_off_peak LOOP
            v_entry_count := 2 + (RANDOM() * 2)::INT;
            FOR v_i IN 1..v_entry_count LOOP
                v_minute      := (RANDOM() * 59)::INT;
                v_joined      := (NOW() - (v_day_offset || ' days')::INTERVAL)
                                   + (v_hour || ' hours')::INTERVAL
                                   + (v_minute || ' minutes')::INTERVAL;
                v_wait_min    := 2  + (RANDOM() * 8)::INT;
                v_service_min := 6  + (RANDOM() * 10)::INT;
                v_started     := v_joined + (v_wait_min || ' minutes')::INTERVAL;
                v_ended       := v_started + (v_service_min || ' minutes')::INTERVAL;
                v_token       := 'D' || LPAD(v_day_offset::TEXT, 2, '0') || '-' || LPAD(v_token_counter::TEXT, 3, '0');
                v_name        := v_names[1 + (RANDOM() * (ARRAY_LENGTH(v_names,1) - 1))::INT];
                v_status      := v_statuses[1 + (RANDOM() * 3)::INT];
                v_rating      := 3 + (RANDOM() * 2)::INT;
                v_room_id     := v_room_ids[1 + (RANDOM() * (ARRAY_LENGTH(v_room_ids,1) - 1))::INT];
                v_priority    := 'NORMAL';

                v_entry_id := gen_random_uuid();
                INSERT INTO queue_entries
                    (id, store_id, token, customer_name, mobile_number, email,
                     number_of_items, priority, status, queue_position,
                     trial_room_id, estimated_wait_minutes,
                     joined_at, called_at, service_started_at, service_ended_at,
                     created_at, updated_at)
                VALUES
                    (v_entry_id, v_store_id, v_token,
                     v_name,
                     '97' || LPAD((RANDOM()*99999999)::BIGINT::TEXT, 8, '0'),
                     LOWER(REPLACE(v_name,' ','.')) || v_token_counter || '@example.com',
                     1 + (RANDOM()*3)::INT,
                     v_priority,
                     v_status,
                     v_token_counter,
                     CASE WHEN v_status = 'COMPLETED' THEN v_room_id ELSE NULL END,
                     v_wait_min,
                     v_joined,
                     CASE WHEN v_status IN ('COMPLETED','CANCELLED') THEN v_started ELSE NULL END,
                     CASE WHEN v_status = 'COMPLETED' THEN v_started ELSE NULL END,
                     CASE WHEN v_status = 'COMPLETED' THEN v_ended   ELSE NULL END,
                     v_joined, v_joined);

                INSERT INTO queue_events (queue_entry_id, event_type, performed_by, created_at)
                VALUES (v_entry_id, 'JOINED', NULL, v_joined);

                IF v_status = 'COMPLETED' THEN
                    INSERT INTO service_sessions
                        (id, queue_entry_id, trial_room_id, started_at, ended_at, duration_minutes, staff_id, created_at)
                    VALUES
                        (gen_random_uuid(), v_entry_id, v_room_id,
                         v_started, v_ended, v_service_min,
                         CASE WHEN RANDOM() > 0.5 THEN v_staff1_id ELSE v_staff2_id END,
                         v_joined);

                    IF RANDOM() < 0.7 THEN
                        INSERT INTO customer_feedback (queue_entry_id, rating, comments, created_at)
                        VALUES (v_entry_id, v_rating,
                                CASE v_rating
                                    WHEN 5 THEN 'Great experience!'
                                    WHEN 4 THEN 'Quick and smooth.'
                                    ELSE 'Satisfactory.'
                                END,
                                v_ended);
                    END IF;
                END IF;

                v_token_counter := v_token_counter + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
