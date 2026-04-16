-- COMPLETE DATABASE RESET - This will delete ALL data and start fresh
-- WARNING: This action cannot be undone!

-- Drop all existing tables in the correct order (to handle foreign key constraints)
DROP TABLE IF EXISTS duke_payments CASCADE;
DROP TABLE IF EXISTS payment_status CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS milk_records CASCADE;
DROP TABLE IF EXISTS staff_credentials CASCADE;
DROP TABLE IF EXISTS system_credentials CASCADE;

-- Drop any remaining indexes or policies
DROP INDEX IF EXISTS idx_milk_records_date;
DROP INDEX IF EXISTS idx_milk_records_session;
DROP INDEX IF EXISTS idx_price_history_date;
DROP INDEX IF EXISTS idx_duke_payments_date;
DROP INDEX IF EXISTS idx_payment_status_period;

-- Confirm all tables are dropped
SELECT 'All tables dropped successfully - Database is now empty' as status;

-- Show remaining tables (should be empty or only system tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
