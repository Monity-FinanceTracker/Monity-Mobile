-- Add category column to recurring_transactions table if it doesn't exist
-- This column stores the category name (encrypted) for recurring transactions

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the column 'category' exists in recurring_transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'recurring_transactions' 
        AND column_name = 'category'
    ) THEN
        -- Add the category column (nullable first to allow existing records)
        ALTER TABLE recurring_transactions 
        ADD COLUMN category TEXT;
        
        -- Update existing records with empty string if null
        UPDATE recurring_transactions 
        SET category = '' 
        WHERE category IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE recurring_transactions 
        ALTER COLUMN category SET NOT NULL;
        
        RAISE NOTICE 'Column category added to recurring_transactions table';
    ELSE
        RAISE NOTICE 'Column category already exists in recurring_transactions table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN recurring_transactions.category IS 'Category name for the recurring transaction (encrypted)';

