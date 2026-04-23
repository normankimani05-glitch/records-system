-- ACARCIA PAYMENT TRACKING SYSTEM
-- This script creates a system to track Acarcia payments and calculate price per liter

-- Step 1: Create Acarcia Payments table
CREATE TABLE IF NOT EXISTS acarcia_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    liters_covered DECIMAL(10,2) NOT NULL,
    calculated_price_per_liter DECIMAL(10,4) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create monthly price history table (enhanced)
CREATE TABLE IF NOT EXISTS acarcia_monthly_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_year VARCHAR(7) NOT NULL UNIQUE, -- Format: '2024-01'
    payment_date DATE NOT NULL,
    total_amount_paid DECIMAL(10,2) NOT NULL,
    total_liters_sold DECIMAL(10,2) NOT NULL,
    calculated_price_per_liter DECIMAL(10,4) NOT NULL,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create function to calculate monthly totals
CREATE OR REPLACE FUNCTION calculate_monthly_milk_totals(target_month DATE)
RETURNS TABLE(total_liters DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(home_amount), 0) as total_liters
    FROM milk_records 
    WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', target_month);
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to automatically calculate and insert pricing
CREATE OR REPLACE FUNCTION auto_update_acarcia_pricing(
    p_payment_date DATE,
    p_amount_paid DECIMAL(10,2),
    p_period_start DATE,
    p_period_end DATE,
    p_created_by VARCHAR(255)
)
RETURNS VOID AS $$
DECLARE
    v_month_year VARCHAR(7);
    v_total_liters DECIMAL(10,2);
    v_price_per_liter DECIMAL(10,4);
BEGIN
    -- Get month in YYYY-MM format
    v_month_year := TO_CHAR(p_payment_date, 'YYYY-MM');
    
    -- Calculate total liters for the period
    SELECT COALESCE(SUM(home_amount), 0) 
    INTO v_total_liters
    FROM milk_records 
    WHERE date >= p_period_start AND date <= p_period_end;
    
    -- Calculate price per liter
    IF v_total_liters > 0 THEN
        v_price_per_liter := p_amount_paid / v_total_liters;
    ELSE
        v_price_per_liter := 0;
    END IF;
    
    -- Insert or update monthly pricing
    INSERT INTO acarcia_monthly_pricing (
        month_year, payment_date, total_amount_paid, total_liters_sold,
        calculated_price_per_liter, payment_period_start, payment_period_end, created_by
    ) VALUES (
        v_month_year, p_payment_date, p_amount_paid, v_total_liters,
        v_price_per_liter, p_period_start, p_period_end, p_created_by
    )
    ON CONFLICT (month_year) 
    DO UPDATE SET
        payment_date = EXCLUDED.payment_date,
        total_amount_paid = EXCLUDED.total_amount_paid,
        total_liters_sold = EXCLUDED.total_liters_sold,
        calculated_price_per_liter = EXCLUDED.calculated_price_per_liter,
        payment_period_start = EXCLUDED.payment_period_start,
        payment_period_end = EXCLUDED.payment_period_end,
        updated_at = NOW();
    
    -- Insert payment record
    INSERT INTO acarcia_payments (
        payment_date, amount_paid, payment_period_start, payment_period_end,
        liters_covered, calculated_price_per_liter, created_by
    ) VALUES (
        p_payment_date, p_amount_paid, p_period_start, p_period_end,
        v_total_liters, v_price_per_liter, p_created_by
    );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create view for current pricing
CREATE OR REPLACE VIEW current_acarcia_pricing AS
SELECT 
    month_year,
    calculated_price_per_liter as current_price_per_liter,
    payment_date as last_payment_date,
    total_amount_paid,
    total_liters_sold,
    'Last Month Payout' as price_label
FROM acarcia_monthly_pricing 
WHERE is_active = true
ORDER BY payment_date DESC 
LIMIT 1;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_acarcia_payments_date ON acarcia_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_acarcia_payments_period ON acarcia_payments(payment_period_start, payment_period_end);
CREATE INDEX IF NOT EXISTS idx_acarcia_monthly_pricing_month ON acarcia_monthly_pricing(month_year);
CREATE INDEX IF NOT EXISTS idx_acarcia_monthly_pricing_date ON acarcia_monthly_pricing(payment_date DESC);

-- Step 7: Grant permissions
GRANT ALL ON acarcia_payments TO authenticated;
GRANT ALL ON acarcia_monthly_pricing TO authenticated;
GRANT ALL ON current_acarcia_pricing TO authenticated;

-- Success message
SELECT 'Acarcia payment tracking system created successfully!' as status;
SELECT 'You can now track payments and automatically calculate price per liter.' as message;
