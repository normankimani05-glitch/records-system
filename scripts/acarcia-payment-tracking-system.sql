-- ACARCIA PAYMENT TRACKING SYSTEM
-- This creates a system to track actual payments and calculate real prices per liter

-- Step 1: Create payment tracking table
CREATE TABLE IF NOT EXISTS acarcia_payments (
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

-- Step 2: Add payment tracking to existing acarcia_pricing table
ALTER TABLE acarcia_pricing 
ADD COLUMN IF NOT EXISTS is_actual_payment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES acarcia_payments(id),
ADD COLUMN IF NOT EXISTS calculated_from_payment BOOLEAN DEFAULT FALSE;

-- Step 3: Create function to calculate price from payment
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
    v_pricing_id UUID;
BEGIN
    -- Calculate price per liter
    v_price_per_liter := p_payment_amount / p_liters_sold;
    
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
    
    -- Update or insert pricing record
    INSERT INTO acarcia_pricing (
        month_year,
        price_per_liter,
        effective_from,
        effective_to,
        is_actual_payment,
        payment_id,
        calculated_from_payment
    ) VALUES (
        TO_CHAR(p_period_end, 'YYYY-MM'),
        v_price_per_liter,
        p_period_start,
        p_period_end,
        TRUE,
        v_payment_id,
        TRUE
    ) ON CONFLICT (month_year) 
    DO UPDATE SET
        price_per_liter = v_price_per_liter,
        effective_from = p_period_start,
        effective_to = p_period_end,
        is_actual_payment = TRUE,
        payment_id = v_payment_id,
        calculated_from_payment = TRUE
    RETURNING id INTO v_pricing_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to get last month's actual payout
CREATE OR REPLACE FUNCTION get_last_month_acarcia_payout()
RETURNS DECIMAL AS $$
DECLARE
    v_last_month_date DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
    v_price DECIMAL;
BEGIN
    SELECT price_per_liter INTO v_price
    FROM acarcia_pricing 
    WHERE calculated_from_payment = TRUE 
    AND month_year = TO_CHAR(v_last_month_date, 'YYYY-MM')
    LIMIT 1;
    
    RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create view for payment history
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

-- Step 6: Sample data and test
-- This shows how to use the system:
/*
-- Example: Acarcia paid 50,000 KES for 2,500 liters in January 2024
SELECT calculate_acarcia_price_from_payment(
    50000.00,  -- payment amount
    2500.00,   -- total liters
    '2024-01-01'::DATE,  -- period start
    '2024-01-31'::DATE,  -- period end
    'admin'    -- created by
);

-- Get last month's payout
SELECT get_last_month_acarcia_payout();

-- View payment history
SELECT * FROM acarcia_payment_history;
*/

SELECT 'Acarcia payment tracking system created successfully!' as status;
SELECT 'Use calculate_acarcia_price_from_payment() to add payments and calculate prices' as message;
