-- Disable RLS Completely - Quick Fix
-- Run this to disable Row Level Security and get the system working

-- Step 1: Disable RLS on both tables
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

-- Step 3: Verify tables exist and have correct structure
SELECT 'ai_records table status' as table_status, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_records') as exists_check;

SELECT 'treatment_records table status' as table_status, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_records') as exists_check;

-- Step 4: If tables don't exist, create them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_records') THEN
        CREATE TABLE ai_records (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            cow_name VARCHAR(100) NOT NULL,
            ai_image_url TEXT,
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarwa', 'Cate', 'Monica', 'Dorothy'))
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_records') THEN
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
    END IF;
END $$;

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_records_cow_name ON ai_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_at ON ai_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_by ON ai_records(created_by);

CREATE INDEX IF NOT EXISTS idx_treatment_records_cow_name ON treatment_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_at ON treatment_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_by ON treatment_records(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_treatment_date ON treatment_records(treatment_date DESC);

-- Step 6: Final verification
SELECT 'RLS disabled and tables verified successfully' as status;
SELECT COUNT(*) as ai_records_count FROM ai_records;
SELECT COUNT(*) as treatment_records_count FROM treatment_records;
