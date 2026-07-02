-- Brochure menu import (Green Apple flyer, A3 2F – 09/25)
-- Idempotent: re-runnable, never overwrites existing rows.
-- Numbers in codes match the brochure (e.g. pz-085 = pizza item 85).

-- Categories (in addition to seeded ones)
DELETE FROM menu_items
WHERE code IN (
  'pz-085',
  'pz-086',
  'pz-087',
  'pz-088',
  'pz-089',
  'pz-090',
  'pz-091',
  'pz-092',
  'pz-093',
  'pz-094',
  'pz-095',
  'pz-096',
  'pz-097',
  'pz-098',
  'pz-099',
  'pz-100',
  'pz-101',
  'pz-102',
  'pz-103',
  'pz-104',
  'pz-105',
  'pz-106',
  'cz-110',
  'cz-111',
  'cz-112',
  'cz-113',
  'bg-115',
  'bg-116',
  'bg-117',
  'bg-118',
  'bg-119',
  'bg-120',
  'bg-121',
  'su-001',
  'su-002',
  'dn-005',
  'dn-006',
  'dn-007',
  'dn-008',
  'dn-009',
  'dn-010',
  'dn-011',
  'dn-012',
  'dn-013',
  'dn-014k',
  'dn-014g',
  'dn-015',
  'lm-018',
  'lm-019',
  'lm-020',
  'lm-021',
  'pd-025',
  'pd-026',
  'pd-027',
  'pd-028',
  'pd-029',
  'pd-030',
  'pd-031',
  'kl-035',
  'kl-036',
  'kl-037',
  'kl-038',
  'kl-039',
  'kl-040k',
  'kl-040g',
  'kl-041',
  'kl-042',
  'kl-043',
  'kl-044',
  'sp-045',
  'sp-046',
  'sp-047',
  'sp-048',
  'sp-049',
  'sp-050',
  'sp-051',
  'sp-052',
  'sp-053',
  'sp-054',
  'sp-055',
  'sl-060',
  'sl-061',
  'sl-062',
  'sl-063',
  'sl-064',
  'sl-065',
  'sl-066',
  'nt-125',
  'nt-126',
  'sc-donner',
  'sc-schafs',
  'sc-cocktail',
  'sc-zaziki',
  'sc-krauter',
  'sc-curry',
  'sc-joghurt',
  'dr-125',
  'dr-126',
  'dr-127',
  'dr-128',
  'dr-129',
  'dr-130',
  'dr-131',
  'dr-132',
  'dr-133',
  'dr-134',
  'dr-135',
  'dr-136',
  'dr-137',
  'dr-138',
  'dr-139',
  'dr-140',
  'dr-141'
);

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
ON DUPLICATE KEY UPDATE name = name;

