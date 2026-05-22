import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../ecommerce/api/AuthAPI";
import { BASE_API_URL } from "./api";


// ==============================
// 🧾 1. Get My Orders
// ==============================
export const getMyServiceOrders = async () => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/my-orders`,
      { headers }
    );

    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get My Orders Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};


// ==============================
// 📦 2. Get Order Details
// ==============================
export const getServiceOrderDetails = async (order_id: number) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/order-details/${order_id}`,
      { headers }
    );

    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get Order Details Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};


// ==============================
// 💳 3. Create Payment Order
// ==============================
export const createServiceOrderPayment = async (parent_order_id: string) => {
  try {
    const headers = await getAuthHeaders();

    if (!parent_order_id || parent_order_id.length < 10) {
      throw new Error("Invalid parent_order_id (must be UUID)");
    }

    console.log("📤 Creating payment order:", parent_order_id);

    const res = await axios.post(
      `${BASE_API_URL}/service-orders/create-order`,
      { parent_order_id },
      { headers }
    );

    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Payment Order Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};


// ==============================
// ✅ 4. Verify Service Payment
// ==============================
export const verifyServicePayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  parent_order_id: string;
}) => {
  try {
    const headers = await getAuthHeaders();

    console.log("🔐 Verifying service payment:", {
      parent_order_id: payload.parent_order_id,
      razorpay_order_id: payload.razorpay_order_id,
    });

    const res = await axios.post(
      `${BASE_API_URL}/service-orders/verify-payment`,
      payload,
      { headers }
    );

    console.log("✅ Payment verified:", res.data);
    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Verify Service Payment Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      data: error?.response?.data,
    });
    throw error?.response?.data || error;
  }
};


// ==============================
// 📊 5. Check Service Payment Status
// ==============================
export const checkServicePaymentStatus = async (parent_order_id: string) => {
  try {
    const headers = await getAuthHeaders();

    console.log("📊 Checking service payment status for:", parent_order_id);

    const res = await axios.get(
      `${BASE_API_URL}/service-orders/payment-status/${parent_order_id}`,
      { headers }
    );

    console.log("📊 Payment status:", res.data);
    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Check Payment Status Error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
    });
    throw error?.response?.data || error;
  }
};