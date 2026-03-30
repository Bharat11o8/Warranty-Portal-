-- Migration: Add franchise-specific categories to grievances.category ENUM
-- The original ENUM only had customer categories; franchise raises logistics_issue, stock_issue, software_issue

ALTER TABLE grievances
MODIFY COLUMN category ENUM(
    'product_issue',
    'billing_issue',
    'store_issue',
    'manpower_issue',
    'service_issue',
    'warranty_issue',
    'logistics_issue',
    'stock_issue',
    'software_issue',
    'other'
) NOT NULL;
