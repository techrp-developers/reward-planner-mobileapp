import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

export interface BillCategory {
  operator_category_name: string;
  operator_category_id: number;
  operator_category_group: string;
  status: string;
}

export interface BillLocation {
  operator_location_name: string;
  operator_location_id: string;
  abbreviation: string;
}

export interface Operator {
  operator_id: number;
  name: string;
  billFetchResponse: number;
  high_commission_channel: number;
  kyc_required: number;
  operator_category: number;
  location_id: number;
}

export const fetchBillsCategories = async (): Promise<BillCategory[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/v1/bills/categories`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error: any) {
    console.error("Fetch Categories Error:", error?.response?.data || error);
    throw error;
  }
};

export const fetchBillLocations = async (): Promise<BillLocation[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/v1/bills/locations`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error: any) {
    console.error(
      "Fetch Locations Error:",
      error?.response?.data || error
    );
    throw error;
  }
};

export const fetchOperators = async (
  categoryId: number
): Promise<Operator[]> => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/operators?category_id=${categoryId}`
    );

    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error: any) {
    console.error(
      "Fetch Operators Error:",
      error?.response?.data || error
    );
    throw error;
  }
};

export interface OperatorField {
  error_message: string;
  param_label: string;
  regex: string;
  param_name: string;
  param_id: string;
  param_type: string;
}

export interface OperatorDetails {
  operator_name: string;
  operator_id: number;
  fetchBill: number;
  BBPS: number;
  data: OperatorField[];
}

export const fetchOperatorDetails = async (
  operatorId: number
): Promise<OperatorDetails> => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/operator/${operatorId}`
    );

    return {
      operator_name: res.data?.operator_name || "",
      operator_id: res.data?.operator_id || 0,
      fetchBill: res.data?.fetchBill || 0,
      BBPS: res.data?.BBPS || 0,
      data: Array.isArray(res.data?.data) ? res.data.data : [],
    };
  } catch (error: any) {
    console.error("Operator Details Error:", error?.response?.data || error);
    throw error;
  }
};

export const fetchBill = async (
  payload: Record<string, string | number | undefined>,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const response = await axios.post(
      `${API_BASE_URL}/v1/bills/fetch-bill`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.log(
      "Fetch Bill Error:",
      error?.response?.data || error?.message
    );

    if (error?.response?.data) {
      return error.response.data;
    }

    throw error?.response?.data || error?.message;
  }
};

export interface RechargePlan {
  planId: string;
  amount: string;
  validity: string;
  description: string;
  [key: string]: any;
}

export interface RechargePlansResponse {
  status: number;
  responseTypeId: number;
  message: string;
  operatorId: string;
  circleId: string;
  mobile: string;
  count: number;
  plans: RechargePlan[];
}

export const fetchRechargePlans = async (
  mobile: string,
  operatorId: number | string,
  circleId: number | string,
) => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/recharge/plans`,
      {
        params: {
          mobile,
          operator_id: operatorId,
          circle_id: circleId,
        },
      }
    );

    return {
      success: res.data?.success ?? false,
      message: res.data?.message ?? '',
      data: {
        status: res.data?.data?.status ?? 0,
        responseTypeId: res.data?.data?.responseTypeId ?? 0,
        message: res.data?.data?.message ?? '',
        operatorId: res.data?.data?.operatorId ?? '',
        circleId: res.data?.data?.circleId ?? '',
        mobile: res.data?.data?.mobile ?? '',
        count: res.data?.data?.count ?? 0,
        plans: Array.isArray(res.data?.data?.plans)
          ? res.data.data.plans
          : [],
      } as RechargePlansResponse,
    };
  } catch (error: any) {
    console.error(
      'Recharge Plans Error:',
      error?.response?.data || error
    );

    throw error?.response?.data || error;
  }
};

export type BillPayCreateOrderPayload = {
  operator_id: string;
  utility_acc_no?: string;
  circle_id?: string;
  plan_id?: string;
  bill_fetch_id?: number | string;
  sender_name?: string;
};

export const createBillPayOrder = async (
  payload: BillPayCreateOrderPayload,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await axios.post(
      `${API_BASE_URL}/v1/bill-pay/create-order`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("Create Bill Pay Order Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const verifyBillPayPayment = async (
  payload: Record<string, any>,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await axios.post(
      `${API_BASE_URL}/v1/bill-pay/verify-payment`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      }
    );

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("Verify Bill Pay Payment Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};

export const checkBillTransactionStatus = async (
  transactionId: string | number,
  token?: string,
) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/check-status/${transactionId}`,
      { headers: authHeaders }
    );

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("Check Bill Status Error:", error?.response?.data || error);
    throw error?.response?.data || error;
  }
};
