INSERT INTO categories (name) VALUES
('Keyboards'),
('Switches'),
('Keycaps'),
('PCB'),
('Dampeners'),
('Lubricants'),
('Plates'),
('Desk Mats'),
('Stabilizers'),
('Cables'),
('Tools & Accessories')
ON CONFLICT (name) DO NOTHING;
