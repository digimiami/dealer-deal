-- Migration: 004_zipcode_and_external_dealers
-- Description: Add zipcode support and external dealer integration

-- Add zipcode to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zipcode VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS radius INTEGER DEFAULT 25; -- Search radius in miles

-- External dealers table (dealers found via web search)
CREATE TABLE IF NOT EXISTS external_dealers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website_url TEXT NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zipcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  verified BOOLEAN DEFAULT false,
  last_scraped TIMESTAMP,
  scrape_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  scrape_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External vehicles table (vehicles scraped from dealer websites)
CREATE TABLE IF NOT EXISTS external_vehicles (
  id SERIAL PRIMARY KEY,
  external_dealer_id INTEGER NOT NULL REFERENCES external_dealers(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER,
  price DECIMAL(12, 2),
  mileage INTEGER,
  vin VARCHAR(50),
  description TEXT,
  images TEXT[], -- Array of image URLs
  videos TEXT[], -- Array of video URLs
  features TEXT[],
  status VARCHAR(50) DEFAULT 'available',
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External vehicle media
CREATE TABLE IF NOT EXISTS external_vehicle_media (
  id SERIAL PRIMARY KEY,
  external_vehicle_id INTEGER NOT NULL REFERENCES external_vehicles(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL, -- 'image', 'video'
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External appointments (appointments with external dealers)
CREATE TABLE IF NOT EXISTS external_appointments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  external_dealer_id INTEGER NOT NULL REFERENCES external_dealers(id),
  external_vehicle_id INTEGER REFERENCES external_vehicles(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_zipcode VARCHAR(20),
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  appointment_type VARCHAR(50) DEFAULT 'test_drive', -- 'test_drive', 'viewing', 'consultation'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  dealer_confirmation_url TEXT, -- URL to dealer's confirmation page
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_zipcode ON leads(zipcode);
CREATE INDEX IF NOT EXISTS idx_external_dealers_zipcode ON external_dealers(zipcode);
CREATE INDEX IF NOT EXISTS idx_external_dealers_location ON external_dealers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_external_vehicles_dealer_id ON external_vehicles(external_dealer_id);
CREATE INDEX IF NOT EXISTS idx_external_vehicles_status ON external_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_external_appointments_lead_id ON external_appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_external_appointments_dealer_id ON external_appointments(external_dealer_id);

-- Triggers
CREATE TRIGGER update_external_dealers_updated_at BEFORE UPDATE ON external_dealers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_vehicles_updated_at BEFORE UPDATE ON external_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_appointments_updated_at BEFORE UPDATE ON external_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
