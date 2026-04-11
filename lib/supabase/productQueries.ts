import { createSupabaseServerClient } from "./server";
import {
  mapDbProductToItem,
  type DbProductRow,
} from "./mapProduct";
import { PRODUCT_CARD_SELECT } from "./productSelect";

export async function fetchProductsPage(options: {
  offset: number;
  limit: number;
}): Promise<{ items: ReturnType<typeof mapDbProductToItem>[]; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) return { items: [], error: error.message };
    const rows = (data ?? []) as unknown as DbProductRow[];
    return { items: rows.map(mapDbProductToItem), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase error";
    return { items: [], error: msg };
  }
}

export async function fetchProductById(
  id: string
): Promise<{ product: DbProductRow | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) return { product: null, error: error.message };
    return { product: data as unknown as DbProductRow | null, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase error";
    return { product: null, error: msg };
  }
}

export async function fetchRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit: number
): Promise<{ items: ReturnType<typeof mapDbProductToItem>[]; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient();
    let q = supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("is_active", true)
      .neq("id", excludeId)
      .limit(limit);

    if (categoryId) {
      q = q.eq("category_id", categoryId);
    }

    const { data, error } = await q;
    if (error) return { items: [], error: error.message };
    const rows = (data ?? []) as unknown as DbProductRow[];
    return { items: rows.map(mapDbProductToItem), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase error";
    return { items: [], error: msg };
  }
}

function genderFilter(param: string): string[] | null {
  if (param === "women") return ["female", "unisex"];
  if (param === "men") return ["male", "unisex"];
  return null;
}

export async function fetchCategoryProducts(options: {
  categoryParam: string;
  offset: number;
  limit: number;
  orderBy: "latest" | "price" | "price-desc";
}): Promise<{
  items: ReturnType<typeof mapDbProductToItem>[];
  count: number;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();
    const { categoryParam, offset, limit, orderBy } = options;

    let countQ = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    let listQ = supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("is_active", true);

    if (categoryParam === "new-arrivals") {
      // no extra filter
    } else {
      const g = genderFilter(categoryParam);
      if (g) {
        countQ = countQ.in("gender_target", g);
        listQ = listQ.in("gender_target", g);
      } else {
        const { data: cat } = await supabase
          .from("fashion_categories")
          .select("id")
          .eq("slug", categoryParam)
          .eq("is_active", true)
          .maybeSingle();

        if (cat?.id) {
          countQ = countQ.eq("category_id", cat.id);
          listQ = listQ.eq("category_id", cat.id);
        }
      }
    }

    const { count, error: cErr } = await countQ;
    if (cErr) return { items: [], count: 0, error: cErr.message };

    if (orderBy === "price") {
      listQ = listQ.order("final_price", { ascending: true });
    } else if (orderBy === "price-desc") {
      listQ = listQ.order("final_price", { ascending: false });
    } else {
      listQ = listQ.order("created_at", { ascending: false });
    }

    const { data, error } = await listQ.range(
      offset,
      offset + limit - 1
    );

    if (error) return { items: [], count: count ?? 0, error: error.message };
    const rows = (data ?? []) as unknown as DbProductRow[];
    return {
      items: rows.map(mapDbProductToItem),
      count: count ?? 0,
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase error";
    return { items: [], count: 0, error: msg };
  }
}

export async function searchProducts(
  q: string
): Promise<{ items: ReturnType<typeof mapDbProductToItem>[]; error: string | null }> {
  const term = q.trim();
  if (!term) return { items: [], error: null };

  try {
    const supabase = createSupabaseServerClient();
    const safe = term.replace(/%/g, "\\%").replace(/_/g, "\\_");
    const pattern = `%${safe}%`;

    const [{ data: byName, error: e1 }, { data: byDesc, error: e2 }] =
      await Promise.all([
        supabase
          .from("products")
          .select(PRODUCT_CARD_SELECT)
          .eq("is_active", true)
          .ilike("name", pattern),
        supabase
          .from("products")
          .select(PRODUCT_CARD_SELECT)
          .eq("is_active", true)
          .ilike("description", pattern),
      ]);

    if (e1) return { items: [], error: e1.message };
    if (e2) return { items: [], error: e2.message };

    const merged = new Map<string, DbProductRow>();
    for (const row of (byName ?? []) as unknown as DbProductRow[]) {
      merged.set(row.id, row);
    }
    for (const row of (byDesc ?? []) as unknown as DbProductRow[]) {
      merged.set(row.id, row);
    }

    return {
      items: [...merged.values()].map(mapDbProductToItem),
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Supabase error";
    return { items: [], error: msg };
  }
}
