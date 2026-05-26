INSERT INTO delivery_areas (city, area, charge, is_active)
VALUES
  ('Local', 'City center', 2.50, 1),
  ('Local', 'Suburbs', 3.50, 1)
ON DUPLICATE KEY UPDATE
  charge = VALUES(charge),
  is_active = VALUES(is_active);

INSERT INTO menu_items (code, name, description, category, price, image_url)
VALUES
  ('pz-margherita', 'Pizza Margherita', 'Classic tomato, mozzarella, and basil.', 'pizza', 8.50, NULL),
  ('pz-tonno', 'Pizza Tonno', 'Tuna, red onion, mozzarella, and herbs.', 'pizza', 10.20, NULL),
  ('doener-durum', 'Doener Dueruem', 'Freshly grilled doener wrapped in flatbread.', 'doner', 9.20, NULL),
  ('salat-greek', 'Greek Salad', 'Cucumber, tomato, olives, feta, and dressing.', 'salad', 6.90, NULL),
  ('drink-cola', 'Coca Cola 0.33L', 'Chilled soft drink.', 'drinks', 2.50, NULL)
ON DUPLICATE KEY UPDATE code = code;
