import type { itemType } from "../cart/cart-types";

/** Uniquely identifies a cart line (product + variant). */
export function cartLineKey(item: Pick<itemType, "id" | "variantId">): string {
  return item.variantId ? `${item.id}::${item.variantId}` : item.id;
}
