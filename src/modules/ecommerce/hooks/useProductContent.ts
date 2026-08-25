import { useQuery } from "@tanstack/react-query";
import { fetchProductContent, ProductResolvedContent } from "../api/ProductContentApi";
import { productContentQueryKey } from "../../../navbar/hooks/useNavbarBanners";

const PRODUCT_CONTENT_STALE_TIME = 5 * 60 * 1000;

// Reuses the exact same query (queryKey + queryFn) that useNavbarBanners runs
// for the Product tab's navbar background, so React Query dedupes/shares the
// cache instead of firing a second GET /content/resolved/product request.
export const useProductContent = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: productContentQueryKey,
    queryFn: fetchProductContent,
    staleTime: PRODUCT_CONTENT_STALE_TIME,
  });

  return {
    productContent: (data ?? null) as ProductResolvedContent | null,
    isLoading,
    isError,
  };
};
