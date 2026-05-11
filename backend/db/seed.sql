INSERT INTO menu_items (code, name, description, category, price, image_url)
VALUES
  ('pz-margherita', 'Pizza Margherita', 'Classic tomato, mozzarella, and basil.', 'pizza', 8.50, '/assets/images/brochure-front.png'),
  ('pz-tonno', 'Pizza Tonno', 'Tuna, red onion, mozzarella, and herbs.', 'pizza', 10.20, '/assets/images/brochure-front.png'),
  ('doener-durum', 'Doener Dueruem', 'Freshly grilled doener wrapped in flatbread.', 'doner', 9.20, '/assets/images/brochure-back.png'),
  ('salat-greek', 'Greek Salad', 'Cucumber, tomato, olives, feta, and dressing.', 'salad', 6.90, '/assets/images/brochure-back.png'),
  ('drink-cola', 'Coca Cola 0.33L', 'Chilled soft drink.', 'drinks', 2.50, '/assets/images/placeholder-food.svg')
ON CONFLICT (code) DO NOTHING;
