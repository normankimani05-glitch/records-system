-- Fix Acarcia Pricing Upsert Issue
-- This script fixes the month_year unique constraint needed for upsert operations

-- Step 1: Check current table structure
SELECT 'Checking acarcia_pricing table structure...' as status;

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'acarcia_pricing' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add month_year column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'acarcia_pricing' 
        AND column_name = 'month_year'
    ) THEN
        ALTER TABLE acarcia_pricing 
        ADD COLUMN month_year TEXT;
        RAISE NOTICE 'Added month_year column to acarcia_pricing table';
    ELSE
        RAISE NOTICE 'month_year column already exists in acarcia_pricing table';
    END IF;
END $$;

-- Step 3: Drop existing unique constraint if it exists (to avoid conflicts)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'acarcia_pricing' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE acarcia_pricing 
        DROP CONSTRAINT IF EXISTS acarcia_pricing_month_year_key;
        ALTER TABLE acarcia_pricing 
        DROP CONSTRAINT IF EXISTS unique_effective_from;
        ALTER TABLE acarcia_pricing 
        DROP CONSTRAINT IF EXISTS unique_month_year;
        RAISE NOTICE 'Dropped existing unique constraints';
    END IF;
END $$;

-- Step 4: Add unique constraint on month_year
ALTER TABLE acarcia_pricing 
ADD CONSTRAINT acarcia_pricing_month_year_key 
UNIQUE (month_year);

-- Step 5: Update existing records to have month_year values
UPDATE acarcia_pricing 
SET month_year = SUBSTRING(effective_from, 1, 7)
WHERE month_year IS NULL AND effective_from IS NOT NULL AND LENGTH(effective_from) >= 7;

-- Step 6: If no records exist, create a default one
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM acarcia_pricing LIMIT 1) THEN
        INSERT INTO acarcia_pricing (
            month_year,
            effective_from,
            effective_to,
            price_per_liter,
            created_at,
            updated_at
        ) VALUES (
            TO_CHAR(NOW(), 'YYYY-MM'),
            CAST(NOW() AS TEXT),
            '9999-12-31',
            45.00,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created default acarcia pricing record';
    END IF;
END $$;

-- Step 7: Verify the fix
SELECT '=== ACARCIA PRICING UPSERT FIX APPLIED ===' as status;

-- Show table structure after fix
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'acarcia_pricing' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'acarcia_pricing' 
AND table_schema = 'public';

-- Show current records
SELECT 'Current acarcia pricing records:' as info;
SELECT id, month_year, effective_from, effective_to, price_per_liter, created_at 
FROM acarcia_pricing 
ORDER BY effective_from DESC;

SELECT '=== ACARCIA PRICING UPSERT READY ===' as final_status;
SELECT 'The upsert operation should now work correctly with month_year unique constraint!' as completion_message;
