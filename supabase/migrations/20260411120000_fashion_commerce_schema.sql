-- Fashion commerce schema for Supabase (PostgreSQL).
-- Run once in Supabase SQL Editor: Dashboard → SQL → New query → Paste → Run.
-- Requires: auth schema (Supabase-managed). If re-running, drop objects manually or use a fresh project.
-- If trigger creation errors on your Postgres version, try replacing EXECUTE PROCEDURE with EXECUTE FUNCTION for handle_new_user.

-- =============================================
-- 🔐 AUTH: profiles + signup trigger
-- =============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 👗 CATEGORIES
-- =============================================

CREATE TABLE public.fashion_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  gender_target TEXT CHECK (gender_target IN ('male', 'female', 'unisex', 'kids')),
  description TEXT,
  image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fashion_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.fashion_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 👕 PRODUCTS
-- =============================================

CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  category_id UUID REFERENCES public.fashion_categories(id),
  subcategory_id UUID REFERENCES public.fashion_subcategories(id),
  gender_target TEXT CHECK (gender_target IN ('male', 'female', 'unisex', 'kids')),
  base_price NUMERIC(10, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  final_price NUMERIC(10, 2) GENERATED ALWAYS AS
    (ROUND(base_price * (1 - discount_percent / 100), 2)) STORED,
  rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0
);

CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT,
  stock_quantity INT DEFAULT 0,
  sku TEXT UNIQUE,
  additional_price NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ❤️ WISHLIST / 🛒 CART
-- =============================================

CREATE TABLE public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE public.cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

-- =============================================
-- 📦 ORDERS
-- =============================================

CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8)),
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  subtotal NUMERIC(10, 2),
  shipping_charge NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2),
  notes TEXT,
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE TABLE public.delivery_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  tracking_number TEXT,
  carrier TEXT,
  current_status TEXT DEFAULT 'placed'
    CHECK (current_status IN ('placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered')),
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.delivery_status_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  message TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 📍 ADDRESSES
-- =============================================

CREATE TABLE public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN shipping_address_id UUID REFERENCES public.addresses(id);

-- =============================================
-- ⭐ REVIEWS
-- =============================================

CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  images TEXT[],
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 🏷️ COUPONS
-- =============================================

CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percent', 'flat')),
  discount_value NUMERIC(10, 2),
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);

-- =============================================
-- 🔒 RLS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fashion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fashion_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own cart" ON public.cart
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users select own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own delivery tracking" ON public.delivery_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_tracking.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users insert own delivery tracking" ON public.delivery_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_tracking.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users read own delivery log" ON public.delivery_status_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_status_log.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users insert own delivery log" ON public.delivery_status_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_status_log.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active categories" ON public.fashion_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active subcategories" ON public.fashion_subcategories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read images for active products" ON public.product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.is_active = true)
  );

CREATE POLICY "Public read variants for active products" ON public.product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.is_active = true)
  );

CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Auth users insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone read active coupons" ON public.coupons
  FOR SELECT USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  );

-- =============================================
-- 🗂️ SEED: categories + sample products
-- =============================================

INSERT INTO public.fashion_categories (name, gender_target, slug) VALUES
  ('Casual Wear', 'unisex', 'casual-wear'),
  ('Formal Wear', 'male', 'formal-wear'),
  ('Ethnic Wear', 'female', 'ethnic-wear'),
  ('Western Wear', 'female', 'western-wear'),
  ('Activewear', 'unisex', 'activewear'),
  ('Winterwear', 'unisex', 'winterwear'),
  ('Footwear', 'unisex', 'footwear'),
  ('Accessories', 'unisex', 'accessories'),
  ('Kids Fashion', 'kids', 'kids-fashion');

-- Stable seed: one insert per product
INSERT INTO public.products (name, description, brand, category_id, gender_target, base_price, discount_percent, is_featured, tags)
SELECT 'Oversized check overshirt', 'Relaxed fit layering piece for everyday wear.', 'Haru', id, 'unisex', 546, 10, true, ARRAY['trending','new']
FROM public.fashion_categories WHERE slug = 'casual-wear' LIMIT 1;

INSERT INTO public.products (name, description, brand, category_id, gender_target, base_price, discount_percent, is_featured, tags)
SELECT 'Long sleeve checked shirt', 'Classic checks with a soft hand-feel.', 'Haru', id, 'male', 96, 0, false, ARRAY['casual']
FROM public.fashion_categories WHERE slug = 'casual-wear' LIMIT 1;

INSERT INTO public.products (name, description, brand, category_id, gender_target, base_price, discount_percent, is_featured, tags)
SELECT 'Floral midi skirt', 'Lightweight skirt with a flattering silhouette.', 'Haru', id, 'female', 516, 15, true, ARRAY['summer']
FROM public.fashion_categories WHERE slug = 'western-wear' LIMIT 1;

INSERT INTO public.products (name, description, brand, category_id, gender_target, base_price, discount_percent, is_featured, tags)
SELECT 'Silk blend saree', 'Elegant drape for occasions.', 'Haru', id, 'female', 189, 0, true, ARRAY['ethnic','festive']
FROM public.fashion_categories WHERE slug = 'ethnic-wear' LIMIT 1;

INSERT INTO public.products (name, description, brand, category_id, gender_target, base_price, discount_percent, is_featured, tags)
SELECT 'Slim fit formal trousers', 'Tailored trousers for office and events.', 'Haru', id, 'male', 120, 0, false, ARRAY['formal']
FROM public.fashion_categories WHERE slug = 'formal-wear' LIMIT 1;

