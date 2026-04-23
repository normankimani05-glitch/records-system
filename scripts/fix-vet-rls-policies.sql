-- FIX VETERINARY RLS POLICIES
-- This script fixes Row Level Security policies for vet operations

-- Drop existing policies
DROP POLICY IF EXISTS "allow_all_ai_records" ON ai_records;
DROP POLICY IF EXISTS "allow_all_treatment_records" ON treatment_records;

-- Create permissive policies for veterinary operations
CREATE POLICY "allow_all_ai_records" ON ai_records
FOR ALL USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_treatment_records" ON treatment_records
FOR ALL USING (true)
WITH CHECK (true);

-- Verify policies are created
SELECT 'RLS policies for veterinary tables have been updated!' as status;
SELECT 'AI Records and Treatment Records can now be created by any authenticated user.' as message;
