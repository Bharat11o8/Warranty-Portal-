-- Grievance Assignments Table
-- Stores history of all assignments and follow-ups for grievances

CREATE TABLE IF NOT EXISTS grievance_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grievance_id INT NOT NULL,
    assignee_name VARCHAR(255) NOT NULL,
    assignee_email VARCHAR(255) NOT NULL,
    remarks TEXT,
    assignment_type ENUM('initial', 'follow_up') DEFAULT 'initial',
    email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by INT NOT NULL,
    sent_by_name VARCHAR(255),
    
    INDEX idx_grievance_id (grievance_id),
    INDEX idx_sent_by (sent_by),
    
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE
);
