/** PostgREST select fragment for catalog product rows (shared server/client shapes). */
export const PRODUCT_CARD_SELECT = `
  id,
  name,
  description,
  brand,
  base_price,
  discount_percent,
  final_price,
  rating,
  total_reviews,
  is_active,
  is_featured,
  tags,
  created_at,
  updated_at,
  gender_target,
  category_id,
  fashion_categories ( name, slug ),
  product_images ( image_url, is_primary, sort_order ),
  product_variants ( id, size, color, color_hex, stock_quantity, sku, additional_price )
`;
