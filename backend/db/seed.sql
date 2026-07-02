INSERT INTO delivery_areas (city, area, charge, is_active)
VALUES
  ('Local', 'City center', 2.50, 1),
  ('Local', 'Suburbs', 3.50, 1)
ON DUPLICATE KEY UPDATE
  charge = VALUES(charge),
  is_active = VALUES(is_active);

INSERT INTO menu_items (code, name, description, category, price, image_url)
VALUES
  ('pz-margherita', 'Pizza Margherita', 'Klassische Tomate, Mozzarella und Basilikum.', 'pizza', 8.50, NULL),
  ('pz-tonno', 'Pizza Tonno', 'Thunfisch, rote Zwiebeln, Mozzarella und Kräuter.', 'pizza', 10.20, NULL),
  ('doener-durum', 'Döner Dürüm', 'Frisch gegrillter Döner in Fladenbrot gewrapped.', 'doner', 9.20, NULL),
  ('salat-greek', 'Griechischer Salat', 'Gurke, Tomaten, Oliven, Feta und Dressing.', 'salad', 6.90, NULL),
  ('drink-cola', 'Coca Cola 0.33L', 'Erfrischungsgetränk.', 'drinks', 2.50, NULL)
ON DUPLICATE KEY UPDATE code = code;
