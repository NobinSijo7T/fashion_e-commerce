import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { GetServerSideProps } from "next";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Button from "../components/Buttons/Button";
import { roundDecimal } from "../components/Util/utilFunc";
import { useCart } from "../context/cart/CartProvider";
import Input from "../components/Input/Input";
import { itemType } from "../context/wishlist/wishlist-type";
import { useAuth } from "../context/AuthContext";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import { cartLineKey } from "../context/Util/cartLineKey";

type PaymentType = "CASH_ON_DELIVERY" | "BANK_TRANSFER";
type DeliveryType = "STORE_PICKUP" | "STANDARD" | "EXPRESS";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_value: number;
};

type Order = {
  orderNumber: string;
  orderDate: string;
  paymentType: PaymentType;
  deliveryType: DeliveryType;
  totalPrice: string | number;
  deliveryDate: string;
};

const ShoppingCart = () => {
  const t = useTranslations("CartWishlist");
  const { cart, clearCart } = useCart();
  const auth = useAuth();
  const [deli, setDeli] = useState<DeliveryType>("STORE_PICKUP");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentType>("CASH_ON_DELIVERY");

  // Personal info
  const [name, setName] = useState(auth.user?.fullname || "");
  const [email, setEmail] = useState(auth.user?.email || "");
  const [phone, setPhone] = useState(auth.user?.phone || "");
  const [password, setPassword] = useState("");

  // Structured address fields
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  useEffect(() => {
    if (auth.user) {
      setName(auth.user.fullname);
      setEmail(auth.user.email);
      setPhone(auth.user.phone || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  // ── Coupon apply ────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("coupons")
        .select("id, code, discount_type, discount_value, min_order_value")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        setCouponError("Invalid or expired coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data as Coupon);
        setCouponError("");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setErrorMsg("");
    setOrderError("");

    if (cart.some((i) => !i.variantId)) {
      setOrderError("error_occurs");
      return;
    }

    setIsPlacing(true);

    try {
      if (!auth.user) {
        const regResponse = await auth.register!(
          email,
          name,
          password,
          `${addressLine1}, ${city}, ${state} ${pincode}`,
          phone
        );
        if (!regResponse.success) {
          if (regResponse.message === "alreadyExists") {
            setErrorMsg("email_already_exists");
          } else {
            setErrorMsg("error_occurs");
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? auth.user?.id;
      if (!uid) {
        setErrorMsg("error_occurs");
        return;
      }

      // ── Save to addresses table ──────────────────────────────────────────
      const { data: addrRow, error: addrErr } = await supabase
        .from("addresses")
        .insert({
          user_id: uid,
          label: "Home",
          full_name: name,
          phone,
          address_line1: addressLine1,
          city,
          state,
          pincode,
          is_default: true,
        })
        .select("id")
        .single();

      if (addrErr || !addrRow) {
        setOrderError("error_occurs");
        return;
      }

      const sub = Number(subtotal);
      const ship = deliFee;

      // ── Coupon discount ──────────────────────────────────────────────────
      let discountAmount = 0;
      if (appliedCoupon && subtotal >= appliedCoupon.min_order_value) {
        if (appliedCoupon.discount_type === "percent") {
          discountAmount = parseFloat(String(roundDecimal((sub * appliedCoupon.discount_value) / 100)));
        } else {
          discountAmount = appliedCoupon.discount_value;
        }
      }

      const payMethod =
        paymentMethod === "CASH_ON_DELIVERY" ? "cod" : "netbanking";
      const notes = sendEmail ? "notify:email" : null;

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          user_id: uid,
          status: "placed",
          payment_status: "pending",
          payment_method: payMethod,
          subtotal: sub,
          shipping_charge: ship,
          discount_amount: discountAmount,
          total_amount: roundDecimal(sub + ship - discountAmount),
          notes,
          shipping_address_id: addrRow.id,
          coupon_id: appliedCoupon?.id ?? null,
        })
        .select("id, order_number, placed_at")
        .single();

      if (oErr || !order) {
        setOrderError("error_occurs");
        return;
      }

      // ── Order items ──────────────────────────────────────────────────────
      for (const item of cart) {
        if (!item.variantId) continue;
        const { error: liErr } = await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.id,
          variant_id: item.variantId,
          product_name: item.name,
          size: item.size ?? "",
          color: item.color ?? "",
          quantity: item.qty ?? 1,
          unit_price: item.price,
        });
        if (liErr) {
          setOrderError("error_occurs");
          return;
        }
      }

      await supabase.from("delivery_tracking").insert({
        order_id: order.id,
        current_status: "placed",
      });

      const deliveryDate = new Date(Date.now() + 7 * 86400000).toISOString();

      clearCart!();
      setCompletedOrder({
        orderNumber: order.order_number,
        orderDate: order.placed_at,
        totalPrice: parseFloat(String(roundDecimal(sub + ship - discountAmount))),
        paymentType: paymentMethod,
        deliveryType: deli,
        deliveryDate,
      });
    } catch {
      setOrderError("error_occurs");
    } finally {
      setIsPlacing(false);
    }
  };

  const disableOrder = (() => {
    const baseFields =
      name !== "" && email !== "" && phone !== "" &&
      addressLine1 !== "" && city !== "" && state !== "" && pincode !== "";
    if (!auth.user) return !(baseFields && password !== "");
    return !baseFields;
  })();

  let subtotal: number = 0;
  subtotal = parseFloat(String(roundDecimal(
    cart.reduce(
      (accumulator: number, currentItem: itemType) =>
        accumulator + currentItem.price * currentItem!.qty!,
      0
    )
  )));

  let deliFee = 0;
  if (deli === "STANDARD") deliFee = 2.0;
  else if (deli === "EXPRESS") deliFee = 7.0;

  // Discount calc for display
  let discountDisplay = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.min_order_value) {
    if (appliedCoupon.discount_type === "percent") {
      discountDisplay = parseFloat(String(roundDecimal((subtotal * appliedCoupon.discount_value) / 100)));
    } else {
      discountDisplay = appliedCoupon.discount_value;
    }
  }

  const grandTotal = parseFloat(String(roundDecimal(subtotal + deliFee - discountDisplay)));

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`Shopping Cart - Haru Fashion`} />

      <main id="main-content">
        {/* ===== Heading & Continue Shopping */}
        <div className="app-max-width px-4 sm:px-8 md:px-20 w-full border-t-2 border-gray100">
          <h1 className="text-2xl sm:text-4xl text-center sm:text-left mt-6 mb-2 animatee__animated animate__bounce">
            {t("checkout")}
          </h1>
        </div>

        {/* ===== Form Section ===== */}
        {!completedOrder ? (
          <div className="app-max-width px-4 sm:px-8 md:px-20 mb-14 flex flex-col lg:flex-row">
            {/* LEFT: contact + address form */}
            <div className="h-full w-full lg:w-7/12 mr-8">
              {errorMsg !== "" && (
                <span className="text-red text-sm font-semibold">
                  - {t(errorMsg)}
                </span>
              )}

              {/* ── Contact info ── */}
              <p className="text-xs uppercase tracking-widest text-gray400 mt-6 mb-3 border-b border-gray200 pb-2">
                Contact Information
              </p>

              <div className="my-4">
                <label htmlFor="name" className="text-lg">
                  {t("name")}
                </label>
                <Input
                  name="name"
                  type="text"
                  extraClass="w-full mt-1 mb-2"
                  border="border-2 border-gray400"
                  value={name}
                  onChange={(e) => setName((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              <div className="my-4">
                <label htmlFor="email" className="text-lg mb-1">
                  {t("email_address")}
                </label>
                <Input
                  name="email"
                  type="email"
                  readOnly={auth.user ? true : false}
                  extraClass={`w-full mt-1 mb-2 ${auth.user ? "bg-gray100 cursor-not-allowed" : ""}`}
                  border="border-2 border-gray400"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              {!auth.user && (
                <div className="my-4">
                  <label htmlFor="password" className="text-lg">
                    {t("password")}
                  </label>
                  <Input
                    name="password"
                    type="password"
                    extraClass="w-full mt-1 mb-2"
                    border="border-2 border-gray400"
                    value={password}
                    onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                    required
                  />
                </div>
              )}

              <div className="my-4">
                <label htmlFor="phone" className="text-lg">
                  {t("phone")}
                </label>
                <Input
                  name="phone"
                  type="text"
                  extraClass="w-full mt-1 mb-2"
                  border="border-2 border-gray400"
                  value={phone}
                  onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              {/* ── Shipping address ── */}
              <p className="text-xs uppercase tracking-widest text-gray400 mt-6 mb-3 border-b border-gray200 pb-2">
                Shipping Address
              </p>

              <div className="my-4">
                <label htmlFor="address_line1" className="text-lg">
                  Address Line
                </label>
                <Input
                  name="address_line1"
                  type="text"
                  extraClass="w-full mt-1 mb-2"
                  border="border-2 border-gray400"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <label htmlFor="city" className="text-lg">
                    City
                  </label>
                  <Input
                    name="city"
                    type="text"
                    extraClass="w-full mt-1 mb-2"
                    border="border-2 border-gray400"
                    value={city}
                    onChange={(e) => setCity((e.target as HTMLInputElement).value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="text-lg">
                    State
                  </label>
                  <Input
                    name="state"
                    type="text"
                    extraClass="w-full mt-1 mb-2"
                    border="border-2 border-gray400"
                    value={state}
                    onChange={(e) => setState((e.target as HTMLInputElement).value)}
                    required
                  />
                </div>
              </div>

              <div className="my-4 w-1/2">
                <label htmlFor="pincode" className="text-lg">
                  Pincode / ZIP
                </label>
                <Input
                  name="pincode"
                  type="text"
                  extraClass="w-full mt-1 mb-2"
                  border="border-2 border-gray400"
                  value={pincode}
                  onChange={(e) => setPincode((e.target as HTMLInputElement).value)}
                  required
                />
              </div>

              {!auth.user && (
                <div className="text-sm text-gray400 mt-8 leading-6">
                  {t("form_note")}
                </div>
              )}
            </div>

            {/* RIGHT: order summary */}
            <div className="h-full w-full lg:w-5/12 mt-10 lg:mt-4">
              <div className="border border-gray500 p-6 divide-y-2 divide-gray200">
                {/* Product list */}
                <div className="flex justify-between">
                  <span className="text-base uppercase mb-3">{t("product")}</span>
                  <span className="text-base uppercase mb-3">{t("subtotal")}</span>
                </div>

                <div className="pt-2">
                  {cart.map((item) => (
                    <div className="flex justify-between mb-2" key={cartLineKey(item)}>
                      <span className="text-base font-medium">
                        {item.name}{" "}
                        <span className="text-gray400">x {item.qty}</span>
                      </span>
                      <span className="text-base">
                        $ {roundDecimal(item.price * item!.qty!)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal */}
                <div className="py-3 flex justify-between">
                  <span className="uppercase">{t("subtotal")}</span>
                  <span>$ {subtotal}</span>
                </div>

                {/* Delivery */}
                <div className="py-3">
                  <span className="uppercase">{t("delivery")}</span>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <input
                          type="radio"
                          name="deli"
                          value="STORE_PICKUP"
                          id="pickup"
                          checked={deli === "STORE_PICKUP"}
                          onChange={() => setDeli("STORE_PICKUP")}
                        />{" "}
                        <label htmlFor="pickup" className="cursor-pointer">
                          {t("store_pickup")}
                        </label>
                      </div>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <input
                          type="radio"
                          name="deli"
                          value="STANDARD"
                          id="standard"
                          checked={deli === "STANDARD"}
                          onChange={() => setDeli("STANDARD")}
                        />{" "}
                        <label htmlFor="standard" className="cursor-pointer">
                          Standard Delivery
                        </label>
                      </div>
                      <span>$ 2.00</span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <input
                          type="radio"
                          name="deli"
                          value="EXPRESS"
                          id="express"
                          checked={deli === "EXPRESS"}
                          onChange={() => setDeli("EXPRESS")}
                        />{" "}
                        <label htmlFor="express" className="cursor-pointer">
                          Express Delivery
                        </label>
                      </div>
                      <span>$ 7.00</span>
                    </div>
                  </div>
                </div>

                {/* Coupon */}
                <div className="py-3">
                  <span className="uppercase text-sm font-medium">Coupon Code</span>
                  {appliedCoupon ? (
                    <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-300 rounded px-3 py-2">
                      <div>
                        <span className="text-green-700 font-semibold text-sm">
                          {appliedCoupon.code}
                        </span>
                        <span className="ml-2 text-green-600 text-xs">
                          {appliedCoupon.discount_type === "percent"
                            ? `${appliedCoupon.discount_value}% off`
                            : `$${appliedCoupon.discount_value} off`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-gray400 hover:text-red ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        id="coupon_code"
                        type="text"
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="border border-gray400 px-3 py-2 text-sm flex-1 outline-none focus:border-gray500"
                      />
                      <button
                        type="button"
                        onClick={() => void handleApplyCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-gray500 text-white text-xs px-4 py-2 uppercase tracking-wide disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-red text-xs mt-1">{couponError}</p>
                  )}
                  {appliedCoupon && discountDisplay > 0 && (
                    <div className="flex justify-between mt-2 text-green-700 text-sm">
                      <span>Discount</span>
                      <span>- $ {discountDisplay}</span>
                    </div>
                  )}
                </div>

                {/* Grand total */}
                <div>
                  <div className="flex justify-between py-3">
                    <span>{t("grand_total")}</span>
                    <span>$ {grandTotal}</span>
                  </div>

                  {/* Payment method */}
                  <div className="grid gap-4 mt-2 mb-4">
                    <label
                      htmlFor="plan-cash"
                      className="relative flex flex-col bg-white p-5 rounded-lg shadow-md border border-gray300 cursor-pointer"
                    >
                      <span className="font-semibold text-gray-500 text-base leading-tight capitalize">
                        {t("cash_on_delivery")}
                      </span>
                      <input
                        type="radio"
                        name="plan"
                        id="plan-cash"
                        value="CASH_ON_DELIVERY"
                        className="absolute h-0 w-0 appearance-none"
                        onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      />
                      <span
                        aria-hidden="true"
                        className={`${
                          paymentMethod === "CASH_ON_DELIVERY" ? "block" : "hidden"
                        } absolute inset-0 border-2 border-gray500 bg-opacity-10 rounded-lg`}
                      >
                        <span className="absolute top-4 right-4 h-6 w-6 inline-flex items-center justify-center rounded-full bg-gray100">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </span>
                    </label>
                    <label
                      htmlFor="plan-bank"
                      className="relative flex flex-col bg-white p-5 rounded-lg shadow-md border border-gray300 cursor-pointer"
                    >
                      <span className="font-semibold text-gray-500 leading-tight capitalize">
                        {t("bank_transfer")}
                      </span>
                      <span className="text-gray400 text-sm mt-1">
                        {t("bank_transfer_desc")}
                      </span>
                      <input
                        type="radio"
                        name="plan"
                        id="plan-bank"
                        value="BANK_TRANSFER"
                        className="absolute h-0 w-0 appearance-none"
                        onChange={() => setPaymentMethod("BANK_TRANSFER")}
                      />
                      <span
                        aria-hidden="true"
                        className={`${
                          paymentMethod === "BANK_TRANSFER" ? "block" : "hidden"
                        } absolute inset-0 border-2 border-gray500 bg-opacity-10 rounded-lg`}
                      >
                        <span className="absolute top-4 right-4 h-6 w-6 inline-flex items-center justify-center rounded-full bg-gray100">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </span>
                    </label>
                  </div>

                  <div className="my-8">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        name="send-email-toggle"
                        id="send-email-toggle"
                        checked={sendEmail}
                        onChange={() => setSendEmail(!sendEmail)}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray300 appearance-none cursor-pointer"
                      />
                      <label
                        htmlFor="send-email-toggle"
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray300 cursor-pointer"
                      ></label>
                    </div>
                    <label htmlFor="send-email-toggle" className="text-xs text-gray-700">
                      {t("send_order_email")}
                    </label>
                  </div>
                </div>

                <Button
                  value={isPlacing ? t("placing_order") : t("place_order")}
                  size="xl"
                  extraClass={`w-full`}
                  onClick={() => void handlePlaceOrder()}
                  disabled={disableOrder || isPlacing}
                />
              </div>

              {orderError !== "" && (
                <span className="text-red text-sm font-semibold">
                  - {orderError}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="app-max-width px-4 sm:px-8 md:px-20 mb-14 mt-6">
            <div className="text-gray400 text-base">{t("thank_you_note")}</div>

            <div className="flex flex-col md:flex-row">
              <div className="h-full w-full md:w-1/2 mt-2 lg:mt-4">
                <div className="border border-gray500 p-6 divide-y-2 divide-gray200">
                  <div className="flex justify-between">
                    <span className="text-base uppercase mb-3">{t("order_id")}</span>
                    <span className="text-base uppercase mb-3">{completedOrder.orderNumber}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-base">{t("email_address")}</span>
                      <span className="text-base">{auth.user?.email}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-base">{t("order_date")}</span>
                      <span className="text-base">
                        {new Date(completedOrder.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-base">{t("delivery_date")}</span>
                      <span className="text-base">
                        {new Date(completedOrder.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="py-3">
                    <div className="flex justify-between mb-2">
                      <span className="">{t("payment_method")}</span>
                      <span>{completedOrder.paymentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">{t("delivery_method")}</span>
                      <span>{completedOrder.deliveryType}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between mb-2">
                    <span className="text-base uppercase">{t("total")}</span>
                    <span className="text-base">$ {completedOrder.totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="h-full w-full md:w-1/2 md:ml-8 mt-4 md:mt-2 lg:mt-4">
                <div>
                  {t("your_order_received")}
                  {completedOrder.paymentType === "BANK_TRANSFER" && t("bank_transfer_note")}
                  {completedOrder.paymentType === "CASH_ON_DELIVERY" &&
                    completedOrder.deliveryType !== "STORE_PICKUP" &&
                    t("cash_delivery_note")}
                  {completedOrder.deliveryType === "STORE_PICKUP" && t("store_pickup_note")}
                  {t("thank_you_for_purchasing")}
                </div>

                {completedOrder.paymentType === "BANK_TRANSFER" ? (
                  <div className="mt-6">
                    <h2 className="text-xl font-bold">{t("our_banking_details")}</h2>
                    <span className="uppercase block my-1">Haru Fashion :</span>
                    <div className="flex justify-between w-full xl:w-1/2">
                      <span className="text-sm font-bold">HDFC Bank</span>
                      <span className="text-base">1234 5678 9012</span>
                    </div>
                    <div className="flex justify-between w-full xl:w-1/2">
                      <span className="text-sm font-bold">ICICI Bank</span>
                      <span className="text-base">9876 5432 1098</span>
                    </div>
                    <div className="flex justify-between w-full xl:w-1/2">
                      <span className="text-sm font-bold">UPI</span>
                      <span className="text-base">haru@upi</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-56">
                    <div className="w-3/4">
                      <Image
                        className="justify-center"
                        src="/logo.svg"
                        alt="Haru Fashion"
                        width={220}
                        height={50}
                        layout="responsive"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      locale,
      messages: (await import(`../messages/common/${locale}.json`)).default,
    },
  };
};

export default ShoppingCart;
