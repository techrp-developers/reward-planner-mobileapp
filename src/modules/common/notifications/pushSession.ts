import notifee from "@notifee/react-native";
import { queryClient } from "../../../query/queryClient";
import { pushRegistrar } from "./pushRegistration";
import { clearPendingOpen, setActivePushUser } from "./pushNavigation";

// Called whenever the local session ends (logout, refresh failure, revoked
// session) so nothing from the previous account leaks into the next login.
// The FCM token itself is kept: the backend unlinks it from the old user and
// the next login re-registers it.
export const resetPushSession = async () => {
  pushRegistrar.stop();
  setActivePushUser(null);
  clearPendingOpen();
  queryClient.removeQueries({ queryKey: ["notification"] });
  await notifee.cancelDisplayedNotifications().catch(() => undefined);
};
