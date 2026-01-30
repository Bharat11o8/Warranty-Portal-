-- POSM Request System Schema
-- Created: January 2026

-- Create POSM requests table
CREATE TABLE IF NOT EXISTS posm_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
    franchise_id VARCHAR(36) NOT NULL,
    
    -- Request details
    requirement TEXT NOT NULL,
    status ENUM('open', 'under_review', 'approved', 'in_production', 'dispatched', 'delivered', 'closed', 'rejected') DEFAULT 'open',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (franchise_id) REFERENCES vendor_details(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_franchise_id (franchise_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create POSM messages table (Chat History)
CREATE TABLE IF NOT EXISTS posm_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    sender_role ENUM('admin', 'franchise') NOT NULL,
    
    message TEXT DEFAULT NULL,
    attachments JSON DEFAULT NULL, -- Array of URLs
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (request_id) REFERENCES posm_requests(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_request_id (request_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
