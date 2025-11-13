-- Add startDate column to recurring_transactions table if it doesn't exist
-- This column stores the start date for the recurring transaction

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the column 'startDate' exists in recurring_transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'recurring_transactions' 
        AND column_name = 'startDate'
    ) THEN
        -- Add the startDate column as nullable first
        ALTER TABLE recurring_transactions 
        ADD COLUMN "startDate" DATE;
        
        -- Update existing records with current date as default
        UPDATE recurring_transactions 
        SET "startDate" = CURRENT_DATE 
        WHERE "startDate" IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE recurring_transactions 
        ALTER COLUMN "startDate" SET NOT NULL;
        
        -- Set default value for future inserts
        ALTER TABLE recurring_transactions 
        ALTER COLUMN "startDate" SET DEFAULT CURRENT_DATE;
        
        RAISE NOTICE 'Column startDate added to recurring_transactions table';
    ELSE
        RAISE NOTICE 'Column startDate already exists in recurring_transactions table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN recurring_transactions."startDate" IS 'Start date for the recurring transaction';

