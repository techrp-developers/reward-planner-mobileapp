type NavigationStateLike = {
  index?: number;
  routeNames?: string[];
  routes?: Array<{ name: string }>;
};

type NavigationLike = {
  canGoBack?: () => boolean;
  getParent?: () => NavigationLike | undefined;
  getState?: () => NavigationStateLike;
  goBack?: () => void;
  navigate?(routeName: any, params?: any): void;
  reset?(state: any): void;
};

const HOME_ROUTE_PRIORITY = [
  'Home',
  'DineOutModule',
  'BookingHomeScreen',
  'PaymentsModule',
  'ServicesModule',
  'ProductModule',
  'Dashboard',
];

export const ORDER_PAYMENT_FLOW_ROUTES = [
  'OrderStepUI',
  'OrderConfirm',
  'Checkout',
  'Cart',
  'ServiceCheckoutScreen',
  'PaymentConfirmationScreen',
  'BillDetailsScreen',
  'RechargeConfirmationScreen',
  'TransactionStatusScreen',
];

export function navigateToRegisteredRoute(
  navigation: NavigationLike,
  routeName: string,
  params?: unknown,
): boolean {
  const visited = new Set<NavigationLike>();
  let current: NavigationLike | undefined = navigation;

  while (current && !visited.has(current)) {
    visited.add(current);
    const state = current.getState?.();

    if (state?.routeNames?.includes(routeName) && current.navigate) {
      current.navigate(routeName, params);
      return true;
    }

    current = current.getParent?.();
  }

  return false;
}

export function returnToModuleHome(navigation: NavigationLike): boolean {
  const visited = new Set<NavigationLike>();
  let current: NavigationLike | undefined = navigation;

  while (current && !visited.has(current)) {
    visited.add(current);
    const state = current.getState?.();
    const routeNames = state?.routeNames ?? [];
    const homeRoute = HOME_ROUTE_PRIORITY.find((name) => routeNames.includes(name));

    if (homeRoute && current.reset) {
      current.reset({ index: 0, routes: [{ name: homeRoute }] });
      return true;
    }

    current = current.getParent?.();
  }

  return false;
}

export function navigateBackSafely(
  navigation: NavigationLike,
  {
    fallbackRouteNames,
    blockedPreviousRouteNames = [],
  }: {
    fallbackRouteNames: string[];
    blockedPreviousRouteNames?: string[];
  },
): boolean {
  const blockedRoutes = new Set(blockedPreviousRouteNames);
  const visited = new Set<NavigationLike>();
  let current: NavigationLike | undefined = navigation;

  while (current && !visited.has(current)) {
    visited.add(current);
    const state = current.getState?.();
    const routes = state?.routes ?? [];
    const index = state?.index ?? routes.length - 1;
    const currentRoute = routes[index]?.name;
    const previousRoute = index > 0 ? routes[index - 1]?.name : undefined;

    if (
      previousRoute &&
      !blockedRoutes.has(previousRoute) &&
      current.goBack &&
      current.canGoBack?.() !== false
    ) {
      current.goBack();
      return true;
    }

    const fallbackRoute = fallbackRouteNames.find((name) =>
      name !== currentRoute && state?.routeNames?.includes(name),
    );
    if (fallbackRoute && current.reset) {
      current.reset({ index: 0, routes: [{ name: fallbackRoute }] });
      return true;
    }

    current = current.getParent?.();
  }

  return false;
}
