-- Fix is_favorite column to ensure it never allows NULL and always has a default
-- This migration ensures the column is properly configured

-- First, update all NULL values to FALSE
UPDATE transactions 
SET is_favorite = FALSE 
WHERE is_favorite IS NULL;

-- Set the column to NOT NULL with DEFAULT FALSE
ALTER TABLE transactions 
ALTER COLUMN is_favorite SET NOT NULL,
ALTER COLUMN is_favorite SET DEFAULT FALSE;

-- Verify the column structure
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions' 
AND column_name = 'is_favorite';

