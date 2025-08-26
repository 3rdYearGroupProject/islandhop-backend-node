-- SQL queries to create the required tables for the scoring service

-- Create driver_score table
CREATE TABLE IF NOT EXISTS driver_score (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 0 CHECK (
        rating >= 0
        AND rating <= 5
    ),
    active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
    banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
    newdriver INTEGER DEFAULT 0 CHECK (newdriver IN (0, 1)),
    first10rides INTEGER DEFAULT 1 CHECK (
        first10rides >= 1
        AND first10rides <= 10
    ),
    penalty INTEGER DEFAULT 0 CHECK (
        penalty >= 0
        AND penalty <= 100
    ),
    vehicle_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guide_score table
CREATE TABLE IF NOT EXISTS guide_score (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 0 CHECK (
        rating >= 0
        AND rating <= 5
    ),
    active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
    banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
    newdriver INTEGER DEFAULT 0 CHECK (newdriver IN (0, 1)),
    first10rides INTEGER DEFAULT 1 CHECK (
        first10rides >= 1
        AND first10rides <= 10
    ),
    penalty INTEGER DEFAULT 0 CHECK (
        penalty >= 0
        AND penalty <= 100
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO
    driver_score (
        email,
        rating,
        active,
        banned,
        newdriver,
        first10rides,
        penalty,
        vehicle_type
    )
VALUES (
        'driver1@example.com',
        4.5,
        1,
        0,
        0,
        8,
        5,
        'van'
    ),
    (
        'driver2@example.com',
        3.8,
        1,
        0,
        1,
        3,
        10,
        'car'
    ),
    (
        'driver3@example.com',
        4.2,
        1,
        0,
        0,
        10,
        0,
        'van'
    ),
    (
        'driver4@example.com',
        2.5,
        0,
        0,
        1,
        2,
        25,
        'car'
    ),
    (
        'driver5@example.com',
        4.8,
        1,
        1,
        0,
        9,
        50,
        'van'
    );

INSERT INTO
    guide_score (
        email,
        rating,
        active,
        banned,
        newdriver,
        first10rides,
        penalty
    )
VALUES (
        'guide1@example.com',
        4.7,
        1,
        0,
        0,
        9,
        5
    ),
    (
        'guide2@example.com',
        3.9,
        1,
        0,
        1,
        4,
        15
    ),
    (
        'guide3@example.com',
        4.3,
        1,
        0,
        0,
        10,
        0
    ),
    (
        'guide4@example.com',
        2.8,
        0,
        0,
        1,
        1,
        30
    ),
    (
        'guide5@example.com',
        4.9,
        1,
        1,
        0,
        8,
        60
    );

-- Create indexes for better performance
CREATE INDEX idx_driver_score_email ON driver_score (email);

CREATE INDEX idx_driver_score_active_banned ON driver_score (active, banned);

CREATE INDEX idx_guide_score_email ON guide_score (email);

CREATE INDEX idx_guide_score_active_banned ON guide_score (active, banned);