-- Add recurrenceDay column to recurring_transactions table if it doesn't exist
-- This column stores the day of the month (1-31) when the recurring transaction should occur

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the column 'recurrenceDay' exists in recurring_transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'recurring_transactions' 
        AND column_name = 'recurrenceDay'
    ) THEN
        -- Add the recurrenceDay column with a default value (15th of the month)
        ALTER TABLE recurring_transactions 
        ADD COLUMN "recurrenceDay" INTEGER;
        
        -- Update existing records with default value (15th of the month)
        UPDATE recurring_transactions 
        SET "recurrenceDay" = 15 
        WHERE "recurrenceDay" IS NULL;
        
        -- Add NOT NULL constraint
        ALTER TABLE recurring_transactions 
        ALTER COLUMN "recurrenceDay" SET NOT NULL;
        
        -- Add CHECK constraint to ensure value is between 1 and 31 (if constraint doesn't exist)
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_constraint 
            WHERE conrelid = 'recurring_transactions'::regclass
            AND conname = 'check_recurrence_day_range'
        ) THEN
            ALTER TABLE recurring_transactions 
            ADD CONSTRAINT check_recurrence_day_range 
            CHECK ("recurrenceDay" >= 1 AND "recurrenceDay" <= 31);
        END IF;
        
        RAISE NOTICE 'Column recurrenceDay added to recurring_transactions table';
    ELSE
        RAISE NOTICE 'Column recurrenceDay already exists in recurring_transactions table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN recurring_transactions."recurrenceDay" IS 'Day of the month (1-31) when the recurring transaction should occur';

