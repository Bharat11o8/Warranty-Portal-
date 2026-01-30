-- Add internal notes to POSM requests for admin use
ALTER TABLE posm_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL AFTER status;
