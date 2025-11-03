-- Remove DEFAULT constraint from is_favorite column
-- This ensures that when we explicitly send is_favorite=true, it will be saved as true
-- instead of using the DEFAULT FALSE value

-- First, remove the DEFAULT
ALTER TABLE transactions 
ALTER COLUMN is_favorite DROP DEFAULT;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions' 
AND column_name = 'is_favorite';




