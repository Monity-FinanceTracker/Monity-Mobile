-- Add category, is_favorite, recurrenceDay, and frequency columns to recurring_transactions table if they don't exist
-- This migration adds all columns needed for recurring transactions

DO $$
BEGIN
    -- Add category column if it doesn't exist
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

    -- Add is_favorite column if it doesn't exist
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
        
        RAISE NOTICE 'Column is_favorite added to recurring_transactions table';
    ELSE
        RAISE NOTICE 'Column is_favorite already exists in recurring_transactions table';
    END IF;

    -- Add recurrenceDay column if it doesn't exist
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

    -- Add frequency column if it doesn't exist
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

-- Add comments to the columns
COMMENT ON COLUMN recurring_transactions.category IS 'Category name for the recurring transaction (encrypted)';
COMMENT ON COLUMN recurring_transactions.is_favorite IS 'Indicates if the recurring transaction is marked as favorite';
COMMENT ON COLUMN recurring_transactions."recurrenceDay" IS 'Day of the month (1-31) when the recurring transaction should occur';
COMMENT ON COLUMN recurring_transactions.frequency IS 'Frequency of the recurring transaction (e.g., monthly, weekly, daily)';

