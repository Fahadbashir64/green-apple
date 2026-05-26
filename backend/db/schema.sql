CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(40),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer', 'sub_admin')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  price_medium DECIMAL(10, 2),
  price_large DECIMAL(10, 2),
  price_xlarge DECIMAL(10, 2),
  image_url TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  `key` VARCHAR(80) PRIMARY KEY,
  value_numeric DECIMAL(10, 2) NOT NULL
);

INSERT INTO app_settings (`key`, value_numeric)
VALUES ('min_order_price', 0)
ON DUPLICATE KEY UPDATE `key` = `key`;

CREATE TABLE IF NOT EXISTS delivery_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(80) NOT NULL,
  area VARCHAR(120) NOT NULL,
  charge DECIMAL(10, 2) NOT NULL CHECK (charge >= 0),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_delivery_areas_city_area (city, area)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  user_id INT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_email VARCHAR(180),
  customer_address TEXT,
  fulfillment_type VARCHAR(20) NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cod', 'paypal')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivered')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_area_id INT NULL,
  delivery_city VARCHAR(80),
  delivery_area VARCHAR(120),
  paypal_order_id VARCHAR(64) NULL,
  paypal_capture_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_delivery_area FOREIGN KEY (delivery_area_id) REFERENCES delivery_areas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NULL,
  item_name VARCHAR(120) NOT NULL,
  size_label VARCHAR(20),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);
