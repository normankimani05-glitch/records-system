-- Reset Vet Tables - Drop and Recreate
-- Run this to fix schema issues and recreate clean tables

-- Drop existing tables
DROP TABLE IF EXISTS ai_records CASCADE;
DROP TABLE IF EXISTS treatment_records CASCADE;

-- Drop storage policies
DROP POLICY IF EXISTS "Anyone can view vet images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vet images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own vet images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own vet images" ON storage.objects;

-- Recreate tables with correct schema
CREATE TABLE ai_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cow_name VARCHAR(100) NOT NULL,
    ai_image_url TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarua', 'Cate', 'Monica', 'Dorothy'))
);

CREATE TABLE treatment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cow_name VARCHAR(100) NOT NULL,
    treatment_date DATE NOT NULL,
    treatment_notes TEXT NOT NULL,
    treatment_image_url TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarua', 'Cate', 'Monica', 'Dorothy')),
    CONSTRAINT valid_treatment_date CHECK (treatment_date <= CURRENT_DATE)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_records_cow_name ON ai_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_at ON ai_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_by ON ai_records(created_by);

CREATE INDEX IF NOT EXISTS idx_treatment_records_cow_name ON treatment_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_at ON treatment_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_by ON treatment_records(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_treatment_date ON treatment_records(treatment_date DESC);

-- Enable RLS
ALTER TABLE ai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow all authenticated users
CREATE POLICY "Users can view all AI records" ON ai_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert AI records" ON ai_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update AI records" ON ai_records
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete AI records" ON ai_records
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all treatment records" ON treatment_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert treatment records" ON treatment_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update treatment records" ON treatment_records
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete treatment records" ON treatment_records
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vet-images', 'vet-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view vet images" ON storage.objects
FOR SELECT USING (bucket_id = 'vet-images');

CREATE POLICY "Authenticated users can upload vet images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vet-images' AND auth.role() = 'authenticated');

SELECT 'Vet tables reset and recreated successfully' as status;
