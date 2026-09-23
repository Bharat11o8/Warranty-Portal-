-- Fraud Detection Columns for Warranty Table
-- Run this migration on the database to add fraud tracking fields

ALTER TABLE warranty_registrations ADD COLUMN exif_lat DECIMAL(10,7) NULL;
ALTER TABLE warranty_registrations ADD COLUMN exif_lng DECIMAL(10,7) NULL;
ALTER TABLE warranty_registrations ADD COLUMN exif_timestamp DATETIME NULL;
ALTER TABLE warranty_registrations ADD COLUMN exif_device VARCHAR(100) NULL;
ALTER TABLE warranty_registrations ADD COLUMN submission_ip VARCHAR(45) NULL;
ALTER TABLE warranty_registrations ADD COLUMN ip_city VARCHAR(100) NULL;
ALTER TABLE warranty_registrations ADD COLUMN ip_region VARCHAR(100) NULL;
ALTER TABLE warranty_registrations ADD COLUMN ip_lat DECIMAL(10,7) NULL;
ALTER TABLE warranty_registrations ADD COLUMN ip_lng DECIMAL(10,7) NULL;
ALTER TABLE warranty_registrations ADD COLUMN fraud_score TINYINT DEFAULT 0;
ALTER TABLE warranty_registrations ADD COLUMN fraud_flags JSON NULL;
ALTER TABLE warranty_registrations ADD COLUMN seat_cover_photo_url TEXT NULL;
ALTER TABLE warranty_registrations ADD COLUMN car_outer_photo_url TEXT NULL;

-- Also add latitude/longitude to vendor_details if missing
ALTER TABLE vendor_details ADD COLUMN latitude VARCHAR(50) NULL;
ALTER TABLE vendor_details ADD COLUMN longitude VARCHAR(50) NULL;
