-- Add categoryId column to transactions table
-- This column should NOT be encrypted as it's a foreign key reference
-- Similar to how is_favorite works

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS "categoryId" UUID;

-- Create an index on categoryId for faster queries when filtering by category
CREATE INDEX IF NOT EXISTS idx_transactions_category_id 
ON transactions("userId", "categoryId") 
WHERE "categoryId" IS NOT NULL;

-- Add foreign key constraint to ensure referential integrity
-- This ensures that categoryId references a valid category
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_category_id 
FOREIGN KEY ("categoryId") 
REFERENCES categories(id) 
ON DELETE SET NULL;

-- Update the comment
COMMENT ON COLUMN transactions."categoryId" IS 'Foreign key reference to the category. Used for efficient filtering without needing to decrypt category names.';

