-- Complete Vet Database Reset and Fix
-- This script completely resets and recreates vet tables with proper policies

-- Step 1: Disable RLS temporarily
ALTER TABLE ai_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view all AI records" ON ai_records;
DROP POLICY IF EXISTS "Users can insert AI records" ON ai_records;
DROP POLICY IF EXISTS "Users can update their own AI records" ON ai_records;
DROP POLICY IF EXISTS "Users can delete their own AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to view AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to update AI records" ON ai_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete AI records" ON ai_records;

DROP POLICY IF EXISTS "Users can view all treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Users can insert treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Users can update their own treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Users can delete their own treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to view treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to update treatment records" ON treatment_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete treatment records" ON treatment_records;

-- Step 3: Drop and recreate tables
DROP TABLE IF EXISTS ai_records CASCADE;
DROP TABLE IF EXISTS treatment_records CASCADE;

-- Step 4: Recreate tables with correct schema
CREATE TABLE ai_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cow_name VARCHAR(100) NOT NULL,
    ai_image_url TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarwa', 'Cate', 'Monica', 'Dorothy'))
);

CREATE TABLE treatment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cow_name VARCHAR(100) NOT NULL,
    treatment_date DATE NOT NULL,
    treatment_notes TEXT NOT NULL,
    treatment_image_url TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarwa', 'Cate', 'Monica', 'Dorothy')),
    CONSTRAINT valid_treatment_date CHECK (treatment_date <= CURRENT_DATE)
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_records_cow_name ON ai_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_at ON ai_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_by ON ai_records(created_by);

CREATE INDEX IF NOT EXISTS idx_treatment_records_cow_name ON treatment_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_at ON treatment_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_by ON treatment_records(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_treatment_date ON treatment_records(treatment_date DESC);

-- Step 6: Re-enable RLS
ALTER TABLE ai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;

-- Step 7: Create simple permissive policies
CREATE POLICY "Enable all operations on AI records" ON ai_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations on treatment records" ON treatment_records
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 8: Verify setup
SELECT 'AI records table created and policies fixed' as status;
SELECT COUNT(*) as ai_records_count FROM ai_records;

SELECT 'Treatment records table created and policies fixed' as status;
SELECT COUNT(*) as treatment_records_count FROM treatment_records;

-- Step 9: Test insert (optional)
-- INSERT INTO ai_records (cow_name, ai_image_url, created_by) 
-- VALUES ('Test Cow', 'data:image/png;base64,test', 'Test Vet');

SELECT 'Complete vet database reset and fix applied successfully' as final_status;
