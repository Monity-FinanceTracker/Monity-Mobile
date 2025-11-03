-- Add is_favorite column to transactions table
-- This column should NOT be encrypted as it's a simple boolean flag

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create an index on is_favorite for faster queries when filtering favorites
-- Note: Using "userId" with quotes to match the actual column name in the database
CREATE INDEX IF NOT EXISTS idx_transactions_is_favorite 
ON transactions("userId", is_favorite) 
WHERE is_favorite = TRUE;

-- Update existing transactions to have is_favorite = false by default (already handled by DEFAULT)
COMMENT ON COLUMN transactions.is_favorite IS 'Flag indicating if transaction is marked as favorite by the user';

