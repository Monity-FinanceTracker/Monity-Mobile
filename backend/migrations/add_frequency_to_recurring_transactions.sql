-- Add frequency column to recurring_transactions table if it doesn't exist
-- This column stores the frequency of the recurring transaction (e.g., 'monthly', 'weekly', 'daily')

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the column 'frequency' exists in recurring_transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'recurring_transactions' 
        AND column_name = 'frequency'
    ) THEN
        -- Add the frequency column as nullable first
        ALTER TABLE recurring_transactions 
        ADD COLUMN frequency TEXT;
        
        -- Update existing records with default value 'monthly'
        UPDATE recurring_transactions 
        SET frequency = 'monthly' 
        WHERE frequency IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE recurring_transactions 
        ALTER COLUMN frequency SET NOT NULL;
        
        -- Set default value for future inserts
        ALTER TABLE recurring_transactions 
        ALTER COLUMN frequency SET DEFAULT 'monthly';
        
        RAISE NOTICE 'Column frequency added to recurring_transactions table';
    ELSE
        RAISE NOTICE 'Column frequency already exists in recurring_transactions table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN recurring_transactions.frequency IS 'Frequency of the recurring transaction (e.g., monthly, weekly, daily)';

