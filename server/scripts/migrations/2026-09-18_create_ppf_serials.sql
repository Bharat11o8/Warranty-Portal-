-- ============================================
-- Migration: Serial numbers issued to a store ahead of use
--
-- A PPF roll's serial was whatever the installer typed, so a mistyped one
-- quietly opened a fresh roll with a full allowance instead of drawing on the
-- real one. An admin can now issue a serial to a store in advance, the way
-- seat-cover UIDs are pre-generated, and hand it out with the roll.
--
-- The number is reserved, not yet a roll: it becomes one in ppf_rolls the first
-- time a warranty is registered against it. Until then it sits here as
-- available, which is what makes "issued but never used" visible.
--
-- Seat covers use pre_generated_uids and never appear here.
-- ============================================

CREATE TABLE IF NOT EXISTS ppf_serials (
    serial_number   VARCHAR(32) NOT NULL PRIMARY KEY,
    -- Which store it was issued to. Kept as the code rather than a foreign key
    -- so a serial already handed out survives the store being renamed.
    store_code      VARCHAR(20) NOT NULL,
    store_name      VARCHAR(255) DEFAULT NULL,
    -- The per-store counter this serial took, so the next one can continue from
    -- it without parsing the number back out of the string.
    sequence_number INT NOT NULL,
    issued_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issued_by       VARCHAR(255) DEFAULT NULL,

    INDEX idx_store_code (store_code),
    INDEX idx_issued_at (issued_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
