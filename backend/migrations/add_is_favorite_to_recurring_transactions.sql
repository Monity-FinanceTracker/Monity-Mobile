-- Add is_favorite column to recurring_transactions table if it doesn't exist
-- This column stores whether the recurring transaction is marked as favorite

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the column 'is_favorite' exists in recurring_transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'recurring_transactions' 
        AND column_name = 'is_favorite'
    ) THEN
        -- Add the is_favorite column with default value FALSE
        ALTER TABLE recurring_transactions 
        ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
        
        -- Remove the default after adding (optional, but keeps it clean)
        -- ALTER TABLE recurring_transactions 
        -- ALTER COLUMN is_favorite DROP DEFAULT;
        
        RAISE NOTICE 'Column is_favorite added to recurring_transactions table';
    ELSE
        RAISE NOTICE 'Column is_favorite already exists in recurring_transactions table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN recurring_transactions.is_favorite IS 'Indicates if the recurring transaction is marked as favorite';

