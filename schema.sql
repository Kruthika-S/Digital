-- Digital Heroes Lead Management Platform Schema

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    source VARCHAR(100),
    status ENUM('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost') NOT NULL DEFAULT 'New',
    assigned_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    author_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- e.g., 'lead', 'user', 'note'
    target_id INT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed Data
-- Passwords should be hashed in a real scenario, but for simplicity in seeding, 
-- we insert placeholder hashes here. The application should handle actual creation.
-- The password hash here corresponds to 'password123' hashed with bcrypt (salt rounds: 10)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@digitalheroes.com', '$2b$10$D3AkhDYOpGw2M6FlVSLUSekF4/hbIwcc7d7PVTNo/IeRMm53eZ/EC', 'admin'),
('Member User', 'member@digitalheroes.com', '$2b$10$D3AkhDYOpGw2M6FlVSLUSekF4/hbIwcc7d7PVTNo/IeRMm53eZ/EC', 'member')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO leads (name, company, email, phone, source, status, assigned_user_id) VALUES
('John Doe', 'Acme Corp', 'john@acme.com', '123-456-7890', 'Website', 'New', 2),
('Jane Smith', 'Globex', 'jane@globex.com', '098-765-4321', 'Referral', 'Contacted', 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO notes (lead_id, author_id, message) VALUES
(1, 2, 'Left a voicemail.'),
(2, 2, 'Interested in our enterprise plan.')
ON DUPLICATE KEY UPDATE message=VALUES(message);
