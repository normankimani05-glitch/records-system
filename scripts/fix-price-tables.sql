-- FIX PRICE TABLES WITH PROPER CONSTRAINTS
-- First add unique constraints, then update prices

-- Add unique constraint to price_history if it doesn't exist
ALTER TABLE price_history 
ADD CONSTRAINT unique_effective_date 
UNIQUE (effective_date);

-- Add unique constraint to acarcia_pricing if it doesn't exist  
ALTER TABLE acarcia_pricing 
ADD CONSTRAINT unique_effective_from 
UNIQUE (effective_from);

-- Now update prices with proper ON CONFLICT
INSERT INTO price_history (
    effective_date, 
    duke_morning_price, 
    acarcia_price, 
    changed_by, 
    changed_at
) VALUES (
    CURRENT_DATE, 
    50.00, 
    45.00, 
    'admin', 
    NOW()
)
ON CONFLICT (effective_date) DO UPDATE SET
    duke_morning_price = EXCLUDED.duke_morning_price,
    acarcia_price = EXCLUDED.acarcia_price,
    changed_by = EXCLUDED.changed_by,
    changed_at = NOW();

-- Update acarcia pricing table  
INSERT INTO acarcia_pricing (
    effective_from, 
    effective_to, 
    price_per_liter, 
    created_at, 
    updated_at
) VALUES (
    CURRENT_DATE, 
    '9999-12-31', 
    45.00, 
    NOW(), 
    NOW()
)
ON CONFLICT (effective_from) DO UPDATE SET
    effective_from = EXCLUDED.effective_from,
    effective_to = EXCLUDED.effective_to,
    price_per_liter = EXCLUDED.price_per_liter,
    updated_at = NOW();

-- Show current prices
SELECT 
    'Duke Morning Price' as price_type, 
    duke_morning_price as current_price, 
    'KSh/L' as unit
FROM price_history 
ORDER BY effective_date DESC 
LIMIT 1;

SELECT 
    'Acarcia Price' as price_type, 
    acarcia_price as current_price, 
    'KSh/L' as unit
FROM price_history 
ORDER BY effective_date DESC 
LIMIT 1;

-- Success message
SELECT 'Price tables fixed and updated successfully!' as status;
