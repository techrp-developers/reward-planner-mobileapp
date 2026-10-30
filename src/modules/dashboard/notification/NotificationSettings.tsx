import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../../theme/ThemeContext";
import OrderHeading from "../../ecommerce/constants/heading/OrderHeading";
import {
  buildQuietHoursUpdate,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "./NotificationAPI";
import {
  getNotificationPermissionState,
  openNotificationSystemSettings,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "../../common/notifications/pushPermission";
import { pushRegistrar } from "../../common/notifications/pushRegistration";
import { getChannelStates, type ChannelState } from "../../common/notifications/pushDisplay";
import { GENERAL_CHANNEL_ID, KNOWN_CHANNEL_IDS, UPDATES_CHANNEL_ID } from "../../common/notifications/pushConfig";
import { showDebugTestNotification } from "../../common/notifications/pushDebug";
import { NotificationPermissionPrompt } from "../../common/notifications/NotificationPermissionPrompt";

type ConsentField = "marketing_enabled" | "engagement_enabled";

const CONSENT_OPTIONS: Array<{ field: ConsentField; title: string; description: string }> = [
  {
    field: "marketing_enabled",
    title: "Offers & promotions",
    description: "Deals, discounts and partner offers.",
  },
  {
    field: "engagement_enabled",
    title: "Engagement notifications",
    description: "Challenges, streaks and suggestions to earn more rewards.",
  },
];

// Always sent (no backend switch exists for these); Android still lets the
// user silence or block each channel, so show what the phone will actually do.
const ALWAYS_ON: Array<{ icon: string; title: string; description: string; channelId: string }> = [
  { icon: "package-variant-closed", title: "Orders & transactions", description: "Orders, bookings, payments and account security.", channelId: GENERAL_CHANNEL_ID },
  { icon: "message-text-outline", title: "Chat & messages", description: "Direct and group messages.", channelId: GENERAL_CHANNEL_ID },
  { icon: "gift-outline", title: "Rewards & recognition", description: "Points, badges and announcements.", channelId: UPDATES_CHANNEL_ID },
];

const channelLabel = (channel?: ChannelState) => {
  if (!channel) return null;
  if (channel.blocked || channel.importance === 0) return "Off on this phone";
  if (channel.importance === null) return null;
  if (channel.importance >= 4) return "Pop-up alerts";
  if (channel.importance === 3) return "Sound, no pop-up";
  return "Silent";
};

const QUIET_HOUR_PRESETS: Array<{ label: string; start: string | null; end: string | null }> = [
  { label: "Off", start: null, end: null },
  { label: "10 PM – 7 AM", start: "22:00", end: "07:00" },
  { label: "11 PM – 8 AM", start: "23:00", end: "08:00" },
  { label: "9 PM – 9 AM", start: "21:00", end: "09:00" },
];

const REGISTRATION_LABELS: Record<string, string> = {
  registered: "Connected",
  registered_unattributed: "Connected",
  registering: "Connecting…",
  retrying: "Retrying…",
  failed: "Not connected",
  idle: "Not connected",
};

function NotificationSettings() {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useAppTheme();
  const [permission, setPermission] = useState<NotificationPermissionState | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [savingField, setSavingField] = useState<ConsentField | "quiet_hours" | null>(null);
  const [saveError, setSaveError] = useState("");
  const [registrationState, setRegistrationState] = useState(pushRegistrar.getStatus().state);
  const [channels, setChannels] = useState<ChannelState[]>([]);
  const [debugMessage, setDebugMessage] = useState("");
  const [previewPrompt, setPreviewPrompt] = useState(false);

  const themed = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: isDark ? "#09090B" : "#F5F3FA" },
        card: {
          backgroundColor: isDark ? "#18181B" : "#FFFFFF",
          borderColor: isDark ? "rgba(255,255,255,0.24)" : "#ECE8F4",
        },
        text: { color: theme.text },
        mutedText: { color: theme.secondaryText },
        divider: { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#ECE8F4" },
        chip: { borderColor: isDark ? "rgba(255,255,255,0.24)" : "#DDD6FE" },
      }),
    [isDark, theme.secondaryText, theme.text],
  );

  // Everything the user can change outside the app: permission, channels, registration.
  const refreshPermission = useCallback(() => {
    getNotificationPermissionState().then(setPermission).catch(() => setPermission("denied"));
    getChannelStates().then(setChannels).catch(() => setChannels([]));
    setRegistrationState(pushRegistrar.getStatus().state);
  }, []);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      setPreferences(await getNotificationPreferences());
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
      loadPreferences();
    }, [loadPreferences, refreshPermission]),
  );

  // Re-check after the user comes back from Android notification settings.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") refreshPermission();
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const handlePermissionAction = async () => {
    if (permission === "not_requested") {
      setPermission(await requestNotificationPermission());
      return;
    }
    openNotificationSystemSettings();
  };

  // Only an explicit toggle by the user changes consent, and only that field is sent.
  const handleToggle = async (field: ConsentField, value: boolean) => {
    if (!preferences || savingField) return;
    const previous = preferences;
    setSaveError("");
    setSavingField(field);
    setPreferences({ ...preferences, [field]: value });

    try {
      setPreferences(await updateNotificationPreferences({ [field]: value }));
    } catch {
      setPreferences(previous);
      setSaveError("Could not save your choice. Please try again.");
    } finally {
      setSavingField(null);
    }
  };

  const handleQuietHours = async (start: string | null, end: string | null) => {
    if (!preferences || savingField) return;
    const update = buildQuietHoursUpdate(start, end);
    if (!update) return;
    const previous = preferences;
    setSaveError("");
    setSavingField("quiet_hours");
    setPreferences({ ...preferences, quiet_hours_start: start, quiet_hours_end: end });

    try {
      setPreferences(await updateNotificationPreferences(update));
    } catch {
      setPreferences(previous);
      setSaveError("Could not save quiet hours. Please try again.");
    } finally {
      setSavingField(null);
    }
  };

  const currentQuietHours = preferences?.quiet_hours_start && preferences?.quiet_hours_end
    ? `${preferences.quiet_hours_start}–${preferences.quiet_hours_end}`
    : null;
  // A custom range set elsewhere is shown as-is rather than silently replaced.
  const quietHourChoices = currentQuietHours &&
    !QUIET_HOUR_PRESETS.some(p => p.start && `${p.start}–${p.end}` === currentQuietHours)
    ? [...QUIET_HOUR_PRESETS, {
        label: currentQuietHours,
        start: preferences!.quiet_hours_start,
        end: preferences!.quiet_hours_end,
      }]
    : QUIET_HOUR_PRESETS;

  const permissionGranted = permission === "granted";

  return (
    <SafeAreaView style={[styles.safe, themed.screen]}>
      <OrderHeading
        title="Notification settings"
        onBackPress={() => navigation.goBack()}
        showHelp={false}
        isDark={isDark}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, themed.mutedText]}>This device</Text>
        <View style={[styles.card, themed.card]}>
          <View style={styles.row}>
            <MaterialCommunityIcons
              name={permissionGranted ? "bell-check-outline" : "bell-off-outline"}
              size={22}
              color={permissionGranted ? "#16A34A" : "#DC2626"}
            />
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, themed.text]}>
                {permission === null
                  ? "Checking…"
                  : permissionGranted
                    ? "Notifications are on"
                    : "Notifications are off"}
              </Text>
              <Text style={[styles.rowDescription, themed.mutedText]}>
                {permissionGranted
                  ? "You will see alerts from Reward Planners on this phone."
                  : "You will not see alerts on this phone. Updates still appear in your inbox."}
              </Text>
            </View>
          </View>
          {permission !== null && !permissionGranted ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handlePermissionAction}>
              <Text style={styles.primaryButtonText}>
                {permission === "not_requested" ? "Enable notifications" : "Open notification settings"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity accessibilityRole="button" onPress={() => openNotificationSystemSettings()}>
              <Text style={[styles.linkText, styles.settingsLink]}>Open notification settings</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.divider, themed.divider]} />
          <View style={styles.statusRow}>
            <Text style={[styles.rowDescription, themed.mutedText]}>Push device registration</Text>
            <Text style={[styles.rowDescription, themed.text]}>
              {REGISTRATION_LABELS[registrationState] || "Not connected"}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, themed.mutedText]}>What you receive</Text>
        <View style={[styles.card, themed.card]}>
          {ALWAYS_ON.map((item, index) => {
            const status = channelLabel(channels.find(channel => channel.id === item.channelId));
            return (
              <View key={item.title}>
                {index > 0 ? <View style={[styles.divider, themed.divider]} /> : null}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityHint="Opens this alert type in Android settings"
                  style={styles.row}
                  onPress={() => openNotificationSystemSettings(item.channelId)}
                >
                  <MaterialCommunityIcons name={item.icon} size={22} color="#6D5AE6" />
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, themed.text]}>{item.title}</Text>
                    <Text style={[styles.rowDescription, themed.mutedText]}>
                      {item.description} Always sent{status ? ` · ${status}` : ""}.
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              </View>
            );
          })}

          {loading ? (
            <ActivityIndicator style={styles.loader} color="#6D5AE6" />
          ) : unavailable || !preferences ? (
            <View style={styles.unavailable}>
              <Text style={[styles.rowDescription, themed.mutedText]}>
                These options could not be loaded right now.
              </Text>
              <TouchableOpacity onPress={loadPreferences}>
                <Text style={styles.linkText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            CONSENT_OPTIONS.map(option => (
              <View key={option.field}>
                <View style={[styles.divider, themed.divider]} />
                <View style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, themed.text]}>{option.title}</Text>
                    <Text style={[styles.rowDescription, themed.mutedText]}>{option.description}</Text>
                  </View>
                  <Switch
                    accessibilityLabel={option.title}
                    value={preferences[option.field]}
                    disabled={savingField !== null}
                    onValueChange={value => handleToggle(option.field, value)}
                    trackColor={{ true: "#A78BFA", false: isDark ? "#3F3F46" : "#D4D4D8" }}
                    thumbColor={preferences[option.field] ? "#6D5AE6" : "#F4F4F5"}
                  />
                </View>
              </View>
            ))
          )}

          {preferences && !loading && !unavailable ? (
            <View>
              <View style={[styles.divider, themed.divider]} />
              <Text style={[styles.rowTitle, themed.text]}>Quiet hours</Text>
              <Text style={[styles.rowDescription, themed.mutedText]}>
                Offers and reminders wait until quiet hours end. Important updates still arrive.
              </Text>
              <View style={styles.chipRow}>
                {quietHourChoices.map(choice => {
                  const selected =
                    choice.start === preferences.quiet_hours_start &&
                    choice.end === preferences.quiet_hours_end;
                  return (
                    <TouchableOpacity
                      key={choice.label}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, disabled: savingField !== null }}
                      disabled={savingField !== null || selected}
                      onPress={() => handleQuietHours(choice.start, choice.end)}
                      style={[styles.chip, themed.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, themed.text, selected && styles.chipTextSelected]}>
                        {choice.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        </View>

        {__DEV__ ? (
          <>
            <Text style={[styles.sectionTitle, themed.mutedText]}>Debug build only</Text>
            <View style={[styles.card, themed.card]}>
              <Text style={[styles.rowDescription, themed.mutedText]}>
                Shows one local notification on the chosen channel. It does not use Firebase.
              </Text>
              <View style={styles.chipRow}>
                {KNOWN_CHANNEL_IDS.map(channelId => (
                  <TouchableOpacity
                    key={channelId}
                    style={[styles.chip, themed.chip]}
                    onPress={() =>
                      showDebugTestNotification(channelId)
                        .then(() => setDebugMessage(`Shown on ${channelId}`))
                        .catch(error => setDebugMessage(String(error?.message || error)))
                    }
                  >
                    <Text style={[styles.chipText, themed.text]}>{channelId.replace("reward_planners_", "Test ")}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.chip, themed.chip]} onPress={() => setPreviewPrompt(true)}>
                  <Text style={[styles.chipText, themed.text]}>Preview permission prompt</Text>
                </TouchableOpacity>
              </View>
              {debugMessage ? <Text style={[styles.rowDescription, themed.mutedText, styles.debugMessage]}>{debugMessage}</Text> : null}
            </View>
            <NotificationPermissionPrompt
              visible={previewPrompt}
              onDone={() => {
                setPreviewPrompt(false);
                refreshPermission();
              }}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default NotificationSettings;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 30,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  rowDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 13,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: "#6D5AE6",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  loader: {
    marginTop: 16,
  },
  unavailable: {
    marginTop: 14,
    gap: 6,
  },
  linkText: {
    color: "#6D5AE6",
    fontSize: 13,
    fontWeight: "700",
  },
  debugMessage: {
    marginTop: 10,
  },
  settingsLink: {
    marginTop: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: "#6D5AE6",
    borderColor: "#6D5AE6",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  errorText: {
    marginTop: 12,
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
  },
});
