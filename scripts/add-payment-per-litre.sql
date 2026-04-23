-- ADD AMOUNT_PER_LITRE COLUMN TO DUKE PAYMENTS
-- This script adds the amount_per_litre field to track payment per litre

-- Add amount_per_litre column to duke_payments table
ALTER TABLE duke_payments 
ADD COLUMN amount_per_litre DECIMAL(10, 2);

-- Update existing records with calculated amount_per_litre
UPDATE duke_payments 
SET amount_per_litre = CASE 
  WHEN liters > 0 THEN ROUND(amount / liters, 2)
  ELSE 0 
END
WHERE amount IS NOT NULL AND liters IS NOT NULL AND liters > 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_duke_payments_amount_per_litre ON duke_payments(amount_per_litre);

-- Verify the changes
SELECT 'amount_per_litre column added to duke_payments table' as status;
SELECT 'Existing payments updated with calculated amount per litre' as message;
SELECT 'Payment records will now show amount per litre automatically' as info;
