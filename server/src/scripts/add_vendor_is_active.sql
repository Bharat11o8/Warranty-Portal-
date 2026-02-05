-- Add is_active column to vendor_verification table for franchise activation/deactivation feature
-- Run this migration manually in your database or it will be auto-applied on server start

ALTER TABLE vendor_verification ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to be active by default
UPDATE vendor_verification SET is_active = TRUE WHERE is_active IS NULL;
