-- Add 'block' as a valid interaction type so blocking can reuse the
-- existing interactions table instead of a new one.
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'block';
