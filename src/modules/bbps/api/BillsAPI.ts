import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

export interface BillCategory {
  operator_category_name: string;
  operator_category_id: number;
  operator_category_group: string;
  status: string;
}

export interface Operator {
  operator_id: number;
  name: string;
}

export type OperatorGrouped = Record<string, Operator[]>;

export const fetchBillsCategories = async (): Promise<BillCategory[]> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/v1/bills/categories`);
    return res.data?.data || [];
  } catch (error: any) {
    console.error("❌ Fetch Categories Error:", error?.response || error);
    throw error;
  }
};

/**
 * Fetch operators grouped by state for a given category
 * @param categoryId The category ID to fetch operators for
 * @returns Operators grouped by state
 */
export const fetchOperatorsGrouped = async (categoryId: number): Promise<OperatorGrouped> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/v1/bills/operators-grouped?category_id=${categoryId}`);
    return res.data?.data || {};
  } catch (error: any) {
    console.error("❌ Fetch Operators Grouped Error:", error?.response || error);
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

    return res.data?.data || [];
  } catch (error: any) {
    console.error("❌ Fetch Operators Error:", error?.response || error);
    throw error;
  }
};


export interface OperatorParam {
  param_label: string;
  param_name: string;
  regex: string;
  error_message: string;
  param_type?: string;
}

export interface OperatorDetails {
  operator_id: number;
  operator_name: string;
  fetchBill: number;
  BBPS: number;
  data: OperatorParam[];
}

export const fetchOperatorDetails = async (
  operatorId: number
): Promise<OperatorDetails> => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/v1/bills/operator/${operatorId}`
    );

    const payload = res.data?.data || res.data;
    return {
      ...payload,
      data: Array.isArray(payload?.data) ? payload.data : [],
    } as OperatorDetails;
  } catch (error: any) {
    console.error("❌ Operator Details Error:", error?.response || error);
    throw error;
  }
};




export const fetchBill = async (
  payload: Record<string, any>,
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
      "❌ Fetch Bill Error:",
      error?.response?.data || error?.message
    );
    throw error?.response?.data || error?.message;
  }
};
export const fetchBillDetails = async (payload: {
  operator_id: string;
  consumer_number: string;
  mobile_number?: string;
}, token?: string) => {
  try {
    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : await getAuthHeaders();

    // --- Log Request Details ---
    console.log("--- 🚀 Fetch Bill Request ---");
    console.log("URL:", `${API_BASE_URL}/v1/bills/check-customer-number`);
    console.log("Payload:", payload);
    console.log("Headers:", authHeaders);

    const res = await axios.post(
      `${API_BASE_URL}/v1/bills/check-customer-number`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        timeout: 15000,
      }
    );

    // --- Log Success Response ---
    console.log("--- ✅ Fetch Bill Success ---");
    console.log("Response Data:", res.data);

    return res.data;
  } catch (error: any) {
    // --- Log Error Details ---
    console.log("--- ❌ Fetch Bill Error ---");
    
    if (error.response) {
      // The server responded with a status code (400, 401, 500, etc.)
      console.log("Status:", error.response.status);
      console.log("Error Data:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received (Network Error)
      console.log("No Response Received (Network/Timeout issue)");
      console.log("Request Object:", error.request);
    } else {
      // Something happened in setting up the request
      console.log("Message:", error.message);
    }

    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    throw error?.response?.data || { message: "Something went wrong" };
  }
};