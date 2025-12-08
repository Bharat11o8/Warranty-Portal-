-- Migration: Add soft-delete columns to manpower table
-- Date: 2025-12-03
-- Purpose: Enable manpower archive system to preserve historical data and points

ALTER TABLE manpower 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER applicator_type,
ADD COLUMN removed_at TIMESTAMP NULL AFTER is_active,
ADD COLUMN removed_reason VARCHAR(255) NULL AFTER removed_at;

-- Add index for better query performance
CREATE INDEX idx_manpower_is_active ON manpower(is_active);
CREATE INDEX idx_manpower_vendor_active ON manpower(vendor_id, is_active);

-- Update existing records to be active
UPDATE manpower SET is_active = TRUE WHERE is_active IS NULL;
