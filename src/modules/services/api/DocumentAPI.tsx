import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../ecommerce/api/AuthAPI";
import { BASE_API_URL } from "./api";

const SERVICE_API_BASE = BASE_API_URL.includes('/v1')
  ? BASE_API_URL
  : `${BASE_API_URL.replace(/\/$/, '')}/v1`;

type RequiredDocumentItem = {
  service_document_id?: number;
  document_id?: number;
  id?: number;
  document_name?: string;
  is_mandatory?: number | boolean;
  uploaded?: boolean;
  file_path?: string | null;
};

const getErrorMessage = (error: any, fallback: string) => {
  return String(
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.message ||
    fallback,
  );
};


// ==============================
// 📄 1. Get Required Documents
// ==============================
export const getRequiredDocuments = async (order_id: number) => {
  try {
    const headers = await getAuthHeaders();
    const candidates = [
      `${SERVICE_API_BASE}/service-order-documents/documents/${order_id}`,
      `${SERVICE_API_BASE}/service-order-documents/documents/${order_id}/`,
    ];

    for (const url of candidates) {
      try {
        const res = await axios.get(url, { headers });
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];

        return {
          ...res.data,
          data: list as RequiredDocumentItem[],
        };
      } catch (innerError: any) {
        if (Number(innerError?.response?.status) === 404) {
          continue;
        }
        throw innerError;
      }
    }

    return { success: true, data: [] as RequiredDocumentItem[] };

  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("❌ Get Documents Error:", error?.response || error);
    throw new Error(getErrorMessage(error, 'Unable to fetch required documents'));
  }
};


// ==============================
// 📤 2. Upload Document
// ==============================
export const uploadServiceDocument = async ({
  order_id,
  document_id,
  file,
}: {
  order_id: number;
  document_id: number;
  file: any;
}) => {
  try {
    const headers = await getAuthHeaders();

    const formData = new FormData();

    const serviceDocumentId = Number(document_id);
    if (!Number.isFinite(serviceDocumentId) || serviceDocumentId <= 0) {
      throw new Error('Invalid service document id');
    }

    if (!file?.uri) {
      throw new Error('Invalid file payload');
    }

    const lowerUri = String(file.uri || '').toLowerCase();
    const mimeType =
      file.type ||
      (lowerUri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    // Keep both keys for compatibility; backend expects service_document_id mapping.
    formData.append("document_id", String(serviceDocumentId));
    formData.append("service_document_id", String(serviceDocumentId));

    const normalizedName =
      file?.fileName ||
      file?.name ||
      (mimeType === 'application/pdf' ? `doc_${Date.now()}.pdf` : `doc_${Date.now()}.jpg`);

    formData.append("file", {
      uri: file.uri,
      type: mimeType,
      name: normalizedName,
    } as any);

    console.log('📤 Upload document payload:', {
      order_id,
      document_id: serviceDocumentId,
      service_document_id: serviceDocumentId,
      uri: file.uri,
      type: mimeType,
      name: normalizedName,
      size: file?.fileSize,
    });

    const res = await axios.post(
      `${SERVICE_API_BASE}/service-orders/upload-document/${order_id}`,
      formData,
      {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;

  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("❌ Upload Document Error:", error?.response || error);
    throw new Error(getErrorMessage(error, 'Unable to upload document'));
  }
};


// ==============================
// ✅ 3. Submit Documents
// ==============================
export const submitServiceDocuments = async (order_id: number) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.post(
      `${SERVICE_API_BASE}/service-orders/submit-documents/${order_id}`,
      {},
      { headers }
    );

    return res.data;

  } catch (error: any) {
    if (error?.response?.status === 401) {
      await clearAuthToken();
    }

    console.error("❌ Submit Documents Error:", error?.response || error);
    throw new Error(getErrorMessage(error, 'Unable to submit documents'));
  }
};