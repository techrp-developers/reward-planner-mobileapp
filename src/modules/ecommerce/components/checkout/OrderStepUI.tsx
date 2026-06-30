import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  InteractionManager,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RazorpayCheckout from "react-native-razorpay";
import ProductHeadColor from "../../constants/heading/Poduct_Head_Color";
// import CouponsSection from "../../constants/coupan/CouponsSection";
import BillDetailsCard from "../../constants/itemcart/BillDetailsCard";
import ProductGrid from "../home/productgrid";

// import PaymentOptionsUI from "./PaymentOptionsUI";
import OrderProcedbutton from "./OrderProcedbutton";
import CheckoutItemCart from "./CheckoutItemCart";
import { addToCart, deleteAllCartItems, fetchCartItems, updateCartQty } from "../../api/CartApi";
import { fetchCheckoutCart, fetchBuyNowCheckout, addBuyNowOrder, addCartOrder } from "../../api/CheckoutApi";
import { fetchAllAddress } from "../../api/AddressApi";
import { createPaymentOrder, verifyPayment, checkPaymentStatus } from "../../api/Payment";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackActions, CommonActions } from "@react-navigation/native";
import type { HomeStackParamList } from "../../navigation/types";
import type { RouteProp } from "@react-navigation/native";

import { useRoute } from "@react-navigation/native";
import EmptyCart from "../cart/EmptyCart";
import { useAuth } from "../../../common/auth/context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useAlert } from "../alerts/useAlert";
import SkeletonBox from "../../../services/component/constant/SkeletonBox";
import {
  addressesQueryKey,
  checkoutPreviewQueryKey,
} from "../../navigation/navigationPerformance";
import RecommendedProducts from "../Promotion/RecommendedProducts";
import { useStickyBottomCTA } from "../../../../bottombar/hooks/useStickyBottomCTA";

type RouteT = RouteProp<HomeStackParamList, "OrderStepUI">;
type StepStatus = "done" | "current" | "upcoming";
type CheckoutSummary = {
  productTotal: number;
  shippingTotal: number;
  payableAmount: number;
  reward: {
    redeemCoins: number;
    earnCoins: number;
  };
};

// const COUPONS = [
//   {
//     id: 1,
//     code: "RPSLAY200",
//     title: "Add ₹248 more to avail this offer",
//     subtitle: "Get Flat ₹200 off",
//   },
//   {
//     id: 2,
//     code: "RPCC200",
//     title: "Buy for ₹7777 to avail",
//     subtitle: "BOB Credit Card Offer",
//   },
// ];

const PURPLE_1 = "#8665FF";
const PURPLE_2 = "#5B47A3";
const BG = "#FFF";
const GREY_LINE = "#D9D9DE";
const GREY_DOT = "#E6E6EA";
const TEXT_GREY = "#9AA0A6";
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

const emptyCheckoutSummary = (): CheckoutSummary => ({
  productTotal: 0,
  shippingTotal: 0,
  payableAmount: 0,
  reward: {
    redeemCoins: 0,
    earnCoins: 0,
  },
});

const getCheckoutPayableAmount = (summary: CheckoutSummary) =>
  Number(summary.payableAmount || 0);

const formatPhoneForRazorpay = (phone: string | undefined): string => {
  if (!phone) return "";
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  // Ensure it's 10 digits (Indian mobile)
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3);
  // Return as is if can't format
  return digits;
};

