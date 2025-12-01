-- Migration: Add onboarding_completed_at column to shops table
-- Date: 2025-11-30
-- Description: Tracks when a shop completed the onboarding process
--              Used to detect reinstalls and reset onboarding state

-- Add the onboarding_completed_at column
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN shops.onboarding_completed_at IS 'Timestamp when onboarding was completed. NULL means not completed or reset on reinstall.';
