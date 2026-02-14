-- Supabase Schema Updates
-- Run this after the main schema to add Supabase Auth integration

-- Add user_id columns to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE dealer_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_accounts_user_id ON dealer_accounts(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drive_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for dealer_accounts table
CREATE POLICY "Dealers can read own data" ON dealer_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Dealers can update own data" ON dealer_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for leads table
CREATE POLICY "Users can read own leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.email = leads.email
    )
  );

CREATE POLICY "Dealers can read assigned leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dealer_accounts da
      JOIN dealers d ON da.dealer_id = d.id
      WHERE da.user_id = auth.uid()
      AND d.id = leads.dealer_id
    )
  );

CREATE POLICY "Public can create leads" ON leads
  FOR INSERT WITH CHECK (true);

-- RLS Policies for vehicles table
CREATE POLICY "Public can read available vehicles" ON vehicles
  FOR SELECT USING (status = 'available');

CREATE POLICY "Dealers can manage own vehicles" ON vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dealer_accounts da
      WHERE da.user_id = auth.uid()
      AND da.dealer_id = vehicles.dealer_id
    )
  );

-- RLS Policies for appointments
CREATE POLICY "Dealers can read own appointments" ON test_drive_appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dealer_accounts da
      WHERE da.user_id = auth.uid()
      AND da.dealer_id = test_drive_appointments.dealer_id
    )
  );

CREATE POLICY "Users can read own appointments" ON test_drive_appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.email = test_drive_appointments.customer_email
    )
  );

CREATE POLICY "Public can create appointments" ON test_drive_appointments
  FOR INSERT WITH CHECK (true);
