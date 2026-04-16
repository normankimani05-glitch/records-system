-- ULTRA BASIC ACARCIA FIX - Most simple possible
-- Just insert the data directly

-- Clear any existing data first
DELETE FROM acarcia_pricing;

-- Insert new record - most basic way
INSERT INTO acarcia_pricing (
    effective_from, 
    effective_to, 
    price_per_liter, 
    created_at, 
    updated_at
) VALUES (
    '2024-04-03', 
    '9999-12-31', 
    45.00, 
    NOW(), 
    NOW()
);

-- Show the result
SELECT * FROM acarcia_pricing;

-- Success
SELECT 'Acarcia pricing fixed!' as status;
