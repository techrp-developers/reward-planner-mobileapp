import axios from "axios";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

export const addWishlist = async (productId: number, variantId?: number) => {
  const headers = await getAuthHeaders();
  const parsedProductId = Number(productId);
  const parsedVariantId = Number(variantId ?? productId);

  if (!parsedProductId || Number.isNaN(parsedProductId)) {
    throw new Error("Invalid product id");
  }

  const candidates = [
    {
      product_id: parsedProductId,
      variant_id:
        parsedVariantId && !Number.isNaN(parsedVariantId)
          ? parsedVariantId
          : undefined,
    },
    {
      product_id: parsedProductId,
      variant_id: parsedProductId,
    },
    {
      product_id: parsedProductId,
    },
  ];

  let lastError: any = null;

  for (const body of candidates) {
    try {
      const res = await axios.post(`${API_BASE_URL}/v1/wishlist/add-wishlist`, body, { headers });
      return res.data;
    } catch (error: any) {
      lastError = error;

      const status = Number(error?.response?.status || 0);
      const message = String(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          ""
      ).toLowerCase();

      if (
        status === 400 &&
        (message.includes("already") || message.includes("exist") || message.includes("duplicate"))
      ) {
        return { success: true, alreadyAdded: true };
      }

      if (status !== 400) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const checkWishlist = async (productId: number, variantId?: number) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(
    `${API_BASE_URL}/v1/wishlist/check/${productId}/${variantId ?? productId}`,
    { headers }
  );
  return res.data;
};

export const isWishlistPresent = (response: any) => {
  const present =
    response?.isPresent ??
    response?.exists ??
    response?.inWishlist ??
    response?.is_wishlisted ??
    response?.data?.isPresent ??
    response?.data?.exists ??
    response?.data?.inWishlist ??
    response?.data?.is_wishlisted ??
    false;

  return Boolean(present);
};

export const getWishlist = async () => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE_URL}/v1/wishlist/get-wishlist`, { headers });
  return res.data;
};

export const removeWishlist = async (payload: {
  wishlistId?: number;
  productId?: number;
  variantId?: number;
}) => {
  const headers = await getAuthHeaders();
  const parsedProductId = Number(payload.productId);
  const parsedVariantId = Number(payload.variantId ?? payload.productId);
  const parsedWishlistId = Number(payload.wishlistId);

  const canUseProductVariant =
    !!parsedProductId &&
    !Number.isNaN(parsedProductId) &&
    !!parsedVariantId &&
    !Number.isNaN(parsedVariantId);
  const canUseWishlistId = !!parsedWishlistId && !Number.isNaN(parsedWishlistId);

  const body = {
    wishlist_id: canUseWishlistId ? parsedWishlistId : undefined,
    product_id: canUseProductVariant ? parsedProductId : undefined,
    variant_id: canUseProductVariant ? parsedVariantId : undefined,
  };

  const attempts: Array<() => Promise<any>> = [
    () =>
      canUseProductVariant
        ? axios.delete(
            `${API_BASE_URL}/v1/wishlist/remove/${parsedProductId}/${parsedVariantId}`,
            { headers }
          )
        : Promise.reject(new Error("missing product/variant ids")),
    () =>
      canUseWishlistId
        ? axios.delete(`${API_BASE_URL}/v1/wishlist/remove-wishlist/${parsedWishlistId}`, {
            headers,
          })
        : Promise.reject(new Error("missing wishlist id")),
    () => axios.post(`${API_BASE_URL}/v1/wishlist/remove-wishlist`, body, { headers }),
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return res.data;
    } catch (error: any) {
      lastError = error;
    }
  }

  const message = String(
    lastError?.response?.data?.message ||
      lastError?.response?.data?.error ||
      ""
  ).toLowerCase();

  if (message.includes("not found") && canUseProductVariant) {
    try {
      const state = await checkWishlist(parsedProductId, parsedVariantId);
      if (!isWishlistPresent(state)) {
        return { success: true, alreadyRemoved: true };
      }
    } catch {
      // ignore check failure and throw original error
    }
  }

  throw lastError;
};

export const toggleWishlist = async (productId: number, variantId?: number) => {
  const safeVariantId = variantId ?? productId;
  const checkRes = await checkWishlist(productId, safeVariantId);
  const present = isWishlistPresent(checkRes);

  if (present) {
    await removeWishlist({
      productId,
      variantId: safeVariantId,
    });

    return {
      wishlisted: false,
      action: "removed" as const,
    };
  }

  await addWishlist(productId, safeVariantId);

  return {
    wishlisted: true,
    action: "added" as const,
  };
};

export const setWishlistState = async (
  productId: number,
  variantId: number | undefined,
  shouldWishlist: boolean
) => {
  const safeVariantId = variantId ?? productId;

  if (shouldWishlist) {
    await addWishlist(productId, safeVariantId);
    return {
      wishlisted: true,
      action: "added" as const,
    };
  }

  await removeWishlist({
    productId,
    variantId: safeVariantId,
  });

  return {
    wishlisted: false,
    action: "removed" as const,
  };
};