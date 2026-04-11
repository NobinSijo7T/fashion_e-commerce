import { itemType } from "../cart/cart-types";
import { cartLineKey } from "./cartLineKey";

const addItemToCart = (
  cartItems: itemType[],
  item: itemType,
  add_one = false
) => {
  const key = cartLineKey(item);
  const duplicate = cartItems.some((cartItem) => cartLineKey(cartItem) === key);

  if (duplicate) {
    return cartItems.map((cartItem) => {
      let itemQty = 0;
      !item.qty || add_one
        ? (itemQty = cartItem.qty! + 1)
        : (itemQty = item.qty);

      return cartLineKey(cartItem) === key
        ? {
            ...cartItem,
            qty: itemQty,
            price: item.price,
            variantId: item.variantId ?? cartItem.variantId,
            size: item.size ?? cartItem.size,
            color: item.color ?? cartItem.color,
          }
        : cartItem;
    });
  }
  let itemQty = 0;
  !item.qty ? itemQty++ : (itemQty = item.qty);
  return [
    ...cartItems,
    {
      id: item.id,
      name: item.name,
      price: item.price,
      img1: item.img1,
      img2: item.img2,
      qty: itemQty,
      variantId: item.variantId,
      size: item.size,
      color: item.color,
      discountPercent: item.discountPercent,
      categoryName: item.categoryName,
      categorySlug: item.categorySlug,
    },
  ];
};

export default addItemToCart;
