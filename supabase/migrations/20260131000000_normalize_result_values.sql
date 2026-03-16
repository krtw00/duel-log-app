-- Normalize result values to lowercase
-- Fixes issue #331: Statistics only counting wins

-- Update any uppercase result values to lowercase
UPDATE duels SET result = LOWER(result) WHERE result != LOWER(result);

-- Normalize 'lose' → 'loss' (20260124 migration used 'lose')
UPDATE duels SET result = 'loss' WHERE result = 'lose';

-- Add a check constraint to ensure future values are lowercase
ALTER TABLE duels DROP CONSTRAINT IF EXISTS duels_result_check;
ALTER TABLE duels ADD CONSTRAINT duels_result_check CHECK (result IN ('win', 'loss'));
