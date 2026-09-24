-- Migration: Add index on profiles.phone_number
-- Reason: Login now looks up users by phone_number (non-admin roles).
--         Without this index, every login causes a full table scan.
-- Date: 2026-05-01

ALTER TABLE profiles 
ADD INDEX idx_profiles_phone_number (phone_number);
