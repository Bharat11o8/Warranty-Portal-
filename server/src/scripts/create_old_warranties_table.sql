-- ==================================================
-- Old Warranties Archive System - Seat Covers Table
-- ==================================================
-- This table is STANDALONE and not connected to the main warranty system
-- Purpose: Archive ~22,364 historical seat cover warranty records

CREATE TABLE IF NOT EXISTS old_warranties_seatcovers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(50),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_mobile VARCHAR(20),
  product_name VARCHAR(255),
  warranty_type VARCHAR(50),
  store_email VARCHAR(255),
  purchase_date DATE,
  store_name VARCHAR(255),
  file_proof_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for fast searching
  INDEX idx_uid (uid),
  INDEX idx_customer_email (customer_email),
  INDEX idx_customer_mobile (customer_mobile),
  INDEX idx_store_name (store_name),
  INDEX idx_purchase_date (purchase_date),
  
  -- Full-text index for powerful search across multiple columns
  FULLTEXT INDEX ft_search (uid, customer_name, customer_email, customer_mobile, store_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- After creating the table, import data using:
-- ==================================================
-- Option 1: MySQL Workbench Table Data Import Wizard (GUI - Recommended for beginners)
-- Option 2: phpMyAdmin Import (available on Hostinger)
-- Option 3: LOAD DATA command (fastest for large datasets)

-- LOAD DATA LOCAL INFILE 'path/to/seatcovers.csv'
-- INTO TABLE old_warranties_seatcovers
-- FIELDS TERMINATED BY ',' 
-- ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 ROWS
-- (uid, customer_name, customer_email, customer_mobile, product_name, 
--  warranty_type, store_email, @purchase_date, store_name, file_proof_url)
-- SET purchase_date = STR_TO_DATE(@purchase_date, '%d-%m-%Y');
