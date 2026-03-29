-- Remove UI/snapshot fields from cart_items; product data is fetched via join
ALTER TABLE public.cart_items
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS image;