const safeToNumber = (value: any, defaultValue = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const isPaymentVerified = (res: any) => {
  const status = String(res?.status ?? res?.payment_status ?? "").toLowerCase();
  return (
    res?.success === true ||
    res?.verified === true ||
    status === "paid" ||
    status === "captured" ||
    status === "success" ||
    status === "verified"
  );
};

export default function OrderStepUI() {
  const { isAuthenticated, logout, user } = useAuth();
  const stickyCTA = useStickyBottomCTA();
  const { removeItem: removeFromCart } = useCart();
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const [items, setItems] = useState<any[]>([]);
  // const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [useRewards, setUseRewards] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const isCreatingOrder = useRef(false);
  const [hasCheckoutStarted, setHasCheckoutStarted] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();
  const skipItemsRefresh = useRef(false);
  const lastRedeemableCoins = useRef(0);

  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const handleUnauthorized = useCallback(async () => {
    Alert.alert("Session expired", "Your session has expired. Please log in again.");
    try {
      await logout();
    } catch (e) {
      console.warn("Failed to clear session during unauthorized handling", e);
    }

    const parent = (navigation as any)?.getParent?.();
    if (parent && typeof parent.reset === "function") {
      parent.reset({ index: 0, routes: [{ name: "AuthStack" }] });
    } else {
      navigation.navigate("Home");
    }
  }, [logout, navigation]);

  const route = useRoute<RouteT>();
  const mode = route?.params?.mode === "buy_now" ? "buy_now" : "cart";
  const product_id = Number(route?.params?.product_id);
  const variant_id = Number(route?.params?.variant_id);
  const qty = Math.max(1, Number(route?.params?.qty ?? 1));
  const [buyNowQty, setBuyNowQty] = useState(qty);
  const [cartSummary, setCartSummary] = useState<CheckoutSummary>(emptyCheckoutSummary);

  useEffect(() => {
    setBuyNowQty(qty);
  }, [qty]);

  const isBuyNowValid =
    mode !== "buy_now" ||
    (Number.isFinite(product_id) && product_id > 0 && Number.isFinite(variant_id) && variant_id > 0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const normalizeCheckoutItem = useCallback((item: any) => ({
    ...item,
    product_name:
      item?.product_name ||
      item?.title ||
      item?.name ||
      item?.product?.name ||
      item?.product?.title ||
      "Product",
    variant_name:
      item?.variant_name ||
      item?.variant?.name ||
      item?.subcategory_name ||
      "",
  }), []);

  const parseCheckoutResponse = useCallback(
    (res: any) => {
      const itemsArray =
        Array.isArray(res?.items) && res.items.length > 0
          ? res.items
          : Array.isArray(res?.data?.items) && res.data.items.length > 0
          ? res.data.items
          : res?.item
          ? [res.item]
          : res?.data?.item
          ? [res.data.item]
          : [];

      const normalizedItems = itemsArray.map(normalizeCheckoutItem);

      const data = res?.data ?? res ?? {};
      const reward = data?.reward ?? res?.reward ?? {};
      const toAmount = (value: any) => Number(value) || 0;

      const productTotal = toAmount(
        data?.productTotal ??
        res?.productTotal
      );
      const shippingBreakdown =
        (Array.isArray(data?.shippingBreakdown) && data.shippingBreakdown) ||
        (Array.isArray(res?.shippingBreakdown) && res.shippingBreakdown) ||
        [];
      const breakdownShippingTotal = shippingBreakdown.reduce(
        (sum: number, entry: any) => sum + toAmount(entry?.shipping_charges),
        0
      );
      const shippingTotal = toAmount(
        data?.shippingTotal ??
        res?.shippingTotal ??
        breakdownShippingTotal
      );
      const payableAmount = toAmount(
        data?.payableAmount ??
        res?.payableAmount
      );
      const summary: CheckoutSummary = {
        productTotal,
        shippingTotal,
        payableAmount,
        reward: {
          redeemCoins: toAmount(
            reward?.redeemCoins ??
            reward?.redeemedCoins ??
            data?.totalDiscount ??
            res?.totalDiscount
          ),
          earnCoins: toAmount(reward?.earnCoins),
        },
      };

      return {
        items: normalizedItems,
        summary,
      };
    },
    [normalizeCheckoutItem]
  );

  const selectAddress = useCallback((res: any) => {
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return list.find((a: any) => a?.is_default) || list[0] || null;
  }, []);

  const checkoutQueryKey = useMemo(
    () =>
      checkoutPreviewQueryKey({
        mode,
        product_id,
        variant_id,
        qty: buyNowQty,
        use_rewards: useRewards,
      }),
    [mode, product_id, variant_id, buyNowQty, useRewards]
  );

  const {
    data: address,
    isFetching: isAddressFetching,
    error: addressError,
  } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    select: selectAddress,
  });

  const {
    data: checkoutData,
    isFetching: isCheckoutFetching,
    error: checkoutError,
  } = useQuery({
    queryKey: checkoutQueryKey,
    queryFn: async () => {
      if (mode === "buy_now") {
        return fetchBuyNowCheckout(product_id, variant_id, buyNowQty, useRewards);
      }
      return fetchCheckoutCart(useRewards);
    },
    enabled: isAuthenticated && isBuyNowValid,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    select: parseCheckoutResponse,
    retry: 1,
    throwOnError: false,
  });

  const addressLine = [
    address?.address1,
    address?.city,
    address?.state || address?.state_name,
    address?.zipcode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    const status = Number((checkoutError as any)?.response?.status);
    if (status === 401) {
      handleUnauthorized();
    }
  }, [checkoutError, handleUnauthorized]);

  useEffect(() => {
    if (!hasCheckoutStarted && (isCheckoutFetching || checkoutData || checkoutError)) {
      setHasCheckoutStarted(true);
    }
  }, [hasCheckoutStarted, isCheckoutFetching, checkoutData, checkoutError]);

  useEffect(() => {
    if (!checkoutData || items.length === 0) {
      setShowRecommendations(false);
      return undefined;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setShowRecommendations(true);
    });

    return () => task.cancel();
  }, [checkoutData, items.length]);

  useEffect(() => {
    const status = Number((addressError as any)?.response?.status);
    if (status === 401) {
      handleUnauthorized();
    }
  }, [addressError, handleUnauthorized]);

  const prevCheckoutDataRef = useRef<typeof checkoutData>(undefined);
  useEffect(() => {
    if (prevCheckoutDataRef.current === checkoutData) {
      return;
    }

    prevCheckoutDataRef.current = checkoutData;
    if (checkoutData) {
      if (!skipItemsRefresh.current) {
        setItems(Array.isArray(checkoutData.items) ? checkoutData.items : []);
      }
      skipItemsRefresh.current = false;
      setCartSummary(prev => {
        const s = checkoutData.summary;
        if (!s) return prev;
        if (
          prev.productTotal === s.productTotal &&
          prev.shippingTotal === s.shippingTotal &&
          prev.payableAmount === s.payableAmount &&
          prev.reward.redeemCoins === s.reward.redeemCoins &&
          prev.reward.earnCoins === s.reward.earnCoins
        ) return prev;
        return s;
      });
    } else {
      setItems(prev => (prev.length === 0 ? prev : []));
      setCartSummary(prev =>
        prev.productTotal === 0 &&
        prev.shippingTotal === 0 &&
        prev.payableAmount === 0 &&
        prev.reward.redeemCoins === 0 &&
        prev.reward.earnCoins === 0
          ? prev
          : emptyCheckoutSummary()
      );
    }
  }, [checkoutData]);

  const checkoutPayableAmount = useMemo(() => {
    return getCheckoutPayableAmount(cartSummary);
  }, [cartSummary]);

  const latestRedeemableCoins = Math.max(
    0,
    Number(checkoutData?.summary?.reward?.redeemCoins ?? cartSummary.reward.redeemCoins ?? 0)
  );

  if (useRewards && checkoutData) {
    lastRedeemableCoins.current = latestRedeemableCoins;
  }

  const rewardCoinsAvailable = useRewards
    ? latestRedeemableCoins
    : lastRedeemableCoins.current;

  useEffect(() => {
    if (checkoutData && useRewards && checkoutData.summary.reward.redeemCoins <= 0) {
      setUseRewards(false);
    }
  }, [checkoutData, useRewards]);

  const relatedProductId = mode === "buy_now" ? product_id : undefined;

  const checkoutItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + Math.max(1, Number(item?.quantity || 1)), 0);
  }, [items]);

  const navigateToOrderConfirm = useCallback(
    (orderId: number) => {
      console.log("🚀 Navigating to OrderConfirm with order_id:", orderId);

      try {
        // ✅ Use CommonActions.reset to completely reset navigation stack
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'Home' },
              {
                name: 'OrderConfirm',
                params: { order_id: orderId }
              }
            ],
          })
        );
        return true;
      } catch (error) {
        console.error("❌ Navigation failed with CommonActions.reset:", error);
      }

      // Fallback: Try StackActions.replace
      try {
        navigation.dispatch(
          StackActions.replace('OrderConfirm', { order_id: orderId })
        );
        return true;
      } catch (error) {
        console.error("❌ Navigation failed with StackActions.replace:", error);
      }

      // Final fallback: Direct navigate
      try {
        navigation.navigate('OrderConfirm', { order_id: orderId } as any);
        return true;
      } catch (error) {
        console.error("❌ All navigation attempts failed:", error);
      }

      return false;
    },
    [navigation]
  );

  const handlePlaceOrder = async () => {
    if (isCreatingOrder.current) {
      console.log("⏸️ Order creation already in progress (ref guard)");
      return;
    }
    let createdCartOrder = false;
    const cartSnapshot =
      mode !== "buy_now"
        ? items
          .map((item) => ({
            product_id: Number(item.product_id),
            variant_id: Number(item.variant_id),
            quantity: Number(item.quantity ?? 1),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.product_id) &&
              item.product_id > 0 &&
              Number.isFinite(item.variant_id) &&
              item.variant_id > 0
          )
        : [];

    const restoreCartAfterPaymentFailure = async () => {
      if (mode === "buy_now" || cartSnapshot.length === 0) {
        return;
      }

      try {
        const existingCart = await fetchCartItems();
        const existingItems = existingCart?.items || existingCart?.data || [];

        if (Array.isArray(existingItems) && existingItems.length > 0) {
          console.log("ℹ️ Cart already has items after payment failure, skipping restore");
          await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
          return;
        }

        for (const cartItem of cartSnapshot) {
          await addToCart(cartItem);
        }

        console.log("↩️ Cart restored after payment failure/cancel");
        await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
      } catch (restoreErr) {
        console.error("❌ Failed to restore cart after payment failure:", restoreErr);
      }
    };

    try {
      if (placing) {
        console.log("⏸️ Order placement already in progress");
        return;
      }
      isCreatingOrder.current = true;
      setPlacing(true);

      const t0 = performance.now();
      console.log("🕐 [t=0ms] Checkout tap");

      const selectedAddressId = address?.address_id ?? address?.id;
      if (!selectedAddressId) {
        isCreatingOrder.current = false;
        setPlacing(false);
        Alert.alert("Select Address", "Please select a delivery address to continue.");
        return;
      }

      console.log("📦 Creating order...", `[t=${(performance.now() - t0).toFixed(0)}ms]`);

      // Fetch latest checkout summary — uses React Query cache if data is < 30s old,
      // otherwise re-fetches to ensure expected_total matches server price.
      const latestCheckoutData = await queryClient.fetchQuery({
        queryKey: checkoutQueryKey,
        queryFn: async () => {
          if (mode === "buy_now") {
            return fetchBuyNowCheckout(product_id, variant_id, buyNowQty, useRewards);
          }
          return fetchCheckoutCart(useRewards);
        },
        staleTime: 30_000,
      });
      const latestSummary = parseCheckoutResponse(latestCheckoutData).summary;
      const expectedPrice = getCheckoutPayableAmount(latestSummary);

      console.log("🧾 Checkout expected price:", {
        expectedPrice,
        useRewards,
        productTotal: latestSummary.productTotal,
        shippingTotal: latestSummary.shippingTotal,
        payableAmount: latestSummary.payableAmount,
      });

      let orderRes;
      if (mode === "buy_now" && product_id && variant_id) {
        const buyNowOrderPayload = {
          product_id: safeToNumber(product_id),
          variant_id: safeToNumber(variant_id),
          quantity: buyNowQty,
          address_id: safeToNumber(selectedAddressId),
          expected_total: safeToNumber(expectedPrice),
          expected_redeemable: useRewards ? safeToNumber(latestSummary.reward?.redeemCoins) : 0,
          use_rewards: useRewards,
        };
        console.log("📤 Buy Now order payload:", buyNowOrderPayload);
        orderRes = await addBuyNowOrder(buyNowOrderPayload);
      } else {
        const cartOrderPayload = {
          address_id: safeToNumber(selectedAddressId),
          expected_total: safeToNumber(expectedPrice),
          expected_redeemable: useRewards ? safeToNumber(latestSummary.reward?.redeemCoins) : 0,
          use_rewards: useRewards,
        };
        console.log("📤 Cart order payload:", cartOrderPayload);
        orderRes = await addCartOrder(cartOrderPayload);
        createdCartOrder = true;
      }

      if (orderRes?.success === false) {
        isCreatingOrder.current = false;
        setPlacing(false);
        const serverMessage =
          orderRes.message ||
          orderRes.error ||
          orderRes.details ||
          "Checkout failed";
        console.error("❌ Order API returned failure:", serverMessage, orderRes);
        alert.error("Checkout Failed", String(serverMessage));
        return;
      }

      const orderId = Number(
        orderRes?.order_id ??
        orderRes?.orderId ??
        orderRes?.data?.order_id ??
        orderRes?.data?.orderId
      );

      if (!Number.isFinite(orderId) || orderId <= 0) {
        isCreatingOrder.current = false;
        setPlacing(false);
        console.log("Order ID missing");
        alert.error("Order Error", "Order ID missing. Please try again.");
        return;
      }

      const paymentAmount = expectedPrice;

      console.log("✅ Order created:", orderId, "Amount:", paymentAmount, `[t=${(performance.now() - t0).toFixed(0)}ms]`);

      // ✅ Step 2: Create Payment Order with Razorpay
      const paymentData = await createPaymentOrder(orderId, paymentAmount);
      console.log("💳 Payment order created:", paymentData, `[t=${(performance.now() - t0).toFixed(0)}ms]`);

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        order_id: paymentData.orderId,
        name: "Reward Planners",
        description: "Order Payment",
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: formatPhoneForRazorpay(user?.phone),
        },
        theme: { color: "#8665FF" },
      };

      console.log("🚀 Opening Razorpay...", `[t=${(performance.now() - t0).toFixed(0)}ms]`);
      // ✅ Step 3: Open Razorpay Checkout
      RazorpayCheckout.open(options)
        .then(async (response) => {
          console.log("💰 Payment successful:", response);

          try {
            // ✅ Step 4: Verify payment
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            console.log("🔐 Verification response:", verifyRes);

            if (isPaymentVerified(verifyRes)) {
              // ✅ Payment verified, proceed with success flow
              if (mode !== "buy_now") {
                try {
                  await deleteAllCartItems();
                  console.log("🧹 Cart cleared");
                } catch (clearErr) {
                  console.error("❌ Cart clear failed:", clearErr);
                }
              }

              isCreatingOrder.current = false;
              setPlacing(false);
              navigateToOrderConfirm(orderId);
              return;
            }

            // ❌ Verification failed, check status with retries
            console.log("⚠️ Verification failed, checking payment status...");
            let statusRes = await checkPaymentStatus(orderId);
            console.log("📊 Payment status check:", statusRes);

            if (isPaymentVerified(statusRes)) {
              // ✅ Status check passed
              if (mode !== "buy_now") {
                try {
                  await deleteAllCartItems();
                  console.log("🧹 Cart cleared after status check");
                } catch (clearErr) {
                  console.error("❌ Cart clear failed:", clearErr);
                }
              }

              isCreatingOrder.current = false;
              setPlacing(false);
              navigateToOrderConfirm(orderId);
              return;
            }

            // ❌ Final failure
            console.error("❌ Payment verification failed after retries");
            await restoreCartAfterPaymentFailure();
            isCreatingOrder.current = false;
            setPlacing(false);
            alert.error("Payment Verification Failed", "Your payment could not be verified. Please contact support if amount was debited.");

          } catch (verifyError) {
            console.error("❌ Payment verification error:", verifyError);
            await restoreCartAfterPaymentFailure();
            isCreatingOrder.current = false;
            setPlacing(false);
            alert.error("Payment Error", "Unable to verify payment. Please check your order status.");
          }
        })
        .catch(async (error: any) => {
          isCreatingOrder.current = false;
          setPlacing(false);
          console.error("❌ Payment cancelled/failed:", error);

          const errorCode = String(error?.code ?? "");
          let errorText = error?.error?.description || error?.description || error?.message || "";

          // Try to parse nested error descriptions
          if (typeof error?.description === "string" && error.description.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(error.description);
              errorText = parsed?.error?.description || parsed?.error?.reason || errorText;
            } catch {
              // Keep fallback text if parsing fails
            }
          }

          if (!errorText || String(errorText).toLowerCase() === "undefined") {
            errorText = "Payment failed during authentication. Please retry.";
          }

          const isUserCancelled = errorCode === "0" ||
            errorCode === "1" ||
            /cancel|cancelled|dismiss|closed|back/i.test(String(errorText));

          if (isUserCancelled) {
            console.log("👤 User cancelled payment");
            await restoreCartAfterPaymentFailure();
            alert.warning("Payment Cancelled", "You cancelled the payment. Your cart has been restored.");
            return;
          }

          // Payment failed
          await restoreCartAfterPaymentFailure();
          alert.error("Payment Failed", String(errorText));
        });
    } catch (e: any) {
      isCreatingOrder.current = false;
      setPlacing(false);

      if (Number(e?.response?.status) === 401) {
        await handleUnauthorized();
        return;
      }

      console.error("❌ Order/Payment failed:", e?.response?.data || e?.message || e);

      if (createdCartOrder) {
        await restoreCartAfterPaymentFailure();
      }

      const serverMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.details ||
        "Failed to place order";
      alert.error("Error", String(serverMessage));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      alertRef.current.info("Login Required", "Please login to continue checkout.");
      navigation.goBack();
    }
  }, [isAuthenticated, navigation]);

  const increaseQty = async (item: any) => {
    const newQty = item.quantity + 1;

    if (Number.isFinite(Number(item?.stock)) && newQty > Number(item.stock)) {
      alert.warning("Stock Limit", "Only limited stock available");
      return;
    }

    if (mode === "buy_now") {
      setBuyNowQty(newQty);
      setItems((prev) => prev.map((i) => ({ ...i, quantity: newQty })));
      return;
    }

    // Optimistic update before API call
    setItems(p =>
      p.map(i =>
        i.cart_item_id === item.cart_item_id
          ? { ...i, quantity: newQty }
          : i
      )
    );
    try {
      await updateCartQty(item.cart_item_id, newQty);
      skipItemsRefresh.current = true;
      await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
    } catch {
      // Revert on failure
      setItems(p =>
        p.map(i =>
          i.cart_item_id === item.cart_item_id
            ? { ...i, quantity: item.quantity }
            : i
        )
      );
      alert.error("Update Failed", "Could not update quantity. Please try again.");
    }
  };

  const decreaseQty = async (item: any) => {
    if (item.quantity <= 1) return;
    const newQty = item.quantity - 1;

    if (mode === "buy_now") {
      setBuyNowQty(Math.max(1, newQty));
      setItems((prev) => prev.map((i) => ({ ...i, quantity: Math.max(1, newQty) })));
      return;
    }

    // Optimistic update before API call
    setItems(p => p.map(i => i.cart_item_id === item.cart_item_id ? { ...i, quantity: newQty } : i));
    try {
      await updateCartQty(item.cart_item_id, newQty);
      skipItemsRefresh.current = true;
      await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
    } catch  {
      // Revert on failure
      setItems(p => p.map(i => i.cart_item_id === item.cart_item_id ? { ...i, quantity: item.quantity } : i));
      alert.error("Update Failed", "Could not update quantity. Please try again.");
    }
  };

  const removeItem = async (item: any) => {
    setItems(p => p.filter(i => i.cart_item_id !== item.cart_item_id));
    try {
      await removeFromCart(item.cart_item_id);
    } catch (err) {
      console.error("Error removing item from cart:", err);
      // Restore item on error
      setItems(p => [...p, item]);
    }
  };

  const removeAll = async () => {
    setItems([]);
    await deleteAllCartItems();
    await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
  };

  const checkoutDataItems = Array.isArray(checkoutData?.items) ? checkoutData.items : [];
  const checkoutHasItemsPendingSync = checkoutDataItems.length > 0 && items.length === 0;

  const loading =
    isAuthenticated &&
    (
      !isBuyNowValid ||
      !hasCheckoutStarted ||
      isCheckoutFetching ||
      isAddressFetching ||
      (hasCheckoutStarted && checkoutData === undefined) ||
      checkoutHasItemsPendingSync ||
      (mode === "buy_now" && isBuyNowValid && items.length === 0 && !checkoutError)
    );

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <View style={styles.checkoutSkeletonCard}>
          <SkeletonBox pulse={pulse} width="60%" height={24} borderRadius={10} />
          <SkeletonBox pulse={pulse} width="100%" height={84} borderRadius={14} style={styles.checkoutSkeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={14} style={styles.checkoutSkeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={14} style={styles.checkoutSkeletonGap} />
          <SkeletonBox pulse={pulse} width="88%" height={50} borderRadius={12} style={styles.checkoutSkeletonGapLg} />
        </View>
      </View>
    );
  }