-- =============================================================
-- PIZZA  (sizes: small 24cm / medium 28cm / large 40cm)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, price_medium, price_large, image_url, is_active) VALUES
  ('pz-085', 'Margherita',       'Tomatensauce und Käse.', 'pizza', 5.00, 9.00, 18.00, NULL, TRUE),
  ('pz-086', 'Salami',           'Tomatensauce, Käse und Salami.', 'pizza', 6.00, 8.50, 21.00, NULL, TRUE),
  ('pz-087', 'Schinken',         'Tomatensauce, Käse und Schinken.', 'pizza', 6.00, 8.90, 21.00, NULL, TRUE),
  ('pz-088', 'Brokkoli',         'Tomatensauce, Käse und Brokkoli.', 'pizza', 6.00, 8.90, 21.00, NULL, TRUE),
  ('pz-089', 'Funghi',           'Frische Champignons.', 'pizza', 6.00, 8.90, 21.00, NULL, TRUE),
  ('pz-090', 'Romana',           'Schinken und frische Champignons.', 'pizza', 6.50, 9.50, 22.00, NULL, TRUE),
  ('pz-091', 'Rustica',          'Salami und frische Champignons.', 'pizza', 6.50, 9.50, 22.00, NULL, TRUE),
  ('pz-092', 'Capricciosa',      'Salami und Schinken.', 'pizza', 6.50, 9.50, 22.00, NULL, TRUE),
  ('pz-093', 'Hawaii',           'Schinken und Ananas.', 'pizza', 6.50, 9.50, 22.00, NULL, TRUE),
  ('pz-094', 'Roma',             'Mais, Oliven und Paprika.', 'pizza', 7.00, 9.90, 23.00, NULL, TRUE),
  ('pz-095', 'Aryan Pizza',      'Frische Champignons, Paprika und Oliven.', 'pizza', 7.00, 10.90, 23.00, NULL, TRUE),
  ('pz-096', 'Vegetarisch',      'Frische Tomaten, Paprika, Brokkoli, Pilze und Weichkäse.', 'pizza', 7.00, 10.90, 25.00, NULL, TRUE),
  ('pz-097', 'Siciliana',        'Paprika, Peperoni, Knoblauch und Zwiebeln.', 'pizza', 7.00, 10.90, 25.00, NULL, TRUE),
  ('pz-098', 'Green Apple',      'Paprika, Pilze, Peperoni, türkische Knoblauchwurst und Ei.', 'pizza', 7.00, 11.90, 25.00, NULL, TRUE),
  ('pz-099', 'Sucuk',            'Sucuk, Paprika und Peperoni.', 'pizza', 7.00, 9.90, 25.00, NULL, TRUE),
  ('pz-100', 'Al Capone',        'Schinken, Salami und frische Champignons.', 'pizza', 7.00, 10.50, 25.00, NULL, TRUE),
  ('pz-101', 'Fantastica',       'Schinken, Salami, Peperoni, Knoblauch und Thunfisch.', 'pizza', 7.00, 11.00, 25.00, NULL, TRUE),
  ('pz-102', 'Quattro Stagioni', '1/4 frische Champignons, 1/4 Schinken, 1/4 Salami und 1/4 Thunfisch.', 'pizza', 7.00, 13.90, 25.00, NULL, TRUE),
  ('pz-103', 'Pizza Döner',      'Döner nach Wahl und Zwiebel.', 'pizza', 6.00, 9.90, 25.00, NULL, TRUE),
  ('pz-104', 'Pizza Tonno',      'Thunfisch und Zwiebel.', 'pizza', 6.00, 9.90, 25.00, NULL, TRUE),
  ('pz-105', 'Mafiosi',          'Döner nach Wahl, Thunfisch, Zwiebel, Peperoni und frische Champignons (scharf).', 'pizza', 7.00, 10.90, 25.00, NULL, TRUE),
  ('pz-106', 'Pizza Amsterdam',  'Hähnchenbrust, Brokkoli, Hollandaise Sauce.', 'pizza', 9.00, 12.90, 28.99, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- CALZONE  (single 30 cm size)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('cz-110', 'Calzone Green Apple',          'Schinken, frische Champignons, Salami und Peperoni.', 'calzone', 11.50, NULL, TRUE),
  ('cz-111', 'Calzone Hähnchenfleisch Döner','Hähnchen Döner, Zwiebel und Weichkäse.', 'calzone', 11.50, NULL, TRUE),
  ('cz-112', 'Calzone Kalbfleisch Döner',    'Kalb Döner, Zwiebeln und Weichkäse.', 'calzone', 11.50, NULL, TRUE),
  ('cz-113', 'Calzone Vegetarisch',          'Frische Champignons, Peperoni, Zwiebeln und Weichkäse.', 'calzone', 11.50, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- BAGUETTE  (mit Käse überbacken & Remoulade Sauce, alle 8,00 €)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('bg-115', 'Baguette Hähnchenfleisch Döner', 'Hähnchen Döner, Zwiebel und Salat.', 'baguette', 8.00, NULL, TRUE),
  ('bg-116', 'Baguette Kalbfleisch Döner',     'Kalb Döner, Zwiebel und Salat.', 'baguette', 8.00, NULL, TRUE),
  ('bg-117', 'Baguette Tonno',                 'Thunfisch, Zwiebel und Salat.', 'baguette', 8.00, NULL, TRUE),
  ('bg-118', 'Baguette Salami',                'Salami und Salat.', 'baguette', 8.00, NULL, TRUE),
  ('bg-119', 'Baguette Schinken',              'Schinken und Salat.', 'baguette', 8.00, NULL, TRUE),
  ('bg-120', 'Baguette Sucuk',                 'Türkische Knoblauchwurst, Zwiebel und Paprika.', 'baguette', 8.00, NULL, TRUE),
  ('bg-121', 'Baguette Vegetarisch',           'Weichkäse, Oliven, Tomaten und frische Champignons.', 'baguette', 8.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- SUPPE
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('su-001', 'Linsensuppe', 'Linsen, Reis, Maggi.', 'suppe', 7.00, NULL, TRUE),
  ('su-002', 'Pilzsuppe',   'Pilz, Butter, Mehl, Nudeln, Maggi.', 'suppe', 8.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- DÖNER  (Hähnchen oder Kalb. Sauce nach Wahl: Cocktail, Joghurt, Scharf oder Tzatziki)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('dn-005', 'Döner Tasche',              'Im Fladenbrot mit Salat und Sauce.', 'doner', 6.50, NULL, TRUE),
  ('dn-006', 'Pom Tasche',                'Im Fladenbrot mit Pommes Frites und Sauce.', 'doner', 6.50, NULL, TRUE),
  ('dn-007', 'Döner Tasche Käse',         'Im Fladenbrot mit Salat, Weichkäse und Tzatziki.', 'doner', 7.00, NULL, TRUE),
  ('dn-008', 'Green Apple Tasche',        'Im Fladenbrot mit doppelt Dönerfleisch, Weichkäse, Salat, Cocktail Sauce und Tzatziki.', 'doner', 8.50, NULL, TRUE),
  ('dn-009', 'Dürüm',                     'Teigrolle mit Döner, Salat und Tzatziki.', 'doner', 8.00, NULL, TRUE),
  ('dn-010', 'Döner Teller gemischt',     'Mit Salat, Reis oder Pommes Frites und Sauce.', 'doner', 10.50, NULL, TRUE),
  ('dn-011', 'Döner Teller Green Apple',  'Peperoni, Salat, Oliven, Weichkäse, Pommes Frites oder Reis, Salat und Tzatziki.', 'doner', 11.50, NULL, TRUE),
  ('dn-012', 'Vegetarische Tasche',       'Im Fladenbrot mit Weichkäse, Salat und Tzatziki.', 'doner', 5.90, NULL, TRUE),
  ('dn-013', 'Vegetarischer Dürüm',       'Teigrolle mit Weichkäse, Salat und Tzatziki.', 'doner', 6.90, NULL, TRUE),
  ('dn-014k', 'Döner Box klein',          'Mit Salat oder Pommes und Sauce nach Wahl.', 'doner', 5.50, NULL, TRUE),
  ('dn-014g', 'Döner Box groß',           'Mit Salat oder Pommes und Sauce nach Wahl.', 'doner', 6.50, NULL, TRUE),
  ('dn-015', 'Überbackener Döner',        'Dönerfleisch nach Wahl, Schlagsahne, Käse, Pilze, Mais und Zwiebeln.', 'doner', 13.90, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- LAHMACUN
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('lm-018', 'Lahmacun',              'Klassischer Lahmacun.', 'lahmacun', 3.90, NULL, TRUE),
  ('lm-019', 'Lahmacun Klassik',      'Mit Salat, Weichkäse und Tzatziki.', 'lahmacun', 6.50, NULL, TRUE),
  ('lm-020', 'Lahmacun Spezial',      'Döner nach Wahl, Salat, Weichkäse und Tzatziki.', 'lahmacun', 8.90, NULL, TRUE),
  ('lm-021', 'Lahmacun Green Apple',  'Döner nach Wahl, Falafel, Salat, Weichkäse, Tzatziki und Cocktail Sauce.', 'lahmacun', 10.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- PIDE
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('pd-025', 'Pide',              'Mit Käse und Ei.', 'pide', 8.50, NULL, TRUE),
  ('pd-026', 'Pide Bolognese',    'Rinderhackfleisch, Ei und Käse.', 'pide', 10.50, NULL, TRUE),
  ('pd-027', 'Pide Spinat',       'Spinat, Brokkoli, Ei und Käse.', 'pide', 10.50, NULL, TRUE),
  ('pd-028', 'Pide Vegetarisch',  'Weichkäse, Tomaten, Oliven und Käse.', 'pide', 10.50, NULL, TRUE),
  ('pd-029', 'Pide Döner',        'Döner nach Wahl, Ei und Käse.', 'pide', 11.00, NULL, TRUE),
  ('pd-030', 'Pide Sucuk',        'Käse, türkische Knoblauchwurst, Zwiebeln und Ei.', 'pide', 11.00, NULL, TRUE),
  ('pd-031', 'Pide Green Apple',  'Sucuk, Peperoni, Paprika, frische Champignons, Ei und Käse.', 'pide', 12.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- KLEINIGKEITEN  (snacks & burgers)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('kl-035', 'Green Apple Burger',    'Mit Hähnchen- oder Kalbfleisch nach Wahl, Salat, Tomaten, Gurken, Zwiebeln und Sauce.', 'kleinigkeiten', 5.90, NULL, TRUE),
  ('kl-036', 'Burger',                'Rindfleisch Patty, Eisbergsalat, Tomaten, eingelegte Gurke und Ketchup.', 'kleinigkeiten', 6.00, NULL, TRUE),
  ('kl-037', 'Cheeseburger',         'Rindfleisch Patty, Eisbergsalat, Tomaten, Gurken, Ketchup und Käse.', 'kleinigkeiten', 6.50, NULL, TRUE),
  ('kl-038', 'Chicken Nuggets 6 Stk', '6 knusprige Chicken Nuggets.', 'kleinigkeiten', 6.50, NULL, TRUE),
  ('kl-039', 'Chicken Nuggets 10 Stk','10 knusprige Chicken Nuggets.', 'kleinigkeiten', 8.00, NULL, TRUE),
  ('kl-040k', 'Kleine Pommes',        'Kleine Portion Pommes.', 'kleinigkeiten', 3.00, NULL, TRUE),
  ('kl-040g', 'Große Pommes',         'Große Portion Pommes.', 'kleinigkeiten', 3.90, NULL, TRUE),
  ('kl-041', 'Hähnchen-Tasche',       'Chicken Nuggets, Salat und Sauce.', 'kleinigkeiten', 6.50, NULL, TRUE),
  ('kl-042', 'Hähnchen-Dürüm',        'Chicken Nuggets, Salat und Sauce.', 'kleinigkeiten', 8.00, NULL, TRUE),
  ('kl-043', 'Hähnchen-Tasche Pommes', 'Chicken Nuggets (6 St.), Pommes Frites, Salat und Sauce.', 'kleinigkeiten', 8.50, NULL, TRUE),
  ('kl-044', 'Currywurst Pommes',     'Currywurst mit Pommes Frites.', 'kleinigkeiten', 8.50, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- SPEZIAL UND VEGETARISCH
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('sp-045', 'Falafel Dürüm',     'Mit gemischtem Salat, Petersilie und Sauce.', 'spezial', 7.00, NULL, TRUE),
  ('sp-046', 'Falafel Tasche',    'Mit gemischtem Salat, Petersilie und Sauce.', 'spezial', 6.50, NULL, TRUE),
  ('sp-047', 'Shawarma Rolle',    'Geflügelfleisch, eingelegte Gurke, Knoblauch und Sauce.', 'spezial', 11.00, NULL, TRUE),
  ('sp-048', 'Falafel Teller',    '5 Stück Falafel, Pommes Frites, Salat und Sauce.', 'spezial', 10.00, NULL, TRUE),
  ('sp-049', 'Shawarma Teller',   'Geflügelfleisch, eingelegte Gurke, Knoblauch und Sauce.', 'spezial', 14.50, NULL, TRUE),
  ('sp-050', 'Halloumi Rolle',    'Halloumi Käse Rolle.', 'spezial', 8.50, NULL, TRUE),
  ('sp-051', 'Halloumi Chips',    'Halloumi Käse mit Chips.', 'spezial', 6.90, NULL, TRUE),
  ('sp-052', 'Halloumi Burger',   'Halloumi Käse Burger.', 'spezial', 6.90, NULL, TRUE),
  ('sp-053', 'Sucuk Rolle',       'Sucuk Rolle.', 'spezial', 8.50, NULL, TRUE),
  ('sp-054', 'Sucuk Tasche',      'Sucuk Tasche.', 'spezial', 6.90, NULL, TRUE),
  ('sp-055', 'Sucuk Burger',      'Sucuk Burger.', 'spezial', 6.90, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- SALAT
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('sl-060', 'Gemischter Salat', 'Krautsalat, Rotkraut, Gurke, Zwiebel und Mais.', 'salad', 9.20, NULL, TRUE),
  ('sl-061', 'Italienischer Salat', 'Thunfisch, Schinken, Käse, Gurke, Oliven, Zwiebel und Mais.', 'salad', 11.50, NULL, TRUE),
  ('sl-062', 'Thunfisch Salat', 'Krautsalat, Thunfisch, Gurke, Mais und Zwiebel.', 'salad', 10.20, NULL, TRUE),
  ('sl-063', 'Hawaii Salat', 'Schinken, Käse, Ananas.', 'salad', 9.50, NULL, TRUE),
  ('sl-064', 'Bauern Salat', 'Krautsalat, Weichkäse, Gurke, Paprika und Mais.', 'salad', 10.50, NULL, TRUE),
  ('sl-065', 'Green Apple Salat', 'Weichkäse, Krautsalat, Rotkraut, eingelegte Gurke, Zwiebeln und Mais.', 'salad', 11.90, NULL, TRUE),
  ('sl-066', 'Halloumi Salat', 'Eisberg, Tomaten, Gurken, gebratener Käse, Weichkäse, Mais, Zwiebeln, Oliven, Peperoni.', 'salad', 11.50, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- NACHTISCH
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('nt-125', 'Baklava',         'Süßes Gebäck mit Nüssen und Sirup.', 'nachtisch', 5.00, NULL, TRUE),
  ('nt-126', 'Frühlingsrollen', '7 Stück mit Cocktailsauce.', 'nachtisch', 5.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- SAUCE  (kleiner Becher 3,00 € / großer Becher 5,00 €)
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('sc-donner',   'Dönersauce',       'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE),
  ('sc-schafs',   'Schafskäsesauce',  'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE),
  ('sc-cocktail', 'Cocktailsauce',    'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE),
  ('sc-zaziki',   'Tzatziki',         'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE),
  ('sc-krauter',  'Kräutersauce',     'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE),
  ('sc-curry',    'Currysauce',       'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE),
  ('sc-joghurt',  'Joghurtsauce',     'Klein 3,00 € · Groß 5,00 €.', 'sauce', 3.00, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;

-- =============================================================
-- GETRÄNKE (drinks)  -- Hauptpreis = Standardgröße; 1L-Variante im Beschreibungstext
-- =============================================================
INSERT INTO menu_items (code, name, description, category, price, image_url, is_active) VALUES
  ('dr-125', 'Coca Cola',        'Erfrischungsgetränk.', 'drinks', 2.25, NULL, TRUE),
  ('dr-126', 'Coca Cola Zero',   'Erfrischungsgetränk.', 'drinks', 2.25, NULL, TRUE),
  ('dr-127', 'Fanta',            '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, NULL, TRUE),
  ('dr-128', 'Fanta Exotic',     '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 2.25, NULL, TRUE),
  ('dr-129', 'Mezzo Mix',        '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, NULL, TRUE),
  ('dr-130', 'Sprite',           '0,33 L. 1 L Variante 3,50 €. Inkl. Pfand 0,25 €.', 'drinks', 2.25, NULL, TRUE),
  ('dr-131', 'Uludağ',           '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 2.25, NULL, TRUE),
  ('dr-132', 'Mineralwasser',    '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 1.50, NULL, TRUE),
  ('dr-133', 'Stilles Wasser',   '0,33 L. Inkl. Pfand 0,25 €.', 'drinks', 1.50, NULL, TRUE),
  ('dr-134', 'Ayran',            '0,2 L. Inkl. Pfand 0,25 €.', 'drinks', 1.50, NULL, TRUE),
  ('dr-135', 'Red Bull',         '0,25 L. Inkl. Pfand 0,25 €.', 'drinks', 2.50, NULL, TRUE),
  ('dr-136', 'Eistee',           'Eistee.', 'drinks', 2.50, NULL, TRUE),
  ('dr-137', 'Multisaft',        'Multisaft.', 'drinks', 2.50, NULL, TRUE),
  ('dr-138', 'Capri Sonne',      'Capri Sonne.', 'drinks', 0.90, NULL, TRUE),
  ('dr-139', 'Bier 0,33 L',      'Härke, Krombacher, Beck''s oder Heineken (0,33 L).', 'drinks', 2.00, NULL, TRUE),
  ('dr-140', 'Bier 0,5 L',       'Härke, Krombacher, Beck''s oder Heineken (0,5 L).', 'drinks', 2.80, NULL, TRUE),
  ('dr-141', 'Fritz Cola',       'Varianten: Kola, Kola Zuckerfrei, Honigmelone.', 'drinks', 2.80, NULL, TRUE)
ON DUPLICATE KEY UPDATE code = code;
