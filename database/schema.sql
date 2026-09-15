-- =====================================================================
--  OBD Lighting — database schema
--  MySQL 8.0 / MariaDB 10.4+
--
--  Run once:  mysql -u root -p < database/schema.sql
--  Then seed: mysql -u root -p obd_lighting < database/seed.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS obd_lighting
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE obd_lighting;

-- Drop child tables before their parents so the file can be re-run.
-- enquiries points at products AND categories, so it has to go first;
-- the FOREIGN_KEY_CHECKS guard also lets a half-finished run be cleaned up.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS enquiries;
DROP TABLE IF EXISTS product_specs;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS settings;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Categories.  Every user-visible string exists twice: English and
-- Bangla, because the whole site has a language toggle.
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          VARCHAR(40)  NOT NULL PRIMARY KEY,   -- 'street', 'panel', …
  name        VARCHAR(120) NOT NULL,
  name_bn     VARCHAR(160) NOT NULL,
  blurb       VARCHAR(200) NULL,
  blurb_bn    VARCHAR(240) NULL,
  icon        VARCHAR(40)  NOT NULL,               -- which drawn fixture to show
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subcategories (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  category_id  VARCHAR(40)  NOT NULL,
  name         VARCHAR(160) NOT NULL,
  name_bn      VARCHAR(200) NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_subcat_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_subcat_category (category_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Products.
--  * `art` names the drawn illustration used until a real photo exists.
--  * `image` is set once the client uploads a photo; the frontend
--    prefers the photo and falls back to the drawing.
--  * wattage is stored as a plain number so the wattage filter can use
--    an index instead of parsing the spec text.
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(80)  NOT NULL UNIQUE,       -- 'i02', later a real slug
  category_id  VARCHAR(40)  NOT NULL,
  name         VARCHAR(200) NOT NULL,
  name_bn      VARCHAR(240) NOT NULL,
  sku          VARCHAR(60)  NOT NULL UNIQUE,
  price        DECIMAL(10,2) NOT NULL,
  old_price    DECIMAL(10,2) NULL,                 -- struck-through "was" price
  wattage      INT          NULL,                  -- parsed from specs, for filtering
  cct          INT          NULL,                  -- 6500, 3000 … for filtering
  art          VARCHAR(40)  NOT NULL DEFAULT 'bulbA',
  image        VARCHAR(255) NULL,                  -- uploaded photo filename
  stock        INT          NOT NULL DEFAULT 0,
  is_featured  TINYINT(1)   NOT NULL DEFAULT 0,    -- "best seller" row
  is_new       TINYINT(1)   NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_products_category (category_id, is_active),
  INDEX idx_products_wattage   (wattage),
  INDEX idx_products_cct       (cct),
  INDEX idx_products_featured  (is_featured, is_active),
  FULLTEXT KEY ft_products (name, name_bn, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per spec line, so the admin can add or reorder spec rows
-- without a schema change and without parsing JSON in the client.
CREATE TABLE product_specs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT          NOT NULL,
  spec_key    VARCHAR(80)  NOT NULL,               -- 'Wattage', 'IP', …
  spec_value  VARCHAR(255) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_spec_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_spec_product (product_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extra photos beyond the main one.
CREATE TABLE product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT          NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_image_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_image_product (product_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Enquiries — the site takes no orders, so this is the conversion.
-- Two sources: someone tapping a WhatsApp / call button (logged
-- automatically) and someone filling in the project enquiry form.
-- ---------------------------------------------------------------------
CREATE TABLE enquiries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  source       ENUM('whatsapp','phone','form') NOT NULL DEFAULT 'form',
  name         VARCHAR(120) NULL,
  company      VARCHAR(160) NULL,
  phone        VARCHAR(40)  NULL,
  email        VARCHAR(160) NULL,
  product_id   INT          NULL,                  -- set when it came off a product page
  category_id  VARCHAR(40)  NULL,
  message      TEXT         NULL,
  page         VARCHAR(120) NULL,                  -- which page they were on
  lang         ENUM('en','bn') NOT NULL DEFAULT 'en',
  status       ENUM('new','quoted','site_visit','sold','closed') NOT NULL DEFAULT 'new',
  admin_note   TEXT         NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enq_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_enq_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_enq_status (status, created_at),
  INDEX idx_enq_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Admins.  Customers never sign in — only staff, with email + password.
-- ---------------------------------------------------------------------
CREATE TABLE admins (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(160) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,            -- bcrypt
  role           ENUM('admin','staff') NOT NULL DEFAULT 'admin',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at  DATETIME     NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Editable site settings (phone, WhatsApp number, address, hours…) so
-- the client can change contact details without touching code.
-- ---------------------------------------------------------------------
CREATE TABLE settings (
  setting_key   VARCHAR(60)  NOT NULL PRIMARY KEY,
  setting_value TEXT         NULL,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
