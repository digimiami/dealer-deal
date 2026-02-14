-- Auto Dealer Lead Generation System Database Schema
-- PostgreSQL Database

-- Dealers table
CREATE TABLE IF NOT EXISTS dealers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  territory VARCHAR(100),
  specialties TEXT[], -- ['sedan', 'suv', 'luxury', 'truck', 'electric']
  active BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 10, -- Max leads per day
  current_load INTEGER DEFAULT 0, -- Current leads in pipeline
  priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
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
  preferred_contact VARCHAR(20) DEFAULT 'email', -- 'email', 'phone', 'sms'
  source VARCHAR(50) DEFAULT 'website', -- 'website', 'ad', 'referral', 'chat'
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'qualified', 'contacted', 'scheduled', 'sold', 'lost'
  score INTEGER DEFAULT 0, -- Lead score 0-100
  notes TEXT,
  dealer_id INTEGER REFERENCES dealers(id),
  openclaw_session_id VARCHAR(255), -- Track OpenClaw session
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead assignments table (track assignment history)
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  dealer_id INTEGER NOT NULL REFERENCES dealers(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by VARCHAR(100) DEFAULT 'system', -- 'system', 'admin', 'openclaw'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed'
  notes TEXT
);

-- Lead interactions table (track all communications)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'phone', 'chat', 'whatsapp'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
  channel VARCHAR(50), -- 'openclaw', 'website', 'manual'
  content TEXT,
  metadata JSONB, -- Store additional data like message IDs, call duration, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead follow-ups table
CREATE TABLE IF NOT EXISTS lead_followups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  followup_type VARCHAR(50), -- 'call', 'email', 'sms', 'visit'
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'missed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
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
