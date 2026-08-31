import { useQuery } from "@tanstack/react-query";
import { fetchProductContent } from "../api/ProductContentApi";

export const PRODUCT_CONTENT_QUERY_KEY = ["cms", "resolved", "product"] as const;

export const useProductContent = () => {
  const query = useQuery({
    queryKey: PRODUCT_CONTENT_QUERY_KEY,
    queryFn: fetchProductContent,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    productContent: query.data ?? null,
  };
};
