-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('customer', 'vendor', 'admin') NOT NULL,
  UNIQUE KEY unique_user_role (user_id, role),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_details table
CREATE TABLE IF NOT EXISTS vendor_details (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vendor_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create manpower table
CREATE TABLE IF NOT EXISTS manpower (
  id VARCHAR(36) PRIMARY KEY,
  vendor_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  manpower_id VARCHAR(50) NOT NULL,
  applicator_type ENUM('seat_cover', 'ppf_spf', 'ev') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendor_details(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vendor_verification table
CREATE TABLE IF NOT EXISTS vendor_verification (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(36),
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_verification_token (verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_otp_code (otp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create warranty_registrations table
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_type VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  car_make VARCHAR(100) NOT NULL,
  car_model VARCHAR(100) NOT NULL,
  car_year VARCHAR(4) NOT NULL,
  registration_number VARCHAR(50) NOT NULL,
  purchase_date DATE NOT NULL,
  installer_name VARCHAR(255),
  installer_contact VARCHAR(20),
  product_details JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_product_type (product_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;