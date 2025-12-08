-- Migration script to change warranty_registrations to use UID as primary key
-- and remove registration_number field, add warranty_type field

-- Step 1: Create new table with UID as primary key
CREATE TABLE IF NOT EXISTS warranty_registrations_new (
    uid VARCHAR(16) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    car_make VARCHAR(100) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    car_year VARCHAR(4) NOT NULL,
    purchase_date DATE NOT NULL,
    installer_name VARCHAR(255),
    installer_contact VARCHAR(255),
    product_details JSON NOT NULL,
    manpower_id VARCHAR(36) DEFAULT NULL,
    warranty_type VARCHAR(50) NOT NULL,
    status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_product_type (product_type),
    INDEX idx_status (status),
    INDEX idx_manpower_id (manpower_id),
    INDEX idx_warranty_type (warranty_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Migrate existing data
-- Extract UID from product_details JSON and determine warranty_type based on product_details.productName
INSERT INTO warranty_registrations_new (
    uid, 
    user_id, 
    product_type, 
    customer_name, 
    customer_email, 
    customer_phone,
    customer_address, 
    car_make, 
    car_model, 
    car_year, 
    purchase_date,
    installer_name, 
    installer_contact, 
    product_details, 
    manpower_id,
    warranty_type,
    status, 
    rejection_reason, 
    created_at
)
SELECT 
    JSON_UNQUOTE(JSON_EXTRACT(product_details, '$.uid')) as uid,
    user_id,
    product_type,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    car_make,
    car_model,
    car_year,
    purchase_date,
    installer_name,
    installer_contact,
    product_details,
    manpower_id,
    -- Determine warranty_type based on productName in product_details
    CASE JSON_UNQUOTE(JSON_EXTRACT(product_details, '$.productName'))
        WHEN 'leather-seat-cover' THEN '2 Years'
        WHEN 'fabric-seat-cover' THEN '1 Year'
        WHEN 'premium-seat-cover' THEN '3 Years'
        WHEN 'custom-seat-cover' THEN '1 Year'
        ELSE '1 Year'
    END as warranty_type,
    status,
    rejection_reason,
    created_at
FROM warranty_registrations
WHERE JSON_UNQUOTE(JSON_EXTRACT(product_details, '$.uid')) IS NOT NULL
  AND JSON_UNQUOTE(JSON_EXTRACT(product_details, '$.uid')) != '';

-- Step 3: Drop old table
DROP TABLE warranty_registrations;

-- Step 4: Rename new table to original name
ALTER TABLE warranty_registrations_new RENAME TO warranty_registrations;

-- Migration complete
SELECT 'Migration completed successfully!' as status;
