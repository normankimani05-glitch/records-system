-- CLEAR ALL DATA BUT PRESERVE LOGIN CREDENTIALS
-- This script removes all data except user login credentials

-- Step 1: Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Step 2: Clear ALL tables EXCEPT credentials (child tables first)
-- Clear veterinary data first
TRUNCATE TABLE ai_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE treatment_records RESTART IDENTITY CASCADE;

-- Clear production data
TRUNCATE TABLE milk_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE price_history RESTART IDENTITY CASCADE;
TRUNCATE TABLE payment_status RESTART IDENTITY CASCADE;
TRUNCATE TABLE duke_payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE acarcia_pricing RESTART IDENTITY CASCADE;

-- Clear other data (NOT credentials)
TRUNCATE TABLE notes RESTART IDENTITY CASCADE;

-- Step 3: Reset all sequences to start from 1 (except credentials)
ALTER SEQUENCE IF EXISTS milk_records_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS price_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payment_status_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS duke_payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS acarcia_pricing_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ai_records_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treatment_records_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notes_id_seq RESTART WITH 1;

-- Step 4: Reset session replication role
SET session_replication_role = DEFAULT;

-- Step 5: Reset auto-increment values for all tables (except credentials)
-- Only reset sequences for tables that actually have identity columns
DO $$
BEGIN
    -- Reset identity columns safely (skip credentials)
    BEGIN
        ALTER TABLE milk_records ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE price_history ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE payment_status ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE duke_payments ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE acarcia_pricing ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE ai_records ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE treatment_records ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
    
    BEGIN
        ALTER TABLE notes ALTER COLUMN id RESTART WITH 1;
    EXCEPTION WHEN OTHERS THEN
        -- Column is not identity, skip
    END;
END $$;

-- Step 6: Reset RLS policies to ensure clean state
ALTER TABLE ai_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view all AI records" ON ai_records;
DROP POLICY IF EXISTS "Users can insert AI records" ON ai_records;
DROP POLICY IF EXISTS "Users can update their own AI records" ON ai_records;
DROP POLICY IF EXISTS "Users can delete their own AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to view AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to update AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete AI records" ON ai_records;
DROP POLICY IF EXISTS "Enable all operations on AI records" ON ai_records;

DROP POLICY IF EXISTS "Users can view all treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Users can insert treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Users can update their own treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Users can delete their own treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to view treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to update treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Enable all operations on treatment records" ON treatment_records;

-- Re-enable RLS with permissive policies
ALTER TABLE ai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on AI records" ON ai_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations on treatment records" ON treatment_records
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Comprehensive verification
SELECT '=== DATA CLEARED - CREDENTIALS PRESERVED ===' as status;
SELECT 'All data cleared but login credentials preserved!' as message;

-- Show table counts (data tables should be 0, credentials should remain)
SELECT 'milk_records' as table_name, COUNT(*) as record_count FROM milk_records
UNION ALL
SELECT 'price_history' as table_name, COUNT(*) as record_count FROM price_history
UNION ALL
SELECT 'payment_status' as table_name, COUNT(*) as record_count FROM payment_status
UNION ALL
SELECT 'duke_payments' as table_name, COUNT(*) as record_count FROM duke_payments
UNION ALL
SELECT 'acarcia_pricing' as table_name, COUNT(*) as record_count FROM acarcia_pricing
UNION ALL
SELECT 'ai_records' as table_name, COUNT(*) as record_count FROM ai_records
UNION ALL
SELECT 'treatment_records' as table_name, COUNT(*) as record_count FROM treatment_records
UNION ALL
SELECT 'notes' as table_name, COUNT(*) as record_count FROM notes
UNION ALL
SELECT 'system_credentials' as table_name, COUNT(*) as record_count FROM system_credentials
UNION ALL
SELECT 'staff_credentials' as table_name, COUNT(*) as record_count FROM staff_credentials
UNION ALL
SELECT 'vet_credentials' as table_name, COUNT(*) as record_count FROM vet_credentials;

SELECT '=== FRESH START WITH EXISTING LOGINS ===' as final_status;
SELECT 'Database cleared but login credentials preserved!' as completion_message;
