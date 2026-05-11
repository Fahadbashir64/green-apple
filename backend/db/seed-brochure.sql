-- Brochure menu import (Green Apple flyer, A3 2F – 09/25)
-- Idempotent: re-runnable, never overwrites existing rows.
-- Numbers in codes match the brochure (e.g. pz-085 = pizza item 85).

-- Categories (in addition to seeded ones)
INSERT INTO menu_categories (name) VALUES
  ('pizza'),
  ('calzone'),
  ('baguette'),
  ('suppe'),
  ('doner'),
  ('lahmacun'),
  ('pide'),
  ('kleinigkeiten'),
  ('spezial'),
  ('nachtisch'),
  ('sauce'),
  ('drinks')
ON CONFLICT (name) DO NOTHING;

-- =============================================================
-- PIZZA  (sizes: small 24cm / medium 28cm / large 40cm)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, price_medium, price_large, image_url, is_active) VALUES
  ('pz-085', 'Margherita',       'Tomaten Sauce und Käse.', 'pizza', 5.00, 9.00, 18.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-086', 'Salami',           'Tomaten Sauce, Käse und Salami.', 'pizza', 6.00, 8.50, 21.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-087', 'Schinken',         'Tomaten Sauce, Käse und Schinken.', 'pizza', 6.00, 8.90, 21.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-088', 'Brokkoli',         'Tomaten Sauce, Käse und Brokkoli.', 'pizza', 6.00, 8.90, 21.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-089', 'Funghi',           'Frische Champignons.', 'pizza', 6.00, 8.90, 21.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-090', 'Romana',           'Schinken & frische Champignons.', 'pizza', 6.50, 9.50, 22.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-091', 'Rustica',          'Salami & frische Champignons.', 'pizza', 6.50, 9.50, 22.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-092', 'Capricciosa',      'Salami & Schinken.', 'pizza', 6.50, 9.50, 22.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-093', 'Hawaii',           'Schinken & Ananas.', 'pizza', 6.50, 9.50, 22.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-094', 'Roma',             'Mais, Oliven & Paprika.', 'pizza', 7.00, 9.90, 23.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-095', 'Aryan Pizza',      'Frische Champignons, Paprika & Oliven.', 'pizza', 7.00, 10.90, 23.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-096', 'Vegetaria',        'Frische Tomate, Paprika, Brokkoli, Pilze & Weichkäse.', 'pizza', 7.00, 10.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-097', 'Siciliana',        'Paprika, Peperoni, Knoblauch & Zwiebeln.', 'pizza', 7.00, 10.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-098', 'Green Apple',      'Paprika, Pilze, Peperoni, türkische Knoblauchwurst & Ei.', 'pizza', 7.00, 11.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-099', 'Sucuk',            'Sucuk, Paprika & Peperoni.', 'pizza', 7.00, 9.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-100', 'Al Capone',        'Schinken, Salami & frische Champignons.', 'pizza', 7.00, 10.50, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-101', 'Fantastica',       'Schinken, Salami, Peperoni, Knoblauch & Thunfisch.', 'pizza', 7.00, 11.00, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-102', 'Quattro Stagioni', '1/4 frische Champignons, 1/4 Schinken, 1/4 Salami & 1/4 Thunfisch.', 'pizza', 7.00, 13.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-103', 'Pizza Döner',      'Döner nach Wahl & Zwiebel.', 'pizza', 6.00, 9.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-104', 'Pizza Tonno',      'Thunfisch & Zwiebel.', 'pizza', 6.00, 9.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-105', 'Mafiosi',          'Döner nach Wahl, Thunfisch, Zwiebel, Peperoni & frische Champignons (scharf).', 'pizza', 7.00, 10.90, 25.00, '/assets/images/pizza-banner.png', TRUE),
  ('pz-106', 'Pizza Amsterdam',  'Hähnchenbrust, Brokkoli, Hollandaise Sauce.', 'pizza', 9.00, 12.90, 28.99, '/assets/images/pizza-banner.png', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- CALZONE  (single 30 cm size)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('cz-110', 'Calzone Green Apple',          'Schinken, frische Champignons, Salami & Peperoni.', 'calzone', 11.50, '/assets/images/placeholder-food.svg', TRUE),
  ('cz-111', 'Calzone Hähnchenfleisch Döner','Hähnchen Döner, Zwiebel & Weichkäse.', 'calzone', 11.50, '/assets/images/placeholder-food.svg', TRUE),
  ('cz-112', 'Calzone Kalbfleisch Döner',    'Kalb Döner, Zwiebeln & Weichkäse.', 'calzone', 11.50, '/assets/images/placeholder-food.svg', TRUE),
  ('cz-113', 'Calzone Vegetaria',            'Frische Champignons, Peperoni, Zwiebeln & Weichkäse.', 'calzone', 11.50, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- BAGUETTE  (mit Käse überbacken & Remoulade Sauce, alle 8,00 €)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('bg-115', 'Baguette Hähnchenfleisch Döner', 'Hähnchen Döner, Zwiebel & Salat.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE),
  ('bg-116', 'Baguette Kalbfleisch Döner',     'Kalb Döner, Zwiebel & Salat.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE),
  ('bg-117', 'Baguette Tonno',                 'Thunfisch, Zwiebel & Salat.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE),
  ('bg-118', 'Baguette Salami',                'Salami & Salat.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE),
  ('bg-119', 'Baguette Schinken',              'Schinken & Salat.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE),
  ('bg-120', 'Baguette Sucuk',                 'Türkische Knoblauchwurst, Zwiebel & Paprika.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE),
  ('bg-121', 'Baguette Vegetaria',             'Weichkäse, Oliven, Tomate & frische Champignons.', 'baguette', 8.00, '/assets/images/brochure-front.png', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- SUPPE
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('su-001', 'Linsensuppe', 'Linsen, Reis, Maggie.', 'suppe', 7.00, '/assets/images/placeholder-food.svg', TRUE),
  ('su-002', 'Pilzsuppe',   'Pilz, Butter, Mehl, Nudeln, Maggie.', 'suppe', 8.00, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- DÖNER  (Hähnchen oder Kalb. Sauce nach Wahl: Cocktail, Joghurt, Scharf oder Tzatziki)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('dn-005', 'Döner Tasche',              'Im Fladenbrot mit Salat & Sauce.', 'doner', 6.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-006', 'Pom Tasche',                'Im Fladenbrot mit Pommes frites & Sauce.', 'doner', 6.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-007', 'Döner Tasche Käse',         'Im Fladenbrot mit Salat, Weichkäse & Tzatziki.', 'doner', 7.00, '/assets/images/brochure-back.png', TRUE),
  ('dn-008', 'Green Apple Tasche',        'Im Fladenbrot mit doppelt Dönerfleisch, Weichkäse, Salat, Cocktail Sauce & Tzatziki.', 'doner', 8.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-009', 'Dürüm',                     'Teigrolle mit Döner, Salat & Tzatziki.', 'doner', 8.00, '/assets/images/brochure-back.png', TRUE),
  ('dn-010', 'Döner Teller gemischt',     'Mit Salat, Reis oder Pommes frites & Sauce.', 'doner', 10.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-011', 'Döner Teller Green Apple',  'Peperoni, Salat, Oliven, Weichkäse, Pommes frites oder Reis, Salat und Tzatziki.', 'doner', 11.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-012', 'Vegetarische Tasche',       'Im Fladenbrot mit Weichkäse, Salat & Tzatziki.', 'doner', 5.90, '/assets/images/brochure-back.png', TRUE),
  ('dn-013', 'Vegetarischer Dürüm',       'Teigrolle mit Weichkäse, Salat & Tzatziki.', 'doner', 6.90, '/assets/images/brochure-back.png', TRUE),
  ('dn-014k', 'Döner Box klein',          'Mit Salat oder Pommes & Sauce.', 'doner', 5.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-014g', 'Döner Box groß',           'Mit Salat oder Pommes & Sauce.', 'doner', 6.50, '/assets/images/brochure-back.png', TRUE),
  ('dn-015', 'Überbackener Döner',        'Döner Fleisch nach Wahl, Schlagsahne, Käse, Pilze, Mais & Zwiebeln.', 'doner', 13.90, '/assets/images/brochure-back.png', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- LAHMACUN
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('lm-018', 'Lahmacun',              'Lahmacun ohne alles.', 'lahmacun', 3.90, '/assets/images/placeholder-food.svg', TRUE),
  ('lm-019', 'Lahmacun Klassik',      'Mit Salat, Weichkäse & Tzatziki.', 'lahmacun', 6.50, '/assets/images/placeholder-food.svg', TRUE),
  ('lm-020', 'Lahmacun Spezial',      'Döner nach Wahl, Salat, Weichkäse & Tzatziki.', 'lahmacun', 8.90, '/assets/images/placeholder-food.svg', TRUE),
  ('lm-021', 'Lahmacun Green Apple',  'Döner nach Wahl, Falafel, Salat, Weichkäse, Tzatziki & Cocktail Sauce.', 'lahmacun', 10.00, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- PIDE
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('pd-025', 'Pide',              'Mit Käse & Ei.', 'pide', 8.50, '/assets/images/placeholder-food.svg', TRUE),
  ('pd-026', 'Pide Bolognese',    'Rinder Hackfleisch, Ei & Käse.', 'pide', 10.50, '/assets/images/placeholder-food.svg', TRUE),
  ('pd-027', 'Pide Spinat',       'Spinat, Brokkoli, Ei & Käse.', 'pide', 10.50, '/assets/images/placeholder-food.svg', TRUE),
  ('pd-028', 'Pide Vegetarisch',  'Weichkäse, Tomate, Oliven & Käse.', 'pide', 10.50, '/assets/images/placeholder-food.svg', TRUE),
  ('pd-029', 'Pide Döner',        'Döner nach Wahl, Ei & Käse.', 'pide', 11.00, '/assets/images/placeholder-food.svg', TRUE),
  ('pd-030', 'Pide Sucuk',        'Käse, türkische Knoblauchwurst, Zwiebeln & Ei.', 'pide', 11.00, '/assets/images/placeholder-food.svg', TRUE),
  ('pd-031', 'Pide Green Apple',  'Sucuk, Peperoni, Paprika, frische Champignons, Ei & Käse.', 'pide', 12.00, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- KLEINIGKEITEN  (snacks & burgers)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('kl-035', 'Green Apple Burger',    'Döner nach Wahl, Eisbergsalat, Tomate, Gurke, Zwiebeln & Sauce.', 'kleinigkeiten', 5.90, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-036', 'Burger',                'Rindfleisch Patty, Eisbergsalat, Tomate, eingelegte Gurke & Ketchup.', 'kleinigkeiten', 6.00, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-037', 'Cheese Burger',         'Rindfleisch Patty, Eisbergsalat, Tomate, Gurke, Ketchup & Käse.', 'kleinigkeiten', 6.50, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-038', 'Chicken Nuggets 6 Stk', '6 Stück Chicken Nuggets.', 'kleinigkeiten', 6.50, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-039', 'Chicken Nuggets 10 Stk','10 Stück Chicken Nuggets.', 'kleinigkeiten', 8.00, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-040k', 'Pommes Frites klein',  'Kleine Portion Pommes Frites.', 'kleinigkeiten', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-040g', 'Pommes Frites groß',   'Große Portion Pommes Frites.', 'kleinigkeiten', 3.90, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-041', 'Chicken Tasche',        'Chicken Nuggets, Salat und Sauce.', 'kleinigkeiten', 6.50, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-042', 'Chicken Dürüm',         'Chicken Nuggets, Salat und Sauce.', 'kleinigkeiten', 8.00, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-043', 'Chicken Tasche Pommes', 'Chicken Nuggets (6 St.), Pommes frites, Salat & Sauce.', 'kleinigkeiten', 8.50, '/assets/images/placeholder-food.svg', TRUE),
  ('kl-044', 'Currywurst Pommes',     'Currywurst mit Pommes frites.', 'kleinigkeiten', 8.50, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- SPEZIAL UND VEGETARISCH
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('sp-045', 'Falafel Dürüm',     'Mit gemischtem Salat, Petersilie & Sauce.', 'spezial', 7.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-046', 'Falafel Tasche',    'Mit gemischtem Salat, Petersilie & Sauce.', 'spezial', 6.50, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-047', 'Shawarma Rolle',    'Geflügelfleisch, eingelegte Gurke, Knoblauch & Sauce.', 'spezial', 11.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-048', 'Falafel Teller',    '5 Stück Falafel, Pommes frites, Salat & Sauce.', 'spezial', 10.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-049', 'Shawarma Teller',   'Geflügelfleisch, eingelegte Gurke, Knoblauch & Sauce.', 'spezial', 14.50, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-050', 'Hallomie Rolle',    'Hallomie Käse Rolle.', 'spezial', 8.50, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-051', 'Hallomie Chips',    'Hallomie Käse mit Chips.', 'spezial', 6.90, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-052', 'Hallomie Burger',   'Hallomie Käse Burger.', 'spezial', 6.90, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-053', 'Sucuk Rolle',       'Sucuk Rolle.', 'spezial', 8.50, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-054', 'Sucuk Tasche',      'Sucuk Tasche.', 'spezial', 6.90, '/assets/images/placeholder-food.svg', TRUE),
  ('sp-055', 'Sucuk Burger',      'Sucuk Burger.', 'spezial', 6.90, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- NACHTISCH
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('nt-125', 'Baklava',         'Süßes Gebäck mit Nüssen und Sirup.', 'nachtisch', 5.00, '/assets/images/placeholder-food.svg', TRUE),
  ('nt-126', 'Frühlingsrollen', '7 Stück mit Cocktailsauce.', 'nachtisch', 5.00, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- SAUCE  (kleiner Becher 3,00 € / großer Becher 5,00 €)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('sc-donner',   'Dönersauce',       'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sc-schafs',   'Schafskäse Sauce', 'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sc-cocktail', 'Cocktail Sauce',   'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sc-zaziki',   'Zaziki',           'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sc-krauter',  'Kräuter Sauce',    'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sc-curry',    'Curry Sauce',      'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE),
  ('sc-joghurt',  'Joghurt Sauce',    'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- GETRÄNKE (drinks)  -- Hauptpreis = Standardgröße; 1L-Variante im Beschreibungstext
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('dr-125', 'Coca Cola',        '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-126', 'Coca Cola Zero',   '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-127', 'Fanta',            '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-128', 'Fanta Exotic',     '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-129', 'Mezzo Mix',        '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-130', 'Sprite',           '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-131', 'Uludag',           '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 2.25, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-132', 'Mineralwasser',    '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 1.50, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-133', 'Stilles Wasser',   '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 1.50, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-134', 'Ayran',            '0,2 L. Inkl. Pfand 0,25 €.', 'drinks', 1.50, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-135', 'Red Bull',         '0,25 L. Inkl. Pfand 0,25 €.', 'drinks', 2.50, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-136', 'Eistee',           'Eistee.', 'drinks', 2.50, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-137', 'Multisaft',        'Multisaft.', 'drinks', 2.50, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-138', 'Capri Sonne',      'Capri Sonne.', 'drinks', 0.90, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-139', 'Bier 0,33 L',      'Härke, Krombacher, Becks oder Heineken (0,33 L).', 'drinks', 2.00, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-140', 'Bier 0,5 L',       'Härke, Krombacher, Becks oder Heineken (0,5 L).', 'drinks', 2.80, '/assets/images/placeholder-food.svg', TRUE),
  ('dr-141', 'Fritz Cola',       'Cola / Light / Honigmelone.', 'drinks', 2.80, '/assets/images/placeholder-food.svg', TRUE)
ON CONFLICT (code) DO NOTHING;
