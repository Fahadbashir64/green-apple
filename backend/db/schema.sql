CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  phone VARCHAR(40),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'customer';

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  price_medium NUMERIC(10, 2),
  price_large NUMERIC(10, 2),
  price_xlarge NUMERIC(10, 2),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_medium NUMERIC(10, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_large NUMERIC(10, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_xlarge NUMERIC(10, 2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS menu_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(80) PRIMARY KEY,
  value_numeric NUMERIC(10, 2) NOT NULL
);

INSERT INTO app_settings (key, value_numeric)
VALUES ('min_order_price', 0)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(40) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_email VARCHAR(180),
  customer_address TEXT,
  fulfillment_type VARCHAR(20) NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cod', 'paypal')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'preparing', 'delivered')) DEFAULT 'pending',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(120) NOT NULL,
  size_label VARCHAR(20),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_label VARCHAR(20);

CREATE TABLE IF NOT EXISTS delivery_areas (
  id SERIAL PRIMARY KEY,
  city VARCHAR(80) NOT NULL,
  area VARCHAR(120) NOT NULL,
  charge NUMERIC(10, 2) NOT NULL CHECK (charge >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city, area)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_area_id INTEGER REFERENCES delivery_areas(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(80);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_area VARCHAR(120);
