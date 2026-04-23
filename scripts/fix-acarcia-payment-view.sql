-- FIX ACARCIA PAYMENT VIEW
-- This script fixes the view creation error

-- Step 1: Drop the view if it exists
DROP VIEW IF EXISTS acarcia_payment_history;

-- Step 2: Drop the table if it exists and recreate it
DROP TABLE IF EXISTS acarcia_payments CASCADE;

-- Step 3: Create the payment table with correct structure
CREATE TABLE acarcia_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(10,2) NOT NULL,
    liters_covered DECIMAL(10,2) NOT NULL,
    calculated_price_per_liter DECIMAL(10,2) NOT NULL,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create the view correctly
CREATE OR REPLACE VIEW acarcia_payment_history AS
SELECT 
    ap.payment_date,
    ap.payment_amount,
    ap.liters_covered,
    ap.calculated_price_per_liter,
    ap.payment_period_start,
    ap.payment_period_end,
    ap.notes,
    ap.created_by,
    ap.created_at,
    pr.month_year
FROM acarcia_payments ap
LEFT JOIN acarcia_pricing pr ON ap.id = pr.payment_id
ORDER BY ap.payment_date DESC;

-- Step 5: Test the view
SELECT 'Testing acarcia_payments table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'acarcia_payments' 
ORDER BY ordinal_position;

SELECT 'Testing acarcia_payment_history view:' as info;
SELECT * FROM acarcia_payment_history LIMIT 1;

SELECT 'Acarcia payment tracking system fixed successfully!' as status;
