-- Create recurring_transactions table
-- This table stores recurring transaction templates that generate transactions monthly

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    "categoryId" UUID REFERENCES categories(id) ON DELETE SET NULL,
    "typeId" INTEGER NOT NULL CHECK ("typeId" IN (1, 2)), -- 1 = expense, 2 = income
    "recurrenceDay" INTEGER NOT NULL CHECK ("recurrenceDay" >= 1 AND "recurrenceDay" <= 31), -- Day of month (1-31)
    is_favorite BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_recurring_transactions_user FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id 
ON recurring_transactions("userId");

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_type 
ON recurring_transactions("userId", "typeId");

-- Add comment
COMMENT ON TABLE recurring_transactions IS 'Stores recurring transaction templates that generate transactions on a specific day of each month';


