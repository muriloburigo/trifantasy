-- 1. Remove existing constraint on races.distance
ALTER TABLE races DROP CONSTRAINT IF EXISTS races_distance_check;

-- 2. Add new constraint including 'T100' and also 'ows', 'other' for future-proofing
-- and maintaining existing types
ALTER TABLE races ADD CONSTRAINT races_distance_check 
CHECK (distance IN ('full', '70.3', 'T100', 'ows', 'other'));
