-- Seed data for testing and development
-- Sample dealers

INSERT INTO dealers (name, email, phone, territory, specialties, capacity, priority) VALUES
('John Smith Auto', 'john@carforsales.net', '+1234567890', 'North Region', ARRAY['sedan', 'suv'], 15, 8),
('Premium Motors', 'premium@carforsales.net', '+1234567891', 'South Region', ARRAY['luxury', 'suv'], 10, 9),
('Budget Cars Inc', 'budget@carforsales.net', '+1234567892', 'East Region', ARRAY['sedan', 'truck'], 20, 6),
('Electric Vehicle Center', 'ev@carforsales.net', '+1234567893', 'West Region', ARRAY['electric', 'luxury'], 12, 7)
ON CONFLICT (email) DO NOTHING;
