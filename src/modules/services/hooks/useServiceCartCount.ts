import { useQuery } from '@tanstack/react-query';
import { getServiceCartItems } from '../api/CartAPI';
import { SERVICE_CART_QUERY_KEY } from '../constant/queryKeys';
import { useAuth } from '../../common/auth/context/AuthContext';

/**
 * Item count for the services-module cart only.
 * Kept separate from the ecommerce CartContext so the services cart badge
 * never reflects products added in the ecommerce module (and vice versa).
 */
export function useServiceCartCount(): number {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: SERVICE_CART_QUERY_KEY,
    queryFn: getServiceCartItems,
    enabled: isAuthenticated,
    // CartScreen writes raw checkout-preview payloads into this same query
    // key on only some code paths, so the cache can't be trusted as-is —
    // always refetch fresh on mount instead of relying on shared cache state.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const bundleCount = Array.isArray(data?.bundles) ? data.bundles.length : 0;
  const individualCount = Array.isArray(data?.individual_items) ? data.individual_items.length : 0;

  return bundleCount + individualCount;
}
