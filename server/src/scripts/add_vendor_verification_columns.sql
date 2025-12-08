-- Add rejection_reason column to vendor_verification table
ALTER TABLE vendor_verification 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Add verified_at column if it doesn't exist (for tracking when verification happened)
ALTER TABLE vendor_verification 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP DEFAULT NULL;
