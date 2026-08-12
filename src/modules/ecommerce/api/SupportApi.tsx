// SupportApi.tsx

import api from "../../common/auth/api/axios";

export type SupportCategory = {
  category_id: number;
  name: string;
};

export type SupportTicket = {
  ticket_id: number;
  subject: string;
  description: string;
  category_name: string;
  status: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
};

export type SupportRecentOrderItem = {
  order_item_id: number;
  order_id: number;
  product_id?: number;
  variant_id?: number;
  quantity?: number;
  price?: number;
  final_price?: number;
  product_name?: string;
  brand_name?: string;
};

export type SupportRecentEcommerceOrder = {
  order_id: number;
  order_ref: string;
  status?: string;
  created_at?: string;
  items: SupportRecentOrderItem[];
};

export type SupportRecentServiceOrder = {
  id: number;
  order_ref: string;
  status?: string;
  created_at?: string;
  service_name?: string;
  variant_name?: string;
};

export type CreateSupportTicketPayload = {
  subject: string;
  description: string;
  category_id: number;
  product_id?: number;
  product_name?: string;
  attachment?: {
    uri: string;
    type?: string;
    fileName?: string;
  } | null;
};

type SupportCategoriesResponse = {
  success: boolean;
  data: SupportCategory[];
};

type CreateSupportTicketResponse = {
  success: boolean;
  message: string;
  data: any;
};

type SupportTicketsResponse = {
  success: boolean;
  message?: string;
  data: SupportTicket[];
};

type SupportRecentOrdersResponse = {
  success: boolean;
  message?: string;
  data: {
    user_id?: number;
    ecommerce_orders: SupportRecentEcommerceOrder[];
    service_orders: SupportRecentServiceOrder[];
  };
};

const SUPPORT_CATEGORIES_ENDPOINT = "/v1/support/categories";
const CREATE_SUPPORT_TICKET_ENDPOINT = "/v1/support/create-ticket";
const SUPPORT_TICKETS_ENDPOINT = "/v1/support/my-tickets";
const SUPPORT_RECENT_ORDERS_ENDPOINT = "/v1/support/recent-orders";

const normalizeTicketStatus = (value: any) => {
  const normalized = String(value || "open")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "inprogress") {
    return "in_progress";
  }

  return normalized || "open";
};

const mapSupportTicket = (item: any): SupportTicket | null => {
  const ticketId = Number(item?.ticket_id ?? item?.id ?? item?.support_id);
  const subject = String(
    item?.subject || item?.title || item?.issue_subject || ""
  ).trim();

  if (!ticketId || !subject) {
    return null;
  }

  return {
    ticket_id: ticketId,
    subject,
    description: String(
      item?.description || item?.message || item?.issue_description || ""
    ).trim(),
    category_name: String(
      item?.category_name || item?.category?.name || item?.category || "General"
    ).trim(),
    status: normalizeTicketStatus(
      item?.status || item?.status_name || item?.ticket_status
    ),
    attachment_url: item?.attachment_url
      ? String(item.attachment_url).trim()
      : undefined,
    created_at: String(
      item?.created_at || item?.createdAt || item?.date || ""
    ).trim(),
    updated_at: String(
      item?.updated_at || item?.updatedAt || item?.created_at || item?.date || ""
    ).trim(),
  };
};

// ============================ GET SUPPORT CATEGORIES ============================

export const fetchSupportCategories =
  async (): Promise<SupportCategoriesResponse> => {
  try {
    const res = await api.get(SUPPORT_CATEGORIES_ENDPOINT);

    return {
      success: Boolean(res?.data?.success),
      data: Array.isArray(res?.data?.data)
        ? res.data.data.map((item: any) => ({
            category_id: Number(item?.category_id),
            name: String(item?.name || ""),
          })).filter((item: SupportCategory) => item.category_id && item.name)
        : [],
    };
  } catch (error: any) {
    console.error("Support categories error", error);

    return {
      success: false,
      data: [],
    };
  }
};

// ============================ CREATE SUPPORT TICKET ============================

export const createSupportTicket = async (
  payload: CreateSupportTicketPayload
): Promise<CreateSupportTicketResponse> => {
  try {
    const formData = new FormData();

    formData.append("subject", payload.subject);
    formData.append("description", payload.description);
    formData.append("category_id", String(payload.category_id));

    if (payload.product_id) {
      formData.append("product_id", String(payload.product_id));
    }

    if (payload.product_name) {
      formData.append("product_name", payload.product_name);
    }

    if (payload.attachment?.uri) {
      formData.append("attachment", {
        uri: payload.attachment.uri,
        type: payload.attachment.type || "image/jpeg",
        name: payload.attachment.fileName || `support-${Date.now()}.jpg`,
      } as any);
    }

    const res = await api.post(
      CREATE_SUPPORT_TICKET_ENDPOINT,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      success: Boolean(res?.data?.success),
      message:
        res?.data?.message ||
        "Ticket created successfully",
      data: res?.data,
    };
  } catch (error: any) {
    console.error("Create support ticket error", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to create support ticket",
      data: null,
    };
  }
};

