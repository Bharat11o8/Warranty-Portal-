-- ============================================
-- Migration: Track how much of each PPF roll has been used
--
-- A PPF roll is sold by serial number and holds a fixed area (250 sq.ft by
-- default, see the ppf_roll_capacity_sqft setting). One roll is fitted across
-- several vehicles, so the same serial is registered more than once and each
-- registration draws down part of the roll.
--
-- This table is that ledger: one row per (roll, warranty) draw. The remaining
-- area is derived by summing the rows whose warranty is not rejected, never
-- stored as a counter — a rejected warranty must return its area to the roll,
-- and two figures that can disagree eventually do.
--
-- Seat covers do not have serial numbers and never appear here.
-- ============================================

CREATE TABLE IF NOT EXISTS ppf_roll_consumption (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    roll_serial   VARCHAR(32) NOT NULL,
    warranty_uid  VARCHAR(255) NOT NULL,
    sqft_used     DECIMAL(7,2) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One draw per roll per warranty. Makes a retried submission collide
    -- rather than silently charge the roll twice.
    UNIQUE KEY uniq_roll_warranty (roll_serial, warranty_uid),

    -- Every availability check filters by serial.
    INDEX idx_roll_serial (roll_serial),
    INDEX idx_warranty_uid (warranty_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default roll capacity. Admin-editable afterwards; INSERT IGNORE so re-running
-- this migration never resets a value the admin has since changed.
INSERT IGNORE INTO system_settings (setting_key, setting_value, updated_by)
VALUES ('ppf_roll_capacity_sqft', '250', 'migration');
