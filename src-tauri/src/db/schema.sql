-- GaragePro Database Schema

-- App Users Table
CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    pin_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    afm TEXT,
    name_search TEXT,
    email_search TEXT,
    phone_search TEXT,
    afm_search TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT,
    vin TEXT,
    engine_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Service Records Table
CREATE TABLE IF NOT EXISTS service_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    mechanic_id TEXT,
    date TEXT NOT NULL,
    description TEXT,
    description_search TEXT,
    mileage INTEGER,
    notes TEXT,
    services_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    vat REAL NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Custom Car Data Table
CREATE TABLE IF NOT EXISTS custom_car_data (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT,
    created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(date);
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers(name_search);
CREATE INDEX IF NOT EXISTS idx_customers_email_search ON customers(email_search);
CREATE INDEX IF NOT EXISTS idx_customers_phone_search ON customers(phone_search);
CREATE INDEX IF NOT EXISTS idx_customers_afm_search ON customers(afm_search);
