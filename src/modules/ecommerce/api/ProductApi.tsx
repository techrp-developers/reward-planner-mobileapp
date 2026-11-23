// src/api/ProductApi.ts
import axios from 'axios';
import api from '../../common/auth/api/axios';
import {
  API_BASE_URL,
  SERVER_URL as IMAGE_BASE_URL,
  normalizeLocalCmsImageUrl,
} from '../../../config/apiConfig';

export type ImageSizePreset =
  | 'thumbnail'
  | 'small'
  | 'medium'
  | 'large'
  | 'full';

const IMAGE_WIDTH_BY_PRESET: Record<ImageSizePreset, number> = {
  thumbnail: 100,
  small: 140,
  medium: 240,
  large: 420,
  full: 1080,
};

const appendImageOptimizationParams = (
  url: string,
  width: number,
  quality: number,
) => {
  const safeWidth = Math.max(80, Math.floor(width));
  const safeQuality = Math.max(30, Math.min(90, Math.floor(quality)));

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${safeWidth}&quality=${safeQuality}`;
};

export type FetchAllProductsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type FeaturedCampaign = {
  campaign_id: number | string;
  title: string;
  cta_text?: string | null;
  total_products: number;
  background?: {
    type?: 'solid' | 'gradient' | 'image' | null;
    colors?: string[] | null;
    image_url?: string | null;
    text_color?: string | null;
  } | null;
  products: FeaturedCampaignProduct[];
};

export type FeaturedCampaignProduct = {
  product_id: number | string;
  id?: number | string;
  product_name: string;
  variant_id: number | string;
  image?: string | null;
  image_url?: string | null;
  price?: string | number | null;
  selling_price?: string | number | null;
  final_price?: string | number | null;
  originalPrice?: string | number | null;
  original_price?: string | number | null;
  mrp?: string | number | null;
  rp_price?: string | number | null;
  is_wishlist?: boolean | number | string;
  is_wishlisted?: boolean | number | string;
  [key: string]: unknown;
};

export type FeaturedCampaignProductsPage = {
  campaign_id: number | string;
  title: string;
  products: FeaturedCampaignProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const fetchActiveFeaturedCampaign = async (): Promise<FeaturedCampaign | null> => {
  const res = await api.get('/v1/campaigns/home/featured');
  const payload = res.data as {
    success: boolean;
    data: FeaturedCampaign | null;
  };

  if (!payload?.success) {
    throw new Error('Failed to load featured campaign');
  }

  return payload.data;
};

export const fetchFeaturedCampaignProducts = async (
  campaignId: number | string,
  page = 1,
  limit = 20,
): Promise<FeaturedCampaignProductsPage> => {
  const res = await api.get(
    `/v1/campaigns/${encodeURIComponent(String(campaignId))}/featured-products/public`,
    { params: { page, limit } },
  );
  const payload = res.data as {
    success: boolean;
    data: FeaturedCampaignProductsPage;
  };

  if (!payload?.success || !payload.data?.pagination) {
    throw new Error('Failed to load featured campaign products');
  }

  return payload.data;
};

export const fetchProductsByBrand = async (brand: string, page = 1, search = '') => {
  const res = await api.get('/v1/product/by-brand', {
    params: { brand, page, limit: 20, search },
  });
  return res.data;
};

export const fetchAllProducts = async (params?: FetchAllProductsParams) => {
  const res = await api.get(`/v1/product/all-products`, {
    params: params?.page
      ? { page: params.page, limit: params.pageSize, search: params.search }
      : undefined,
  });
  return res.data;
};

export type SimilarProductsParams = {
  productId: string | number;
  categoryId?: string | number;
  subcategoryId?: string | number;
  subSubcategoryId?: string | number;
};

export const fetchSimilarProducts = async ({
  productId,
  categoryId,
  subcategoryId,
  subSubcategoryId,
}: SimilarProductsParams) => {
  const res = await api.get(`/v1/product/similar/${productId}`, {
    params: {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      sub_subcategory_id: subSubcategoryId,
    },
  });

  return res.data;
};

export const getProductImageUrl = (
  imagePath?: string,
  size: ImageSizePreset = 'thumbnail',
  quality = 40,
) => {
  if (!imagePath || typeof imagePath !== 'string') return '';

  const trimmedPath = imagePath.trim();
  if (!trimmedPath) return '';

  // If already a full URL, return as is
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const cleanPath = trimmedPath.replace(/^\/+/, '');
  const encoded = encodeURI(cleanPath);
  const width = IMAGE_WIDTH_BY_PRESET[size] ?? IMAGE_WIDTH_BY_PRESET.medium;

  const fullUrl = `${IMAGE_BASE_URL}/${encoded}`;
  return appendImageOptimizationParams(fullUrl, width, quality);
};
export const fetchProductDetailsByID = async (
  productId: string | number,
  campaignId?: string | number,
  contentId?: string | number,
) => {
  if (!productId) {
    throw new Error('Missing product id');
  }

  const res = await api.get(`/v1/product/product-details/${productId}`, {
    params: {
      ...(campaignId == null ? {} : { campaign_id: campaignId }),
      ...(contentId == null ? {} : { content_id: contentId }),
    },
  });
  const payload = res?.data;
  return payload?.product ?? payload?.data?.product ?? payload?.data ?? null;
};
// v1/cart/cart-items/check-stock/:variantId

export const checkStock = async (variantId: number) => {
  const res = await axios.get(
    `${API_BASE_URL}/v1/cart/cart-items/check-stock/${variantId}`,
  );
  return res.data as {
    success: boolean;
    stock: number;
    inStock: boolean;
  };
};
export const fetchAllCategories = async () => {
  const res = await axios.get(`${API_BASE_URL}/v1/product/categories`);
  return res.data;
};

export const fetchCategoriesByID = async (
  categoryId: string | number,
  options: {
    page?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
    [key: string]: any;
  } = {},
) => {
  const params = {
    page: options.page ?? 1,
    ...options,
  };

  const res = await api.get(`/v1/product/by-category/${categoryId}`, {
    params,
  });
  return res.data;
};

export const fetchProductsBySubcategoryId = async (
  subcategoryId: string | number,
  options: {
    page?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
    [key: string]: any;
  } = {},
) => {
  const params = {
    page: options.page ?? 1,
    ...options,
  };

  const res = await api.get(`/v1/product/by-subcategory/${subcategoryId}`, {
    params,
  });
  return res.data;
};
export const fetchCategoriesBySubCategories = async (
  categoryId: string | number,
) => {
  const res = await axios.get(
    `${API_BASE_URL}/v1/product/subcategories/${categoryId}`,
  );
  return res.data;
};

export const fetchCategoriesScreenAll = async () => {
  const res = await axios.get(
    `${API_BASE_URL}/v1/product/categories-with-subcategories`,
  );
  return res.data;
};

export const fetchAllOfferPosters = async () => {
  const res = await axios.get(`${API_BASE_URL}/offer/offer-posters`);
  return res.data;
};
export const getOfferPosterUrl = (path?: string) => {
  if (!path) return '';
  const normalizedPath = /^https?:\/\//i.test(path) || /^\/?uploads\//i.test(path)
    ? path
    : `/uploads/${path.replace(/^\/+/, '')}`;
  const base = normalizeLocalCmsImageUrl(normalizedPath);
  return base ? appendImageOptimizationParams(base, 480, 60) : '';
};

export const fetchSearchSuggestions = async (query: string) => {
  if (!query || query.trim().length < 2)
    return { success: true, suggestions: [] };
  const res = await axios.get(`${API_BASE_URL}/v1/product/search/suggestions`, {
    params: { q: query },
  });

  return res.data;
};
// SEARCH PRODUCTS (when user presses enter or chip)
export const searchProducts = async (keyword: string) => {
  const res = await api.get(`/v1/product/search/products`, {
    params: { q: keyword },
  });
  return res.data;
};

// SAVE SEARCH HISTORY
export const saveSearchHistory = async (keyword: string) => {
  const res = await api.post('/v1/product/search/history', { keyword });
  return res.data;
};

// GET SEARCH HISTORY
export const getSearchHistory = async () => {
  const res = await api.get('/v1/product/search/history');
  return res.data;
};

export const clearSearchHistory = async () => {
  const res = await api.delete('/v1/product/search/history', {});
  return res.data;
};
