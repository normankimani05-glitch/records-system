-- FIX ACARCIA PRICING TABLE
-- This script fixes the acarcia_pricing table structure and constraints

-- Step 1: Drop existing table if it has wrong structure
DROP TABLE IF EXISTS acarcia_pricing CASCADE;

-- Step 2: Create acarcia_pricing table with correct structure
CREATE TABLE acarcia_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_year VARCHAR(7) NOT NULL UNIQUE, -- Format: "2024-01"
    price_per_liter DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    effective_from DATE NOT NULL,
    effective_to DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT valid_month_year CHECK (month_year ~ '^\d{4}-\d{2}$'),
    CONSTRAINT valid_price CHECK (price_per_liter >= 0),
    CONSTRAINT valid_date_range CHECK (effective_from <= effective_to)
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_acarcia_pricing_month_year ON acarcia_pricing(month_year);
CREATE INDEX IF NOT EXISTS idx_acarcia_pricing_effective_from ON acarcia_pricing(effective_from);
CREATE INDEX IF NOT EXISTS idx_acarcia_pricing_effective_to ON acarcia_pricing(effective_to);

-- Step 4: Add RLS policies (optional - you can disable if not needed)
ALTER TABLE acarcia_pricing ENABLE ROW LEVEL SECURITY;

-- Simple policy to allow all operations (you can restrict this later)
CREATE POLICY "allow_all_acarcia_pricing" ON acarcia_pricing
FOR ALL USING (true)
WITH CHECK (true);

-- Step 5: Verify table structure
SELECT 'acarcia_pricing table created successfully!' as status;
SELECT 'Table has unique constraint on month_year for upsert operations' as message;
