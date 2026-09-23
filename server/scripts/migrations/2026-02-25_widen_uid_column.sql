-- ============================================
-- Migration: Widen uid column for legacy UIDs up to 30 characters
-- Run this on your production database
-- ============================================

ALTER TABLE pre_generated_uids MODIFY COLUMN uid VARCHAR(50) NOT NULL;
