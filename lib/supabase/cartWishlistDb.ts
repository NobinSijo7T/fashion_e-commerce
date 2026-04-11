import type { SupabaseClient } from "@supabase/supabase-js";

import type { itemType } from "../../context/cart/cart-types";
import { cartLineKey } from "../../context/Util/cartLineKey";
import { mapDbProductToItem, type DbProductRow } from "./mapProduct";

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : parseFloat(v);
}

type CartRowDb = {
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: (Omit<DbProductRow, "product_variants"> & {
    product_images?: DbProductRow["product_images"];
    fashion_categories?: DbProductRow["fashion_categories"];
  }) | null;
  product_variants: {
    id: string;
    size: string;
    color: string;
    additional_price: string | number | null;
  } | null;
};

function mapCartRowToItem(row: CartRowDb): itemType | null {
  if (!row.products || !row.product_variants?.id) return null;
  const p = row.products;
  const imgs = [...(p.product_images ?? [])].sort((a, b) => {
    const pa = a.is_primary ? 0 : 1;
    const pb = b.is_primary ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const img1 = imgs[0]?.image_url;
  const img2 = imgs[1]?.image_url ?? img1;
  const unit = num(p.final_price) + num(row.product_variants.additional_price);
  return {
    id: row.product_id,
    name: p.name,
    price: unit,
    qty: row.quantity,
    img1,
    img2,
    variantId: row.product_variants.id,
    size: row.product_variants.size,
    color: row.product_variants.color,
    categoryName: p.fashion_categories?.name,
    categorySlug: p.fashion_categories?.slug,
    discountPercent:
      p.discount_percent != null ? num(p.discount_percent) : undefined,
    description: p.description ?? undefined,
    detail: p.description ?? undefined,
  };
}

export async function fetchUserCart(
  supabase: SupabaseClient,
  userId: string
): Promise<itemType[]> {
  const { data, error } = await supabase
    .from("cart")
    .select(
      `
      quantity,
      product_id,
      variant_id,
      products (
        id,
        name,
        description,
        discount_percent,
        final_price,
        fashion_categories ( name, slug ),
        product_images ( image_url, is_primary, sort_order )
      ),
      product_variants ( id, size, color, additional_price )
    `
    )
    .eq("user_id", userId);

  if (error || !data) return [];
  return (data as unknown as CartRowDb[])
    .map(mapCartRowToItem)
    .filter(Boolean) as itemType[];
}

export async function replaceUserCartRemote(
  supabase: SupabaseClient,
  userId: string,
  lines: itemType[]
): Promise<void> {
  await supabase.from("cart").delete().eq("user_id", userId);
  const withVariant = lines.filter((l) => l.variantId);
  if (withVariant.length === 0) return;
  const rows = withVariant.map((l) => ({
    user_id: userId,
    product_id: l.id,
    variant_id: l.variantId!,
    quantity: l.qty ?? 1,
  }));
  const { error } = await supabase.from("cart").insert(rows);
  if (error) console.error("cart sync insert", error.message);
}

type WishRowDb = {
  product_id: string;
  products: DbProductRow | null;
};

export async function fetchUserWishlist(
  supabase: SupabaseClient,
  userId: string
): Promise<itemType[]> {
  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      product_id,
      products (
        id,
        name,
        description,
        brand,
        base_price,
        discount_percent,
        final_price,
        rating,
        total_reviews,
        created_at,
        gender_target,
        fashion_categories ( name, slug ),
        product_images ( image_url, is_primary, sort_order ),
        product_variants ( id, size, color, color_hex, stock_quantity, sku, additional_price )
      )
    `
    )
    .eq("user_id", userId);

  if (error || !data) return [];
  return (data as unknown as WishRowDb[])
    .map((row) => {
      if (!row.products) return null;
      return mapDbProductToItem(row.products);
    })
    .filter(Boolean) as itemType[];
}

export async function replaceUserWishlistRemote(
  supabase: SupabaseClient,
  userId: string,
  items: itemType[]
): Promise<void> {
  await supabase.from("wishlist").delete().eq("user_id", userId);
  if (items.length === 0) return;
  const rows = items.map((i) => ({
    user_id: userId,
    product_id: i.id,
  }));
  const { error } = await supabase.from("wishlist").insert(rows);
  if (error) console.error("wishlist bulk insert", error.message);
}

/** Merge local + remote cart lines by variant key; sums quantities. */
export function mergeCarts(local: itemType[], remote: itemType[]): itemType[] {
  const map = new Map<string, itemType>();
  for (const i of remote) {
    map.set(cartLineKey(i), { ...i, qty: i.qty ?? 1 });
  }
  for (const i of local) {
    const k = cartLineKey(i);
    const ex = map.get(k);
    const q = i.qty ?? 1;
    if (ex) {
      map.set(k, { ...ex, qty: (ex.qty ?? 1) + q });
    } else {
      map.set(k, { ...i, qty: q });
    }
  }
  return [...map.values()];
}

export function mergeWishlists(
  local: itemType[],
  remote: itemType[]
): itemType[] {
  const map = new Map<string, itemType>();
  for (const i of remote) {
    map.set(i.id, i);
  }
  for (const i of local) {
    const prev = map.get(i.id);
    map.set(i.id, { ...(prev ?? {}), ...i });
  }
  return [...map.values()];
}