// ============================ GET SUPPORT TICKETS ============================

export const fetchSupportTickets =
  async (): Promise<SupportTicketsResponse> => {
  try {
    const res = await api.get(SUPPORT_TICKETS_ENDPOINT);
    const rows = Array.isArray(res?.data?.data) ? res.data.data : [];

    return {
      success: Boolean(res?.data?.success),
      message: String(res?.data?.message || ""),
      data: rows
        .map(mapSupportTicket)
        .filter((item: SupportTicket | null): item is SupportTicket => Boolean(item)),
    };
  } catch (error: any) {
    console.error("Support tickets error", error);

    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to load support tickets",
      data: [],
    };
  }
};

export const fetchSupportRecentOrders =
  async (): Promise<SupportRecentOrdersResponse> => {
  try {
    const res = await api.get(SUPPORT_RECENT_ORDERS_ENDPOINT);
    const payload = res?.data?.data || {};

    const ecommerceOrders = Array.isArray(payload?.ecommerce_orders)
      ? payload.ecommerce_orders
          .map((item: any): SupportRecentEcommerceOrder | null => {
            const orderId = Number(item?.order_id);

            if (!orderId) {
              return null;
            }

            const items = Array.isArray(item?.items)
              ? item.items
                  .map((child: any): SupportRecentOrderItem | null => {
                    const orderItemId = Number(child?.order_item_id);

                    if (!orderItemId) {
                      return null;
                    }

                    return {
                      order_item_id: orderItemId,
                      order_id: orderId,
                      product_id: child?.product_id
                        ? Number(child.product_id)
                        : undefined,
                      variant_id: child?.variant_id
                        ? Number(child.variant_id)
                        : undefined,
                      quantity: child?.quantity
                        ? Number(child.quantity)
                        : undefined,
                      price: child?.price ? Number(child.price) : undefined,
                      final_price: child?.final_price
                        ? Number(child.final_price)
                        : undefined,
                      product_name: child?.product_name
                        ? String(child.product_name).trim()
                        : undefined,
                      brand_name: child?.brand_name
                        ? String(child.brand_name).trim()
                        : undefined,
                    };
                  })
                  .filter(
                    (
                      child: SupportRecentOrderItem | null,
                    ): child is SupportRecentOrderItem => Boolean(child),
                  )
              : [];

            return {
              order_id: orderId,
              order_ref: String(item?.order_ref || `Order #${orderId}`).trim(),
              status: item?.status ? String(item.status).trim() : undefined,
              created_at: item?.created_at
                ? String(item.created_at).trim()
                : undefined,
              items,
            };
          })
          .filter(
            (
              item: SupportRecentEcommerceOrder | null,
            ): item is SupportRecentEcommerceOrder => Boolean(item),
          )
      : [];

    const serviceOrders = Array.isArray(payload?.service_orders)
      ? payload.service_orders
          .map((item: any): SupportRecentServiceOrder | null => {
            const id = Number(item?.id);

            if (!id) {
              return null;
            }

            return {
              id,
              order_ref: String(item?.order_ref || `Service #${id}`).trim(),
              status: item?.status ? String(item.status).trim() : undefined,
              created_at: item?.created_at
                ? String(item.created_at).trim()
                : undefined,
              service_name: item?.service_name
                ? String(item.service_name).trim()
                : undefined,
              variant_name: item?.variant_name
                ? String(item.variant_name).trim()
                : undefined,
            };
          })
          .filter(
            (
              item: SupportRecentServiceOrder | null,
            ): item is SupportRecentServiceOrder => Boolean(item),
          )
      : [];

    return {
      success: Boolean(res?.data?.success),
      message: String(res?.data?.message || ""),
      data: {
        user_id: payload?.user_id ? Number(payload.user_id) : undefined,
        ecommerce_orders: ecommerceOrders,
        service_orders: serviceOrders,
      },
    };
  } catch (error: any) {
    console.error("Support recent orders error", error);

    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to load recent orders",
      data: {
        ecommerce_orders: [],
        service_orders: [],
      },
    };
  }
};