if (
  items.length === 0 &&
  checkoutDataItems.length === 0 &&
  hasCheckoutStarted &&
  !isCheckoutFetching &&
  !isAddressFetching &&
  checkoutData !== undefined &&
  mode !== "buy_now"
) {    return (
      <View style={styles.container}>
        <ProductHeadColor
          title="Cart"
          onBackPress={() => navigation.goBack()}
          onSearchPress={() => Alert.alert("Search", "Open search")}
        />
        <EmptyCart
          message="Your cart is empty. Add products to continue."
          onBrowse={() => navigation.navigate("Home")}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProductHeadColor
        title="Checkout"
        onBackPress={() => navigation.goBack()}
        onSearchPress={() => Alert.alert("Search", "Open search")}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom }]}
      >
        <View style={styles.scrollPadding}>
          {/* Step Counter */}
          <View style={styles.stepRow}>
            <Step status="done" label="Address" />
            <Line />
            <Step status="current" label="Order Summary" />
            <Line />
            <Step status="upcoming" label="Payment" />
          </View>

          {/* Address Card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="home-variant"
                size={30}
                color="#2D2A2A"
                style={styles.homeIcon}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.title}>
                    Delivering to {address?.contact_name || "User"}
                  </Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("AddressSelect")}>
                    <Text style={styles.change}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.address}>
                  {address
                    ? addressLine || "No address selected"
                    : "No address selected"}
                </Text>
              </View>
            </View>
          </View>

          {/* Select/Remove Row */}
          {items.length > 0 && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={removeAll}>
                <Text style={styles.actionDanger}>Remove all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cart Items */}
          {items.map((item, index) => (
            <CheckoutItemCart
              key={String(
                item.cart_item_id ??
                `${item.product_id ?? "p"}-${item.variant_id ?? "v"}-${index}`
              )}
              item={item}
              onIncrease={() => increaseQty(item)}
              onDecrease={() => decreaseQty(item)}
              onRemove={() => removeItem(item)}
              onPress={() =>
                Number(item?.product_id) > 0 &&
                navigation.navigate("ProductDescription", {
                  productId: Number(item.product_id),
                })
              }

            />
          ))}

          {/* Coupons */}
          {/* <View style={styles.wrapper}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Coupons and Offers</Text>
              <TouchableOpacity onPress={() => setShowAllCoupons((p) => !p)}>
                <Text style={styles.viewAllText}>{showAllCoupons ? "Hide" : "View All"}</Text>
              </TouchableOpacity>
            </View>

            <CouponsSection coupons={showAllCoupons ? COUPONS : COUPONS.slice(0, 1)} />
          </View> */}

          <BillDetailsCard
            cartTotal={cartSummary.productTotal}
            finalPayable={cartSummary.payableAmount}
            totalRedeemed={cartSummary.reward.redeemCoins}
            totalRewardEarn={cartSummary.reward.earnCoins}
            shippingCharges={cartSummary.shippingTotal}
            shippingLabel="Shipping Fee"
            bagDiscount={0}
            handlingFees={0}
            showHandlingFees
            rewardCoinsAvailable={rewardCoinsAvailable}
            useRewards={useRewards}
            onUseRewardsChange={setUseRewards}
          />

          {/* <PaymentOptionsUI /> */}
        </View>

        {showRecommendations && (
          <>
            <RecommendedProducts />
            {relatedProductId ? (
              <View style={styles.relatedSection}>
                <Text style={styles.relatedTitle}>Related Products</Text>
                <ProductGrid
                  key={`related-${relatedProductId}`}
                  useFlatList={false}
                  relatedProductId={relatedProductId}
                  take={8}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <OrderProcedbutton
        total={checkoutPayableAmount}
        count={checkoutItemCount}
        loading={placing}
        onPlaceOrder={handlePlaceOrder}
        bottomOffset={0}
        onLayout={stickyCTA.onCtaLayout}
      />
    </View>
  );
}

/* Step circle */
const Step = ({ status, label }: { status: StepStatus; label: string }) => {
  const isDone = status === "done";
  const isCurrent = status === "current";

  return (
    <View style={styles.stepWrap}>
      {isDone ? (
        <LinearGradient colors={[PURPLE_1, PURPLE_2]} style={styles.stepCircle}>
          <Text style={styles.stepTick}>✓</Text>
        </LinearGradient>
      ) : isCurrent ? (
        <View style={styles.stepCurrentOuter}>
          <View style={styles.stepCurrentInner} />
        </View>
      ) : (
        <View style={styles.stepUpcoming} />
      )}

      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
};

/* Connecting line */
const Line = () => <View style={styles.line} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingTop: 14, paddingBottom: 24 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepWrap: { alignItems: "center", width: 90 },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  stepTick: { color: "#fff", fontWeight: "800", fontSize: 12, marginTop: -1 },
  stepCurrentOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PURPLE_1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCurrentInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: PURPLE_1 },
  stepUpcoming: { width: 22, height: 22, borderRadius: 11, backgroundColor: GREY_DOT },
  stepLabel: { marginTop: 6, fontSize: 12, color: TEXT_GREY, fontWeight: "500" },
  stepLabelActive: { color: "#111", fontWeight: "700" },
  line: {
    height: 3,
    width: 42,
    borderRadius: 2,
    backgroundColor: GREY_LINE,
    marginHorizontal: 2,
    marginTop: -12,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  checkoutSkeletonCard: {
    width: '100%',
  },
  checkoutSkeletonGap: {
    marginTop: 14,
  },
  checkoutSkeletonGapLg: {
    marginTop: 22,
  },
  card: {
    backgroundColor: "#FFFBF5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    padding: 14,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  homeIcon: { marginTop: 2, marginRight: 10 },
  cardContent: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { flex: 1, fontSize: 14, fontWeight: "800", color: "#111", paddingRight: 10 },
  change: { fontSize: 14, fontWeight: "800", color: PURPLE_1 },
  address: { marginTop: 6, fontSize: 13, color: "#555", lineHeight: 18 },
  actionsRow: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3585FF",
  },
  actionDanger: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3585FF",
  },

  wrapper: { paddingHorizontal: 14, marginTop: 10 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  headerText: { fontSize: 15, fontWeight: "700", color: "#111" },

  viewAllText: { fontSize: 14, fontWeight: "700", color: "#3585FF" },
  scrollPadding: { paddingHorizontal: 16, },
  relatedSection: {
    marginTop: 10,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
});
