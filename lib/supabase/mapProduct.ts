import type { itemType } from "../../context/cart/cart-types";
import { serializeJsonSafe } from "../serializeJsonSafe";

export type DbProductImage = {
  image_url: string;
  is_primary: boolean | null;
  sort_order: number | null;
};

export type DbProductVariant = {
  id: string;
  size: string;
  color: string;
  color_hex: string | null;
  stock_quantity: number | null;
  sku: string | null;
  additional_price: string | number | null;
};

export type DbCategory = { name: string; slug: string } | null;

export type DbProductRow = {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  category_id?: string | null;
  base_price: string | number;
  discount_percent: string | number | null;
  final_price: string | number;
  rating?: string | number | null;
  total_reviews?: number | null;
  created_at?: string;
  gender_target?: string | null;
  is_featured?: boolean | null;
  fashion_categories?: DbCategory;
  product_images?: DbProductImage[] | null;
  product_variants?: DbProductVariant[] | null;
};

export function pickDefaultVariant(
  variants: DbProductVariant[] | null | undefined
): DbProductVariant | null {
  if (!variants?.length) return null;
  const inStock = variants.find((v) => (v.stock_quantity ?? 0) > 0);
  return inStock ?? variants[0];
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : parseFloat(v);
}

export function mapDbProductToItem(row: DbProductRow): itemType {
  const imgs = [...(row.product_images ?? [])].sort((a, b) => {
    const pa = a.is_primary ? 0 : 1;
    const pb = b.is_primary ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const img1 = imgs[0]?.image_url;
  const img2 = imgs[1]?.image_url ?? img1;
  const variants = row.product_variants ?? [];
  const def = pickDefaultVariant(variants);
  const baseFinal = num(row.final_price);
  const add = def ? num(def.additional_price) : 0;
  const linePrice = baseFinal + add;
  const stockSum = variants.reduce(
    (s, v) => s + (v.stock_quantity ?? 0),
    0
  );

  return serializeJsonSafe({
    id: row.id,
    name: row.name,
    price: linePrice,
    description: row.description ?? undefined,
    detail: row.description ?? undefined,
    discountPercent:
      row.discount_percent != null ? num(row.discount_percent) : undefined,
    img1,
    img2,
    brand: row.brand ?? undefined,
    isFeatured: row.is_featured ?? undefined,
    categoryName: row.fashion_categories?.name,
    categorySlug: row.fashion_categories?.slug,
    category: row.fashion_categories
      ? { name: row.fashion_categories.name }
      : undefined,
    createdAt: row.created_at,
    stock: stockSum,
    variantId: def?.id,
    size: def?.size,
    color: def?.color,
  });
}
