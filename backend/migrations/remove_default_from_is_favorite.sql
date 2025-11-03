-- Remove DEFAULT constraint from is_favorite column
-- We will always send the value explicitly, so we don't need a default

ALTER TABLE transactions 
ALTER COLUMN is_favorite DROP DEFAULT;

-- The column should still be NOT NULL with explicit values
-- But we'll allow NULL for now and handle it in the application
ALTER TABLE transactions 
ALTER COLUMN is_favorite DROP NOT NULL;

-- Update the comment
COMMENT ON COLUMN transactions.is_favorite IS 'Flag indicating if transaction is marked as favorite by the user. Always explicitly set in application code.';




