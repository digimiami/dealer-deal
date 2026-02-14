-- Sample vehicle data for testing
-- Note: Update dealer_id to match your actual dealers

-- First, get a dealer ID (assuming dealer with id=1 exists)
-- Insert sample vehicles

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
