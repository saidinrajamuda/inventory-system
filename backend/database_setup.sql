CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    location VARCHAR(100) DEFAULT '',
    condition_status VARCHAR(50) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO items (code, name, category, quantity, location, condition_status) VALUES
('TOOL-0001', 'Hammer', 'Tools', 10, 'Warehouse A', 'Available'),
('MAT-0001', 'Cement', 'Materials', 50, 'Warehouse B', 'Available'),
('HEAVY-0001', 'Excavator', 'Heavy Equipment', 1, 'Site 1', 'In Use');