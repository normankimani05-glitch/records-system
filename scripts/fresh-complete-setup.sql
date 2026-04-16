-- FRESH COMPLETE DATABASE SETUP
-- Execute this single script for a complete database setup

-- Drop all existing tables to ensure clean start
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS staff_credentials CASCADE;
DROP TABLE IF EXISTS system_credentials CASCADE;
DROP TABLE IF EXISTS duke_payments CASCADE;
DROP TABLE IF EXISTS payment_status CASCADE;
DROP TABLE IF EXISTS acarcia_pricing CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS milk_records CASCADE;
DROP TABLE IF EXISTS treatment_records CASCADE;
DROP TABLE IF EXISTS ai_records CASCADE;
DROP TABLE IF EXISTS vet_credentials CASCADE;

-- Create all tables from scratch

-- System credentials table
CREATE TABLE system_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_username TEXT NOT NULL,
    owner_password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff credentials table
CREATE TABLE staff_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vet credentials table
CREATE TABLE vet_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milk records table
CREATE TABLE milk_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('morning', 'evening')),
    duke_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    acarcia_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    home_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    recorded_by TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, session)
);

-- Price history table
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_date TEXT NOT NULL,
    duke_morning_price NUMERIC(10, 2) NOT NULL,
    acarcia_price NUMERIC(10, 2) NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(effective_date)
);

-- Acarcia pricing table
CREATE TABLE acarcia_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_from TEXT NOT NULL,
    effective_to TEXT NOT NULL,
    price_per_liter NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment status table
CREATE TABLE payment_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
    recipient TEXT NOT NULL CHECK (recipient IN ('Duke', 'Acarcia', 'Combined')),
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period, type, recipient)
);

-- Duke payments table
CREATE TABLE duke_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_date TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    liters NUMERIC(10, 2) NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    paid_by TEXT NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Records table (for veterinary)
CREATE TABLE ai_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cow_name TEXT NOT NULL,
    heat_detected TEXT,
    insemination_date TEXT,
    insemination_time TEXT,
    bull_signature TEXT,
    bull_name TEXT,
    next_due_date TEXT,
    drying_date TEXT,
    expected_next_due TEXT,
    charges NUMERIC(10, 2),
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment Records table (for veterinary)
CREATE TABLE treatment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cow_name TEXT NOT NULL,
    treatment_date TEXT,
    treatment_notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_milk_records_date ON milk_records(date DESC);
CREATE INDEX idx_milk_records_session ON milk_records(session);
CREATE INDEX idx_price_history_effective_date ON price_history(effective_date DESC);
CREATE INDEX idx_acarcia_pricing_effective_from ON acarcia_pricing(effective_from DESC);
CREATE INDEX idx_duke_payments_payment_date ON duke_payments(payment_date DESC);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_created_by ON notes(created_by);
CREATE INDEX idx_staff_credentials_username ON staff_credentials(username);
CREATE INDEX idx_ai_records_cow_name ON ai_records(cow_name);
CREATE INDEX idx_ai_records_created_at ON ai_records(created_at);
CREATE INDEX idx_treatment_records_cow_name ON treatment_records(cow_name);
CREATE INDEX idx_treatment_records_created_at ON treatment_records(created_at);

-- Enable Row Level Security
ALTER TABLE milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE acarcia_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE duke_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables
CREATE POLICY "allow_all_milk_records" ON milk_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_acarcia_pricing" ON acarcia_pricing FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payment_status" ON payment_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_duke_payments" ON duke_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_system_credentials" ON system_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_staff_credentials" ON staff_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_vet_credentials" ON vet_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_records" ON ai_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_treatment_records" ON treatment_records FOR ALL USING (true) WITH CHECK (true);

-- Insert default credentials and data
INSERT INTO system_credentials (owner_username, owner_password) 
VALUES ('admin', 'milk2024');

INSERT INTO staff_credentials (username, password)
VALUES ('staff1', 'staff123'), ('staff2', 'staff456');

INSERT INTO vet_credentials (username, password)
VALUES ('vet', 'vet123');

INSERT INTO price_history (effective_date, duke_morning_price, acarcia_price, changed_by)
VALUES ('2024-01-01', 50, 45, 'System');

-- Confirmation
SELECT 'Fresh complete setup executed successfully!' as status;
SELECT 'Owner credentials: admin / milk2024' as owner_info;
SELECT 'Staff credentials: staff1 / staff123, staff2 / staff456' as staff_info;
SELECT 'Vet credentials: vet / vet123' as vet_info;
