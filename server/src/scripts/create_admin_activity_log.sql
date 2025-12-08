-- Admin Activity Log Table
-- Tracks all admin actions for audit purposes

CREATE TABLE IF NOT EXISTS admin_activity_log (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(36),
    target_name VARCHAR(255),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX idx_admin_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_log_action ON admin_activity_log(action_type);
CREATE INDEX idx_admin_log_created ON admin_activity_log(created_at);
CREATE INDEX idx_admin_log_target ON admin_activity_log(target_type, target_id);
