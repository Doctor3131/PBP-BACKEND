INSERT INTO users(name, email, password_hash, role) VALUES
  ('Admin KeyStore', 'admin@keystore.com', '$2b$10$wT0lY9q8N1gYQ9c.Q0nU/OPB.WlH.d8p3R2M6/O0F5xW9S7c2D3p4', 'admin'), --hash for 'password123'(example)
    ('Agus Keyboard', 'agus@example.com', '$2b$10$wT0lY9q8N1gYQ9c.Q0nU/OPB.WlH.d8p3R2M6/O0F5xW9S7c2D3p4', 'customer'),
    ('Budi Enthusiast', 'budi@example.com', '$2b$10$wT0lY9q8N1gYQ9c.Q0nU/OPB.WlH.d8p3R2M6/O0F5xW9S7c2D3p4', 'customer'),
    ('Citra Builder', 'citra@example.com', '$2b$10$wT0lY9q8N1gYQ9c.Q0nU/OPB.WlH.d8p3R2M6/O0F5xW9S7c2D3p4', 'customer'),
    ('Dani Modder', 'dani@example.com', '$2b$10$wT0lY9q8N1gYQ9c.Q0nU/OPB.WlH.d8p3R2M6/O0F5xW9S7c2D3p4', 'customer')
ON CONFLICT(email) DO NOTHING;
