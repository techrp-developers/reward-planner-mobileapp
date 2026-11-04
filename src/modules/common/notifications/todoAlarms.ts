import { Platform } from "react-native";
import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  TriggerType,
} from "@notifee/react-native";
import { fetchPendingTodos } from "../../ecommerce/api/ProfileApi";

// Created natively in MainApplication.kt with the alarm ringtone on the alarm
// audio stream (notifee can't set audio usage). Channel settings are immutable
// once created, so bump the id in both places if the sound ever needs to change.
export const TODO_ALARM_CHANNEL_ID = "todo_alarms_v2";
// Used only when running new JS on an APK built before the native channel existed.
const FALLBACK_CHANNEL_ID = "todo_alarms_v1";
export const TODO_ALARM_DISMISS_ACTION = "todo_alarm_dismiss";
const ALARM_ID_PREFIX = "todo-alarm-";

type AlarmTodo = {
  id: string | number;
  date?: string;
  title?: string;
  subtitle?: string;
  reminder?: string | null;
  completed?: boolean;
};

const alarmIdFor = (todoId: string | number) => `${ALARM_ID_PREFIX}${todoId}`;

const parseReminderTimestamp = (date?: string, reminder?: string | null) => {
  if (!date || !reminder) return null;

  const dateMatch = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = String(reminder)
    .trim()
    .replace(/[  ]/g, " ")
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?$/i);
  if (!dateMatch || !timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridiem = timeMatch[3]?.toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;

  const scheduledAt = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    hours,
    minutes,
    0,
  );

  return Number.isNaN(scheduledAt.getTime()) ? null : scheduledAt.getTime();
};

/**
 * Returns the channel to post alarms on. Never creates TODO_ALARM_CHANNEL_ID
 * from JS: a notifee-made channel would lock in the notification sound and
 * stop the native one from being created after the next rebuild.
 */
export const ensureTodoAlarmChannel = async () => {
  if (await notifee.getChannel(TODO_ALARM_CHANNEL_ID)) return TODO_ALARM_CHANNEL_ID;

  return notifee.createChannel({
    id: FALLBACK_CHANNEL_ID,
    name: "Todo alarms",
    description: "Alarm-style reminders for your todo tasks",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: "default",
    vibration: true,
    vibrationPattern: [500, 1000, 500, 1000],
  });
};

/**
 * True when this device can ring a todo alarm on time. The backend uses this
 * to skip its own push for custom reminders so the user is not alerted twice.
 */
export const canUseDeviceAlarms = async () => {
  if (Platform.OS !== "android") return false;

  try {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED &&
      settings.android.alarm === AndroidNotificationSetting.ENABLED
    );
  } catch {
    return false;
  }
};

/**
 * Opens whichever system screen is blocking alarms: Android 12+ "Alarms &
 * reminders" when exact alarms are off, otherwise the app's notification settings.
 */
export const openTodoAlarmSettings = async () => {
  if (Platform.OS !== "android") return;

  const settings = await notifee.getNotificationSettings();
  if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
    await notifee.openAlarmPermissionSettings();
  } else {
    await notifee.openNotificationSettings(TODO_ALARM_CHANNEL_ID);
  }
};

const scheduleTodoAlarm = async (
  todo: AlarmTodo,
  timestamp: number,
  channelId: string,
) => {
  await notifee.createTriggerNotification(
    {
      id: alarmIdFor(todo.id),
      title: todo.title ? `Reminder: ${todo.title}` : "Todo reminder",
      body: todo.subtitle || "It's time for your task!",
      data: { type: "todo_alarm", todo_id: String(todo.id), screen: "TodoList" },
      android: {
        channelId,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: "ic_launcher",
        sound: "default",
        loopSound: true,
        autoCancel: true,
        pressAction: { id: "default" },
        actions: [
          { title: "Dismiss", pressAction: { id: TODO_ALARM_DISMISS_ACTION } },
        ],
      },
      ios: { sound: "default" },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    },
  );
};

/**
 * Makes the device's scheduled todo alarms match the user's pending todos:
 * schedules future reminders and cancels alarms for todos that were
 * completed, deleted, or had their reminder removed.
 */
export const syncTodoAlarms = async () => {
  if (Platform.OS !== "android") return;

  const res = await fetchPendingTodos();
  if (!res?.success || !Array.isArray(res.data)) return;
  const todos: AlarmTodo[] = res.data;

  const channelId = await ensureTodoAlarmChannel();

  const now = Date.now();
  const wantedIds = new Set<string>();

  for (const todo of todos) {
    if (todo.completed) continue;

    const timestamp = parseReminderTimestamp(todo.date, todo.reminder);
    if (!timestamp || timestamp <= now) continue;

    wantedIds.add(alarmIdFor(todo.id));
    await scheduleTodoAlarm(todo, timestamp, channelId);
  }

  const scheduledIds = await notifee.getTriggerNotificationIds();
  await Promise.all(
    scheduledIds
      .filter(id => id.startsWith(ALARM_ID_PREFIX) && !wantedIds.has(id))
      .map(id => notifee.cancelTriggerNotification(id)),
  );
};

export const syncTodoAlarmsSafely = () =>
  syncTodoAlarms().catch(error =>
    __DEV__ && console.warn("[TodoAlarm] Sync failed", error),
  );

export const cancelAllTodoAlarms = async () => {
  const scheduledIds = await notifee.getTriggerNotificationIds();
  await Promise.all(
    scheduledIds
      .filter(id => id.startsWith(ALARM_ID_PREFIX))
      .map(id => notifee.cancelTriggerNotification(id)),
  );
};