INSERT INTO public.products (name, description, brand, category_id, gender_target, base_price, discount_percent, is_featured, tags)
SELECT 'Kids printed tee', 'Soft cotton tee for everyday play.', 'Haru', id, 'kids', 24, 0, false, ARRAY['kids']
FROM public.fashion_categories WHERE slug = 'kids-fashion' LIMIT 1;

-- Images (use remote URLs allowed in Next.js config)
INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/ygvLnKn/minimalist-img-3-364x492.jpg', true, 0
FROM public.products p WHERE p.name = 'Oversized check overshirt' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/VW0r4Tf/minimalist-img-31-364x492.jpg', false, 1
FROM public.products p WHERE p.name = 'Oversized check overshirt' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/tCKthsB/minimalist-img-2-1.jpg', true, 0
FROM public.products p WHERE p.name = 'Long sleeve checked shirt' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/ZmBBLJx/minimalist-img-21.webp', false, 1
FROM public.products p WHERE p.name = 'Long sleeve checked shirt' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/qMXqGjQ/minimalist-img-71-jpg.webp', true, 0
FROM public.products p WHERE p.name = 'Floral midi skirt' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/9bKsRYv/minimalist-img-7-jpg.webp', false, 1
FROM public.products p WHERE p.name = 'Floral midi skirt' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/QHBzFhv/minimalist-img-51-364x492.jpg', true, 0
FROM public.products p WHERE p.name = 'Silk blend saree' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/GTjhWTF/minimalist-img-61-364x492.jpg', false, 1
FROM public.products p WHERE p.name = 'Silk blend saree' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/GT6GPCj/coat1-2-364x492.webp', true, 0
FROM public.products p WHERE p.name = 'Slim fit formal trousers' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/2SzNzZ1/coat1-364x492.webp', false, 1
FROM public.products p WHERE p.name = 'Slim fit formal trousers' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/8Y20hY2/minimalist-img-12-364x492.jpg', true, 0
FROM public.products p WHERE p.name = 'Kids printed tee' LIMIT 1;

INSERT INTO public.product_images (product_id, image_url, is_primary, sort_order)
SELECT p.id, 'https://i.ibb.co/fqRBj2t/minimalist-img-121-364x492.jpg', false, 1
FROM public.products p WHERE p.name = 'Kids printed tee' LIMIT 1;

-- Variants: S/M/L, stock
INSERT INTO public.product_variants (product_id, size, color, color_hex, stock_quantity, sku, additional_price)
SELECT p.id, v.size, v.color, v.hex, v.stock, 'SKU-' || SUBSTRING(REPLACE(p.id::TEXT, '-', ''), 1, 8) || '-' || v.size || '-' || v.color, 0
FROM public.products p
CROSS JOIN (VALUES
  ('S','Black','#111111',12),
  ('M','Black','#111111',20),
  ('L','Black','#111111',8)
) AS v(size, color, hex, stock)
WHERE p.name = 'Oversized check overshirt';

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock_quantity, sku, additional_price)
SELECT p.id, v.size, v.color, v.hex, v.stock, 'SKU-' || SUBSTRING(REPLACE(p.id::TEXT, '-', ''), 1, 8) || '-' || v.size, 0
FROM public.products p
CROSS JOIN (VALUES ('S','White','#FFFFFF',10),('M','White','#FFFFFF',15),('L','White','#FFFFFF',6)) AS v(size, color, hex, stock)
WHERE p.name = 'Long sleeve checked shirt';

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock_quantity, sku, additional_price)
SELECT p.id, v.size, v.color, v.hex, v.stock, 'SKU-' || SUBSTRING(REPLACE(p.id::TEXT, '-', ''), 1, 8) || '-' || v.size, 0
FROM public.products p
CROSS JOIN (VALUES ('S','Navy','#1a237e',5),('M','Navy','#1a237e',9),('L','Navy','#1a237e',4)) AS v(size, color, hex, stock)
WHERE p.name = 'Floral midi skirt';

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock_quantity, sku, additional_price)
SELECT p.id, 'One','Maroon','#800000',6, 'SKU-' || SUBSTRING(REPLACE(p.id::TEXT, '-', ''), 1, 8), 0
FROM public.products p WHERE p.name = 'Silk blend saree';

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock_quantity, sku, additional_price)
SELECT p.id, v.size, v.color, v.hex, v.stock, 'SKU-' || SUBSTRING(REPLACE(p.id::TEXT, '-', ''), 1, 8) || '-' || v.size, 0
FROM public.products p
CROSS JOIN (VALUES ('30','Charcoal','#37474f',14),('32','Charcoal','#37474f',18),('34','Charcoal','#37474f',10)) AS v(size, color, hex, stock)
WHERE p.name = 'Slim fit formal trousers';

INSERT INTO public.product_variants (product_id, size, color, color_hex, stock_quantity, sku, additional_price)
SELECT p.id, v.size, v.color, v.hex, v.stock, 'SKU-' || SUBSTRING(REPLACE(p.id::TEXT, '-', ''), 1, 8) || '-' || v.size, 0
FROM public.products p
CROSS JOIN (VALUES ('4Y','Yellow','#FFEB3B',20),('6Y','Yellow','#FFEB3B',25),('8Y','Yellow','#FFEB3B',15)) AS v(size, color, hex, stock)
WHERE p.name = 'Kids printed tee';
