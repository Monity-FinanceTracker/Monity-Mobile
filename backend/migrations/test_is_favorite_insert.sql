-- Test script to verify is_favorite column is working
-- Run this in Supabase SQL Editor

-- 1. Verify column exists and structure
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'transactions' 
AND column_name = 'is_favorite';

-- 2. Test direct insert with is_favorite=true
-- Replace 'YOUR_USER_ID_HERE' with an actual userId from your transactions table
INSERT INTO transactions (
    "userId",
    description,
    amount,
    category,
    date,
    "typeId",
    is_favorite,
    "createdAt"
) VALUES (
    (SELECT "userId" FROM transactions LIMIT 1),  -- Use existing userId
    'TEST TRANSACTION',
    100,
    'Test Category',
    NOW()::date,
    1,
    true,  -- Explicitly set to true
    NOW()
)
RETURNING id, description, is_favorite;

-- 3. Check if the value was saved correctly
SELECT id, description, is_favorite 
FROM transactions 
WHERE description = 'TEST TRANSACTION'
ORDER BY "createdAt" DESC 
LIMIT 1;

-- 4. Clean up test data (optional)
-- DELETE FROM transactions WHERE description = 'TEST TRANSACTION';




