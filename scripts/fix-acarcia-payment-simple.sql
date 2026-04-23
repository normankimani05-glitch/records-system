-- SIMPLE ACARCIA PAYMENT TRACKING SYSTEM
-- This creates a basic payment tracking system without complex joins

-- Step 1: Drop existing objects if they exist
DROP VIEW IF EXISTS acarcia_payment_history;
DROP TABLE IF EXISTS acarcia_payments CASCADE;

-- Step 2: Create the payment table
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

-- Step 3: Add payment tracking to acarcia_pricing table
ALTER TABLE acarcia_pricing 
ADD COLUMN IF NOT EXISTS is_actual_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES acarcia_payments(id),
ADD COLUMN IF NOT EXISTS calculated_from_payment BOOLEAN DEFAULT FALSE;

-- Step 4: Create a simple function to calculate price from payment
CREATE OR REPLACE FUNCTION calculate_acarcia_price_from_payment(
    p_payment_amount DECIMAL,
    p_liters_sold DECIMAL,
    p_period_start DATE,
    p_period_end DATE,
    p_created_by VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_price_per_liter DECIMAL;
    v_month_year TEXT;
BEGIN
    -- Calculate price per liter
    v_price_per_liter := p_payment_amount / p_liters_sold;
    v_month_year := TO_CHAR(p_period_end, 'YYYY-MM');
    
    -- Insert payment record
    INSERT INTO acarcia_payments (
        payment_date,
        payment_amount,
        liters_covered,
        calculated_price_per_liter,
        payment_period_start,
        payment_period_end,
        created_by
    ) VALUES (
        CURRENT_DATE,
        p_payment_amount,
        p_liters_sold,
        v_price_per_liter,
        p_period_start,
        p_period_end,
        p_created_by
    ) RETURNING id INTO v_payment_id;
    
    -- Return the payment ID
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a simple view without the problematic join
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
    TO_CHAR(ap.payment_period_end, 'YYYY-MM') as month_year
FROM acarcia_payments ap
ORDER BY ap.payment_date DESC;

-- Step 6: Create function to get last month's payout
CREATE OR REPLACE FUNCTION get_last_month_acarcia_payout()
RETURNS DECIMAL AS $$
DECLARE
    v_last_month_date DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
    v_price DECIMAL;
BEGIN
    SELECT calculated_price_per_liter INTO v_price
    FROM acarcia_payments 
    WHERE payment_period_end >= v_last_month_date 
    AND payment_period_end < v_last_month_date + INTERVAL '1 month'
    ORDER BY payment_date DESC
    LIMIT 1;
    
    RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Step 7: Test the system
SELECT 'Acarcia payment tracking system created successfully!' as status;
SELECT 'Table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'acarcia_payments' 
ORDER BY ordinal_position;

SELECT 'Sample query - last month payout:' as info;
SELECT get_last_month_acarcia_payout() as last_month_payout;
