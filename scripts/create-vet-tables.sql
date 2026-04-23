-- Create Vet Records Tables
-- This script creates tables for AI records and Treatment records with image support

-- AI Records Table
CREATE TABLE IF NOT EXISTS ai_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cow_name VARCHAR(100) NOT NULL,
    ai_image_url TEXT, -- URL or base64 data for the image
    ai_image_type VARCHAR(50) DEFAULT 'image/jpeg', -- MIME type of the image
    created_by VARCHAR(100) NOT NULL, -- Vet who created the record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarua', 'Cate', 'Monica', 'Dorothy'))
);

-- Treatment Records Table
CREATE TABLE IF NOT EXISTS treatment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cow_name VARCHAR(100) NOT NULL,
    treatment_date DATE NOT NULL,
    treatment_notes TEXT NOT NULL,
    treatment_image_url TEXT, -- URL or base64 data for the image
    treatment_image_type VARCHAR(50) DEFAULT 'image/jpeg', -- MIME type of the image
    created_by VARCHAR(100) NOT NULL, -- Vet who created the record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_cow_name CHECK (cow_name IN ('Nyandarua', 'Cate', 'Monica', 'Dorothy')),
    CONSTRAINT valid_treatment_date CHECK (treatment_date <= CURRENT_DATE)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_records_cow_name ON ai_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_at ON ai_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_records_created_by ON ai_records(created_by);

CREATE INDEX IF NOT EXISTS idx_treatment_records_cow_name ON treatment_records(cow_name);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_at ON treatment_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_records_created_by ON treatment_records(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_records_treatment_date ON treatment_records(treatment_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ai_records_updated_at 
    BEFORE UPDATE ON ai_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_records_updated_at 
    BEFORE UPDATE ON treatment_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to manage records
CREATE POLICY "Users can view all AI records" ON ai_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert AI records" ON ai_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own AI records" ON ai_records
    FOR UPDATE USING (auth.uid() = auth.uid());

CREATE POLICY "Users can delete their own AI records" ON ai_records
    FOR DELETE USING (auth.uid() = auth.uid());

CREATE POLICY "Users can view all treatment records" ON treatment_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert treatment records" ON treatment_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own treatment records" ON treatment_records
    FOR UPDATE USING (auth.uid() = auth.uid());

CREATE POLICY "Users can delete their own treatment records" ON treatment_records
    FOR DELETE USING (auth.uid() = auth.uid());
