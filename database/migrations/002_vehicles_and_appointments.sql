-- Migration: 002_vehicles_and_appointments
-- Description: Add vehicles inventory and test drive appointments

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  dealer_id INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  trim VARCHAR(100),
  vin VARCHAR(50) UNIQUE,
  price DECIMAL(12, 2) NOT NULL,
  mileage INTEGER DEFAULT 0,
  color VARCHAR(50),
  body_type VARCHAR(50), -- 'sedan', 'suv', 'truck', 'coupe', 'convertible', 'hatchback', 'wagon'
  fuel_type VARCHAR(50), -- 'gasoline', 'diesel', 'electric', 'hybrid', 'plug-in-hybrid'
  transmission VARCHAR(50), -- 'automatic', 'manual', 'cvt'
  drivetrain VARCHAR(50), -- 'fwd', 'rwd', 'awd', '4wd'
  engine VARCHAR(100),
  horsepower INTEGER,
  mpg_city INTEGER,
  mpg_highway INTEGER,
  features TEXT[], -- Array of features
  description TEXT,
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'pending', 'sold', 'reserved'
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle media table (images, videos)
CREATE TABLE IF NOT EXISTS vehicle_media (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL, -- 'image', 'video', '360'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test drive appointments table
CREATE TABLE IF NOT EXISTS test_drive_appointments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  dealer_id INTEGER NOT NULL REFERENCES dealers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  alternative_date DATE,
  alternative_time TIME,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'
  notes TEXT,
  dealer_notes TEXT,
  confirmed_at TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle views/interactions tracking
CREATE TABLE IF NOT EXISTS vehicle_interactions (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id),
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'inquiry', 'favorite', 'share'
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer_id ON vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_body_type ON vehicles(body_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_featured ON vehicles(featured);
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle_id ON vehicle_media(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_vehicle_id ON test_drive_appointments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_dealer_id ON test_drive_appointments(dealer_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_lead_id ON test_drive_appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_status ON test_drive_appointments(status);
CREATE INDEX IF NOT EXISTS idx_test_drive_preferred_date ON test_drive_appointments(preferred_date);

-- Trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_drive_updated_at BEFORE UPDATE ON test_drive_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
