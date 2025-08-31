-- CultureON Analytics Database Schema
-- Optimized for SQLite3

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS sensor_readings;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS devices;

-- Devices table
CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Standard', 'Premium', 'Research')),
    status TEXT DEFAULT 'online' CHECK(status IN ('online', 'offline', 'maintenance')),
    firmware_version TEXT DEFAULT '1.0.0',
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sensor readings table with optimized indexing
CREATE TABLE sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    temperature REAL NOT NULL,
    co2 REAL NOT NULL,
    humidity REAL NOT NULL,
    oxygen REAL,
    battery REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Alerts table for tracking anomalies and notifications
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'CRITICAL')),
    value REAL,
    threshold TEXT, -- JSON string containing threshold details
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at DATETIME,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- Create indexes for performance
CREATE INDEX idx_readings_device_time ON sensor_readings(device_id, timestamp DESC);
CREATE INDEX idx_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_alerts_device ON alerts(device_id, timestamp DESC);
CREATE INDEX idx_alerts_severity ON alerts(severity, timestamp DESC);
CREATE INDEX idx_alerts_unack ON alerts(acknowledged, timestamp DESC);

-- Insert initial device configurations
INSERT INTO devices (id, name, type, location) VALUES 
    ('CO-STD-001', 'CultureON Standard - Lab A1', 'Standard', 'Lab A - Bench 1'),
    ('CO-STD-002', 'CultureON Standard - Lab A2', 'Standard', 'Lab A - Bench 2'),
    ('CO-PREM-001', 'CultureON Premium - Lab B1', 'Premium', 'Lab B - Bench 1'),
    ('CO-PREM-002', 'CultureON Premium - Lab B2', 'Premium', 'Lab B - Bench 2'),
    ('CO-RES-001', 'CultureON Research - Lab C1', 'Research', 'Lab C - Isolation Room 1'),
    ('CO-RES-002', 'CultureON Research - Lab C2', 'Research', 'Lab C - Isolation Room 2');

-- Create view for latest readings per device
CREATE VIEW latest_readings AS
SELECT 
    d.id as device_id,
    d.name,
    d.type,
    d.status,
    sr.temperature,
    sr.co2,
    sr.humidity,
    sr.oxygen,
    sr.battery,
    sr.timestamp
FROM devices d
LEFT JOIN sensor_readings sr ON d.id = sr.device_id
WHERE sr.id IN (
    SELECT MAX(id) 
    FROM sensor_readings 
    GROUP BY device_id
);

-- Create view for alert statistics
CREATE VIEW alert_statistics AS
SELECT 
    device_id,
    COUNT(*) as total_alerts,
    SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
    SUM(CASE WHEN severity = 'WARNING' THEN 1 ELSE 0 END) as warning_count,
    SUM(CASE WHEN severity = 'INFO' THEN 1 ELSE 0 END) as info_count,
    SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged_count,
    MAX(timestamp) as last_alert_time
FROM alerts
GROUP BY device_id;