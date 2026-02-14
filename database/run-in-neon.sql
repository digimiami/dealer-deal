-- Complete SQL script to run in Neon SQL Editor
-- Copy and paste this entire file into Neon SQL Editor and run

-- ============================================
-- STEP 1: Initial Schema
-- ============================================

-- Dealers table
CREATE TABLE IF NOT EXISTS dealers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  territory VARCHAR(100),
  specialties TEXT[],
  active BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 10,
  current_load INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  vehicle_interest TEXT,
  budget VARCHAR(100),
  timeline VARCHAR(100),
  preferred_contact VARCHAR(20) DEFAULT 'email',
  source VARCHAR(50) DEFAULT 'website',
  status VARCHAR(50) DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes TEXT,
  dealer_id INTEGER REFERENCES dealers(id),
  openclaw_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead assignments table
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  dealer_id INTEGER NOT NULL REFERENCES dealers(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by VARCHAR(100) DEFAULT 'system',
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT
);

-- Lead interactions table
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  channel VARCHAR(50),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead follow-ups table
CREATE TABLE IF NOT EXISTS lead_followups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  followup_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: Vehicles and Appointments
-- ============================================

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
  body_type VARCHAR(50),
  fuel_type VARCHAR(50),
  transmission VARCHAR(50),
  drivetrain VARCHAR(50),
  engine VARCHAR(100),
  horsepower INTEGER,
  mpg_city INTEGER,
  mpg_highway INTEGER,
  features TEXT[],
  description TEXT,
  status VARCHAR(50) DEFAULT 'available',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle media table
CREATE TABLE IF NOT EXISTS vehicle_media (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL,
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
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  dealer_notes TEXT,
  confirmed_at TIMESTAMP,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle interactions table
CREATE TABLE IF NOT EXISTS vehicle_interactions (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id),
  interaction_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 3: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_dealer_id ON leads(dealer_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_dealer_id ON lead_assignments(dealer_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled_at ON lead_followups(scheduled_at);
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

-- ============================================
-- STEP 4: Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON dealers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_followups_updated_at BEFORE UPDATE ON lead_followups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_drive_updated_at BEFORE UPDATE ON test_drive_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: Seed Sample Data
-- ============================================

-- Sample dealers
INSERT INTO dealers (name, email, phone, territory, specialties, capacity, priority) VALUES
('John Smith Auto', 'john@carforsales.net', '+1234567890', 'North Region', ARRAY['sedan', 'suv'], 15, 8),
('Premium Motors', 'premium@carforsales.net', '+1234567891', 'South Region', ARRAY['luxury', 'suv'], 10, 9),
('Budget Cars Inc', 'budget@carforsales.net', '+1234567892', 'East Region', ARRAY['sedan', 'truck'], 20, 6),
('Electric Vehicle Center', 'ev@carforsales.net', '+1234567893', 'West Region', ARRAY['electric', 'luxury'], 12, 7)
ON CONFLICT (email) DO NOTHING;

-- Sample vehicles (update dealer_id to match your actual dealer IDs)
-- First, get dealer IDs:
-- SELECT id, name FROM dealers;

-- Then insert vehicles (replace dealer_id values with actual IDs from above query)
INSERT INTO vehicles (
  dealer_id, make, model, year, trim, price, mileage, color, body_type, 
  fuel_type, transmission, drivetrain, engine, horsepower, features, description, status, featured
) VALUES
(1, 'Toyota', 'Camry', 2024, 'XLE', 32900.00, 0, 'Midnight Black', 'sedan', 
 'gasoline', 'automatic', 'fwd', '2.5L 4-Cylinder', 203, 
 ARRAY['Leather Seats', 'Sunroof', 'Apple CarPlay', 'Blind Spot Monitor', 'Lane Departure Warning'],
 'Beautiful 2024 Toyota Camry XLE with all the latest features. Perfect for daily commuting with excellent fuel economy.',
 'available', true),

(1, 'Honda', 'CR-V', 2024, 'EX-L', 35900.00, 0, 'Platinum White', 'suv',
 'gasoline', 'automatic', 'awd', '1.5L Turbo 4-Cylinder', 190,
 ARRAY['Honda Sensing', 'Power Tailgate', 'Heated Seats', 'Wireless Charging', 'Panoramic Sunroof'],
 'Spacious and reliable 2024 Honda CR-V EX-L. Perfect for families with advanced safety features.',
 'available', true),

(2, 'BMW', '3 Series', 2024, '330i', 45900.00, 0, 'Mineral White', 'sedan',
 'gasoline', 'automatic', 'rwd', '2.0L Turbo 4-Cylinder', 255,
 ARRAY['Premium Package', 'M Sport Package', 'Harman Kardon Audio', 'Adaptive Cruise Control', 'Parking Assistant'],
 'Luxury and performance combined in the 2024 BMW 3 Series. Experience the ultimate driving machine.',
 'available', true),

(2, 'Mercedes-Benz', 'GLE', 2024, '350', 57900.00, 0, 'Obsidian Black', 'suv',
 'gasoline', 'automatic', 'awd', '2.0L Turbo 4-Cylinder', 255,
 ARRAY['MBUX Infotainment', 'Panoramic Sunroof', 'Air Suspension', 'Burmester Sound System', '360 Camera'],
 'Premium luxury SUV with cutting-edge technology and exceptional comfort.',
 'available', true),

(3, 'Ford', 'F-150', 2024, 'XLT', 42900.00, 0, 'Oxford White', 'truck',
 'gasoline', 'automatic', '4wd', '3.5L EcoBoost V6', 400,
 ARRAY['FX4 Off-Road Package', 'Trailer Tow Package', 'SYNC 4', 'Co-Pilot360', 'Bed Liner'],
 'Powerful and capable 2024 Ford F-150. Built tough for work and play.',
 'available', false),

(4, 'Tesla', 'Model 3', 2024, 'Long Range', 48900.00, 0, 'Pearl White', 'sedan',
 'electric', 'automatic', 'awd', 'Dual Motor', 425,
 ARRAY['Autopilot', 'Premium Interior', 'Full Self-Driving Capable', 'Supercharging', 'Glass Roof'],
 'Experience the future of driving with the 2024 Tesla Model 3. Zero emissions, maximum performance.',
 'available', true);

-- Add sample images (placeholder URLs - replace with actual image URLs)
INSERT INTO vehicle_media (vehicle_id, media_type, url, thumbnail_url, alt_text, is_primary, display_order)
SELECT 
  id,
  'image',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200',
  make || ' ' || model || ' - Exterior',
  true,
  1
FROM vehicles
WHERE id IN (SELECT id FROM vehicles ORDER BY id LIMIT 6);

-- Add additional images
INSERT INTO vehicle_media (vehicle_id, media_type, url, thumbnail_url, alt_text, is_primary, display_order)
SELECT 
  id,
  'image',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200',
  make || ' ' || model || ' - Interior',
  false,
  2
FROM vehicles
WHERE id IN (SELECT id FROM vehicles ORDER BY id LIMIT 6);

-- ============================================
-- Verification Queries
-- ============================================

-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check dealers
SELECT id, name, email FROM dealers;

-- Check vehicles
SELECT id, year, make, model, price FROM vehicles;
