import notifee from "@notifee/react-native";
import { NOTIFICATION_ACCENT_COLOR, NOTIFICATION_LARGE_ICON, NOTIFICATION_SMALL_ICON } from "./pushConfig";
import { NOTIFICATION_CHANNELS } from "./pushDisplay";

// Debug builds only (callers gate on __DEV__): one explicitly triggered local
// alert per channel to check tray, icon, sound and heads-up behaviour. It does
// not involve Firebase, so it proves nothing about FCM delivery. The fixed id
// makes a repeat replace the previous test alert instead of stacking.
export const DEBUG_TEST_NOTIFICATION_PREFIX = "debug-test:";

export const showDebugTestNotification = async (channelId: string) => {
  if (!__DEV__) return;
  const channel = NOTIFICATION_CHANNELS.find(item => item.id === channelId);
  if (!channel) throw new Error(`Unknown channel ${channelId}`);
  await notifee.displayNotification({
    id: `${DEBUG_TEST_NOTIFICATION_PREFIX}${channelId}`,
    title: `Test: ${channel.name}`,
    body: "Local debug notification. Not sent through Firebase.",
    // No routing data: tapping it opens the app without navigating anywhere.
    data: { debug_test: "1" },
    android: {
      channelId,
      smallIcon: NOTIFICATION_SMALL_ICON,
      largeIcon: NOTIFICATION_LARGE_ICON,
      color: NOTIFICATION_ACCENT_COLOR,
      pressAction: { id: "default" },
    },
  });
};
