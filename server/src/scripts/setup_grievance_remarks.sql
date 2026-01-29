-- Grievance Remarks History Table
-- Created: January 2026
-- Purpose: Track timestamped remarks from franchise and admin

CREATE TABLE IF NOT EXISTS grievance_remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grievance_id INT NOT NULL,
    added_by ENUM('franchise', 'admin') NOT NULL,
    added_by_name VARCHAR(100) NOT NULL,
    added_by_id VARCHAR(36) NOT NULL,
    remark TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
    INDEX idx_grievance_id (grievance_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE grievance_remarks COMMENT = 'History of remarks/responses on grievances';
