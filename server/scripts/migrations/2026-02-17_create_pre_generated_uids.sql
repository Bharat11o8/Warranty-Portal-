-- ============================================
-- Migration: Create pre_generated_uids table
-- Purpose: Store pre-generated UIDs from external system
-- ============================================

CREATE TABLE IF NOT EXISTS pre_generated_uids (
    uid VARCHAR(50) NOT NULL PRIMARY KEY,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_used (is_used),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
