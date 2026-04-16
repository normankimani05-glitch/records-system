-- COMPREHENSIVE PRICE FIX - Addresses all issues
-- Fixes price update AND missing column error

-- First check acarcia_pricing table structure
SELECT 'Checking acarcia_pricing table structure...' as status;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'acarcia_pricing' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing month_year column if it doesn't exist
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
    END IF;
END $$;

-- Check price_history table structure
SELECT 'Checking price_history table structure...' as status;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'price_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update price history safely
UPDATE price_history 
SET 
    duke_morning_price = 50.00,
    acarcia_price = 45.00,
    changed_by = 'admin',
    changed_at = NOW()
WHERE effective_date = CAST(CURRENT_DATE AS TEXT);

-- Insert if no record exists
INSERT INTO price_history (
    effective_date, 
    duke_morning_price, 
    acarcia_price, 
    changed_by, 
    changed_at
) SELECT 
    CAST(CURRENT_DATE AS TEXT), 
    50.00, 
    45.00, 
    'admin', 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM price_history 
    WHERE effective_date = CAST(CURRENT_DATE AS TEXT)
);

-- Update acarcia pricing with month_year
UPDATE acarcia_pricing 
SET 
    effective_from = CAST(CURRENT_DATE AS TEXT),
    price_per_liter = 45.00,
    month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    updated_at = NOW()
WHERE effective_to = '9999-12-31';

-- Insert new acarcia record if needed
INSERT INTO acarcia_pricing (
    effective_from, 
    effective_to, 
    price_per_liter, 
    month_year,
    created_at, 
    updated_at
) SELECT 
    CAST(CURRENT_DATE AS TEXT), 
    '9999-12-31', 
    45.00, 
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM acarcia_pricing 
    WHERE effective_to = '9999-12-31'
);

-- Show current prices
SELECT 'Updated Prices:' as section;

SELECT 
    'Duke Morning Price' as price_type,
    duke_morning_price as current_price,
    'KSh/L' as unit
FROM price_history 
WHERE effective_date = CAST(CURRENT_DATE AS TEXT)
UNION ALL
SELECT 
    'Acarcia Price' as price_type,
    acarcia_price as current_price,
    'KSh/L' as unit
FROM price_history 
WHERE effective_date = CAST(CURRENT_DATE AS TEXT);

-- Show acarcia pricing with month_year
SELECT 'Acarcia Pricing Details:' as section;

SELECT 
    effective_from,
    effective_to,
    price_per_liter,
    month_year,
    updated_at
FROM acarcia_pricing 
WHERE effective_to = '9999-12-31';

-- Success message
SELECT 'Comprehensive price fix completed!' as status,
    'Added missing column and updated prices' as details;
