/
/
SQL for Guide Certificate Table
CREATE TABLE IF NOT EXISTS guide_certificates (
    certificate_id VARCHAR(255) NOT NULL DEFAULT nextval('guide_certificates_certificate_id_seq'::regclass),
    email VARCHAR(100),
    certificate_issuer VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    verification_number VARCHAR(50),
    certificate_picture BYTEA,
    status VARCHAR(20) DEFAULT 'PENDING',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

/
/
SQL for Driver
Table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    accept_partial_trips INTEGER,
    address VARCHAR(255),
    auto_accept_trips INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    date_of_birth DATE,
    driving_license_expiry_date DATE,
    driving_license_image TEXT,
    driving_license_number VARCHAR(255),
    driving_license_uploaded_date DATE,
    driving_license_verified INTEGER,
    email VARCHAR(255) UNIQUE NOT NULL,
    emergency_contact_name VARCHAR(255),
    emergency_contact_number VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    maximum_trip_distance INTEGER,
    number_of_reviews INTEGER,
    phone_number VARCHAR(255),
    profile_completion INTEGER,
    profile_picture_url TEXT,
    rating DOUBLE PRECISION,
    sltda_license_expiry_date DATE,
    sltda_license_image TEXT,
    sltda_license_number VARCHAR(255),
    sltda_license_uploaded_date DATE,
    sltda_license_verified INTEGER,
    total_completed_trips INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    ac_available VARCHAR(255),
    body_type VARCHAR(255),
    contact_number VARCHAR(255),
    full_name VARCHAR(255),
    nic_passport VARCHAR(255),
    number_of_seats INTEGER,
    vehicle_number VARCHAR(255),
    vehicle_type VARCHAR(255)
);