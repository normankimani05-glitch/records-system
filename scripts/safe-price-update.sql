-- SAFE PRICE UPDATE - Doesn't interfere with logins
-- Only updates prices, doesn't touch credentials

-- Update existing price record for today (no DELETE to avoid conflicts)
UPDATE price_history 
SET 
    duke_morning_price = 50.00,
    acarcia_price = 45.00,
    changed_by = 'admin',
    changed_at = NOW()
WHERE effective_date = CAST(CURRENT_DATE AS TEXT);

-- If no record exists, insert one (only if UPDATE didn't affect any rows)
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

-- Update acarcia pricing (only update, don't delete)
UPDATE acarcia_pricing 
SET 
    effective_from = CAST(CURRENT_DATE AS TEXT),
    price_per_liter = 45.00,
    updated_at = NOW()
WHERE effective_to = '9999-12-31';

-- If no acarcia record exists, insert one
INSERT INTO acarcia_pricing (
    effective_from, 
    effective_to, 
    price_per_liter, 
    created_at, 
    updated_at
) SELECT 
    CAST(CURRENT_DATE AS TEXT), 
    '9999-12-31', 
    45.00, 
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM acarcia_pricing 
    WHERE effective_to = '9999-12-31'
);

-- Show current prices (read-only, no modifications)
SELECT 'Current Prices After Update:' as info;

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

-- Success message (no table modifications)
SELECT 'Price update completed successfully!' as status,
    'Login credentials remain untouched' as note;
