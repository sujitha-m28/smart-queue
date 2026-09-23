-- V4: Create trial_rooms table
CREATE TABLE trial_rooms (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id     UUID        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    room_number  VARCHAR(20) NOT NULL,
    display_name VARCHAR(100),
    status       VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE'
                     CHECK (status IN ('AVAILABLE','OCCUPIED','CLEANING','OUT_OF_SERVICE')),
    max_items    INT         DEFAULT 5,
    notes        TEXT,
    created_at   TIMESTAMP   DEFAULT NOW(),
    updated_at   TIMESTAMP   DEFAULT NOW()
);

-- Insert 6 demo trial rooms for the demo store
INSERT INTO trial_rooms (store_id, room_number, display_name, status, max_items)
SELECT s.id, r.room_number, r.display_name, 'AVAILABLE', 5
FROM stores s,
     (VALUES
         ('TR-01', 'Trial Room 1'),
         ('TR-02', 'Trial Room 2'),
         ('TR-03', 'Trial Room 3'),
         ('TR-04', 'Trial Room 4'),
         ('TR-05', 'Trial Room 5'),
         ('TR-06', 'Trial Room 6')
     ) AS r(room_number, display_name)
WHERE s.name = 'Azorte Fashion — Demo Store';
