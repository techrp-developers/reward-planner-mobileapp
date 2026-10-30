import { createNavigationContainerRef } from "@react-navigation/native";

// Lets code outside the React tree (push notification taps) navigate once the
// container and the authenticated App stack are mounted.
export const navigationRef = createNavigationContainerRef<any>();

export const isAppStackMounted = () =>
  navigationRef.isReady() &&
  Boolean(navigationRef.getRootState()?.routeNames?.includes("App"));
