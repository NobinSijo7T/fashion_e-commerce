import { itemType } from "../cart/cart-types";
import { cartLineKey } from "./cartLineKey";

const removeItemFromCart = (cartItems: itemType[], item: itemType) => {
  const key = cartLineKey(item);
  if (item.qty === 1) {
    return cartItems.filter((cartItem) => cartLineKey(cartItem) !== key);
  }
  return cartItems.map((cartItem) =>
    cartLineKey(cartItem) === key
      ? { ...cartItem, qty: cartItem.qty! - 1 }
      : cartItem
  );
  //   if (duplicate) {
  //     return cartItems.map((cartItem) =>
  //       cartItem.id === item.id
  //         ? { ...cartItem, qty: cartItem.qty - 1 }
  //         : cartItem
  //     );
  //   }
  //   return [
  //     ...cartItems,
  //     {
  //       id: item.id,
  //       name: item.name,
  //       price: item.price,
  //       img1: item.img1,
  //       img2: item.img2,
  //       qty: 1,
  //     },
  //   ];
};

export default removeItemFromCart;
