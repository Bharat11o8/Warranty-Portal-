-- Create warranty_registrations table with all required columns
CREATE TABLE IF NOT EXISTS warranty_registrations (
    uid VARCHAR(16) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    car_make VARCHAR(100),
    car_model VARCHAR(100),
    car_year VARCHAR(4) NOT NULL,
    registration_number VARCHAR(20) NOT NULL,
    purchase_date DATE NOT NULL,
    installer_name VARCHAR(255),
    installer_contact VARCHAR(255),
    product_details JSON NOT NULL,
    manpower_id VARCHAR(36) DEFAULT NULL,
    warranty_type VARCHAR(50) NOT NULL,
    status ENUM('pending', 'pending_vendor', 'validated', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_product_type (product_type),
    INDEX idx_status (status),
    INDEX idx_manpower_id (manpower_id),
    INDEX idx_warranty_type (warranty_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add store_email column to vendor_details if it doesn't exist
ALTER TABLE vendor_details 
ADD COLUMN IF NOT EXISTS store_email VARCHAR(255) AFTER store_name;
