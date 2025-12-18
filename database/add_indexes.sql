-- Add Missing Indexes for Performance
-- Run this migration to add indexes on frequently queried columns

-- ===========================================
-- warranty_registrations table
-- ===========================================

-- Index on customer_email (used in GROUP BY and WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_customer_email 
ON warranty_registrations(customer_email);

-- Index on created_at (used in ORDER BY clauses)
CREATE INDEX IF NOT EXISTS idx_created_at 
ON warranty_registrations(created_at);

-- Composite index for status filtering with date ordering
CREATE INDEX IF NOT EXISTS idx_status_created 
ON warranty_registrations(status, created_at);

-- ===========================================
-- manpower table
-- ===========================================

-- Index on vendor_id (used in JOINs)
-- Note: This might already exist if foreign key was created
CREATE INDEX IF NOT EXISTS idx_manpower_vendor 
ON manpower(vendor_id);

-- Index for active manpower filtering
CREATE INDEX IF NOT EXISTS idx_manpower_active 
ON manpower(vendor_id, is_active);

-- ===========================================
-- profiles table
-- ===========================================

-- Index on email (should already exist, but ensure it does)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index on phone_number
CREATE INDEX IF NOT EXISTS idx_profiles_phone 
ON profiles(phone_number);

-- ===========================================
-- vendor_details table
-- ===========================================

-- Index on user_id
CREATE INDEX IF NOT EXISTS idx_vendor_user 
ON vendor_details(user_id);

-- ===========================================
-- otp_codes table
-- ===========================================

-- Index on user_id with used status
CREATE INDEX IF NOT EXISTS idx_otp_user_used 
ON otp_codes(user_id, is_used);

-- Index on expiration for cleanup
CREATE INDEX IF NOT EXISTS idx_otp_expires 
ON otp_codes(expires_at);

-- ===========================================
-- Note: Run with caution on large tables
-- ===========================================
-- Check existing indexes:
-- SHOW INDEX FROM warranty_registrations;
-- SHOW INDEX FROM manpower;
-- SHOW INDEX FROM profiles;
