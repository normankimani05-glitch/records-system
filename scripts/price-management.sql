-- PRICE MANAGEMENT SYSTEM
-- Handles price updates and displays current prices

-- Function to update and save prices
CREATE OR REPLACE FUNCTION update_prices(
    new_duke_morning_price NUMERIC,
    new_acarcia_price NUMERIC,
    updated_by TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Insert new price history record
    INSERT INTO price_history (
        effective_date, 
        duke_morning_price, 
        acarcia_price, 
        changed_by,
        changed_at
    ) VALUES (
        CURRENT_DATE,
        new_duke_morning_price,
        new_acarcia_price,
        updated_by,
        NOW()
    );
    
    -- Update acarcia pricing table
    INSERT INTO acarcia_pricing (
        effective_from,
        effective_to,
        price_per_liter,
        created_at,
        updated_at
    ) VALUES (
        CURRENT_DATE,
        '9999-12-31', -- Far future date
        new_acarcia_price,
        NOW(),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- View to get current prices
CREATE OR REPLACE VIEW current_prices AS
SELECT 
    ph.duke_morning_price,
    ph.acarcia_price,
    ph.changed_by,
    ph.changed_at,
    ph.effective_date
FROM price_history ph
ORDER BY ph.effective_date DESC 
LIMIT 1;

-- Function to get current prices for display
CREATE OR REPLACE FUNCTION get_current_prices()
RETURNS TABLE(
    duke_morning_price NUMERIC,
    acarcia_price NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE,
    updated_by TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.duke_morning_price,
        ph.acarcia_price,
        ph.changed_at,
        ph.changed_by
    FROM price_history ph
    ORDER BY ph.effective_date DESC 
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update effective_to when new price is added
CREATE OR REPLACE FUNCTION update_acarcia_effective_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the previous record's effective_to to yesterday
    UPDATE acarcia_pricing 
    SET effective_to = CURRENT_DATE - INTERVAL '1 day'
    WHERE id != NEW.id 
    AND effective_to = '9999-12-31';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_acarcia_effective_dates ON acarcia_pricing;
CREATE TRIGGER trigger_update_acarcia_effective_dates
    AFTER INSERT ON acarcia_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_acarcia_effective_dates();

-- Query to display current prices (for testing)
SELECT 
    'Current Prices' as title,
    'Duke Morning' as price_type,
    duke_morning_price as price,
    'KSh/L' as unit
FROM current_prices
UNION ALL
SELECT 
    'Current Prices' as title,
    'Acarcia Last Price' as price_type,
    acarcia_price as price,
    'KSh/L' as unit
FROM current_prices;

-- Example usage queries:
-- To update prices:
-- SELECT update_prices(50, 45, 'admin');

-- To get current prices:
-- SELECT * FROM get_current_prices();

-- To view price history:
-- SELECT * FROM price_history ORDER BY effective_date DESC;

-- To view acarcia pricing history:
-- SELECT * FROM acarcia_pricing ORDER BY effective_from DESC;
