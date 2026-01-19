-- Grievances Module Schema
-- Created: January 2026

-- Create grievances table
CREATE TABLE IF NOT EXISTS grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    franchise_id INT DEFAULT NULL,
    warranty_uid VARCHAR(16) DEFAULT NULL,
    
    -- Issue details
    category ENUM('product_issue', 'billing_issue', 'store_issue', 'manpower_issue', 'service_issue', 'warranty_issue', 'other') NOT NULL,
    sub_category VARCHAR(100) DEFAULT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    attachments JSON DEFAULT NULL,
    
    -- Status & Priority
    status ENUM('submitted', 'under_review', 'in_progress', 'resolved', 'rejected') DEFAULT 'submitted',
    priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Remarks
    franchise_remarks TEXT DEFAULT NULL,
    admin_remarks TEXT DEFAULT NULL,
    
    -- Customer feedback (after resolution)
    customer_rating TINYINT DEFAULT NULL CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP DEFAULT NULL,
    
    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (franchise_id) REFERENCES vendor_details(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_customer_id (customer_id),
    INDEX idx_franchise_id (franchise_id),
    INDEX idx_warranty_uid (warranty_uid),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE grievances COMMENT = 'Customer grievances/complaints tracking';
