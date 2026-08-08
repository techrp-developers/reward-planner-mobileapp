import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

type NotificationDataValue = string | object | undefined;
type NotificationData = Record<string, NotificationDataValue>;

type TodoReminderScheduleArgs = {
  todoId: string;
  title: string;
  subtitle?: string;
  taskDate: string;
  reminderTime: string;
  referenceId?: string;
};

type TodoReminderScheduleResult =
  | { scheduled: true; triggerAt: number; exact: boolean }
  | {
      scheduled: false;
      reason: 'missing_alarm_permission' | 'invalid_datetime' | 'past_datetime';
    };

const CHANNEL_IDS = {
  DEFAULT: 'default',
  TODO_REMINDERS: 'todo_reminders',
  SERVICE_UPDATES: 'service_updates',
  ORDER_UPDATES: 'order_updates',
} as const;

const PENDING_NOTIFICATION_PRESS_KEY = '@pending_notification_press';
const TODO_NOTIFICATION_ID_PREFIX = 'todo-reminder';
const TODO_ALARM_SOUND = 'todo_alarm';
const TODO_SNOOZE_MINUTES = 10;

export const TODO_NOTIFICATION_ACTIONS = {
  PRESS: 'default',
  FULL_SCREEN: 'todo-alarm',
  SNOOZE: 'todo-snooze',
  DISMISS: 'todo-dismiss',
} as const;

// Request notification permission for Android 13+
export async function requestUserPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: CHANNEL_IDS.DEFAULT,
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });

  await notifee.createChannel({
    id: CHANNEL_IDS.TODO_REMINDERS,
    name: 'Todo Reminders',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 700, 300, 700],
    sound: TODO_ALARM_SOUND,
  });

  await notifee.createChannel({
    id: CHANNEL_IDS.SERVICE_UPDATES,
    name: 'Service Updates',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });

  await notifee.createChannel({
    id: CHANNEL_IDS.ORDER_UPDATES,
    name: 'Order Updates',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

function isTodoAlarmData(data?: NotificationData): boolean {
  const module = typeof data?.module === 'string' ? data.module.toLowerCase() : undefined;
  const type = typeof data?.type === 'string' ? data.type.toLowerCase() : undefined;
  const alertType =
    typeof data?.alert_type === 'string' ? data.alert_type.toLowerCase() : undefined;

  return (
    module === 'todo' ||
    type === 'todo_reminder' ||
    alertType === 'todo_alarm'
  );
}

function getTodoNotificationId(todoId: string): string {
  return `${TODO_NOTIFICATION_ID_PREFIX}:${todoId}`;
}

function getTodoSnoozeNotificationId(todoId: string): string {
  return `${TODO_NOTIFICATION_ID_PREFIX}:${todoId}:snooze`;
}

function parseReminderTimestamp(taskDate: string, reminderTime: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(taskDate.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(reminderTime.trim());

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem === 'PM' && hour !== 12) {
    hour += 12;
  }

  if (meridiem === 'AM' && hour === 12) {
    hour = 0;
  }

  return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

async function canScheduleExactAlarm(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 31) {
    return true;
  }

  const settings = await notifee.getNotificationSettings();
  return settings.android.alarm === AndroidNotificationSetting.ENABLED;
}

export async function ensureExactAlarmPermission(): Promise<boolean> {
  const enabled = await canScheduleExactAlarm();

  if (!enabled && Platform.OS === 'android' && Platform.Version >= 31) {
    await notifee.openAlarmPermissionSettings();
  }

  return enabled;
}

export async function scheduleTodoReminder(
  args: TodoReminderScheduleArgs,
): Promise<TodoReminderScheduleResult> {
  await ensureNotificationChannels();

  const timestamp = parseReminderTimestamp(args.taskDate, args.reminderTime);
  if (!timestamp) {
    return { scheduled: false, reason: 'invalid_datetime' };
  }

  if (timestamp <= Date.now()) {
    return { scheduled: false, reason: 'past_datetime' };
  }

  const exact = await canScheduleExactAlarm();
  if (!exact && Platform.OS === 'android' && Platform.Version >= 31) {
    return { scheduled: false, reason: 'missing_alarm_permission' };
  }

  const notificationId = getTodoNotificationId(args.todoId);
  await createTodoReminderTriggerNotification({
    notificationId,
    todoId: args.todoId,
    title: args.title,
    subtitle: args.subtitle,
    timestamp,
    referenceId: args.referenceId || args.todoId,
  });

  return { scheduled: true, triggerAt: timestamp, exact: true };
}

async function createTodoReminderTriggerNotification(args: {
  notificationId: string;
  todoId: string;
  title: string;
  subtitle?: string;
  timestamp: number;
  referenceId: string;
}): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: args.timestamp,
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  await notifee.cancelNotification(args.notificationId);
  await notifee.createTriggerNotification(
    {
      id: args.notificationId,
      title: args.title,
      body: args.subtitle || 'Todo reminder',
      data: {
        module: 'todo',
        type: 'todo_reminder',
        reference_type: 'todo',
        reference_id: args.referenceId,
        action_url: '/todo',
        screen: 'TodoList',
        sound: TODO_ALARM_SOUND,
        alert_type: 'todo_alarm',
        todo_id: args.todoId,
      },
      android: {
        channelId: CHANNEL_IDS.TODO_REMINDERS,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        pressAction: { id: TODO_NOTIFICATION_ACTIONS.PRESS },
        fullScreenAction: { id: TODO_NOTIFICATION_ACTIONS.FULL_SCREEN },
        sound: TODO_ALARM_SOUND,
        vibrationPattern: [300, 700, 300, 700, 300, 700],
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        actions: [
          {
            title: 'Snooze',
            pressAction: { id: TODO_NOTIFICATION_ACTIONS.SNOOZE },
          },
          {
            title: 'Dismiss',
            pressAction: { id: TODO_NOTIFICATION_ACTIONS.DISMISS },
          },
        ],
      },
    },
    trigger,
  );
}

export async function cancelTodoReminder(todoId: string): Promise<void> {
  await notifee.cancelNotification(getTodoNotificationId(todoId));
  await notifee.cancelNotification(getTodoSnoozeNotificationId(todoId));
}

export async function snoozeTodoReminder(data?: NotificationData): Promise<void> {
  const todoId =
    typeof data?.todo_id === 'string'
      ? data.todo_id
      : typeof data?.reference_id === 'string'
      ? data.reference_id
      : undefined;

  if (!todoId) return;

  const title =
    typeof data?.title === 'string' ? data.title : 'Todo reminder';
  const body =
    typeof data?.body === 'string' ? data.body : 'Snoozed todo reminder';
  const timestamp = Date.now() + TODO_SNOOZE_MINUTES * 60 * 1000;

  await createTodoReminderTriggerNotification({
    notificationId: getTodoSnoozeNotificationId(todoId),
    todoId,
    title,
    subtitle: body,
    timestamp,
    referenceId:
      typeof data?.reference_id === 'string' ? data.reference_id : todoId,
  });
}

export async function dismissTodoReminder(data?: NotificationData): Promise<void> {
  const todoId =
    typeof data?.todo_id === 'string'
      ? data.todo_id
      : typeof data?.reference_id === 'string'
      ? data.reference_id
      : undefined;

  if (!todoId) return;

  await cancelTodoReminder(todoId);
}

export async function storePendingNotificationPress(data?: NotificationData): Promise<void> {
  if (!data) return;
  await AsyncStorage.setItem(PENDING_NOTIFICATION_PRESS_KEY, JSON.stringify(data));
}

export async function consumePendingNotificationPress(): Promise<Record<string, any> | null> {
  const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_PRESS_KEY);
  if (!raw) return null;

  await AsyncStorage.removeItem(PENDING_NOTIFICATION_PRESS_KEY);

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function registerNotifeeBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
      if (detail.pressAction?.id === TODO_NOTIFICATION_ACTIONS.SNOOZE) {
        await snoozeTodoReminder(detail.notification?.data as NotificationData);
        return;
      }

      if (detail.pressAction?.id === TODO_NOTIFICATION_ACTIONS.DISMISS) {
        await dismissTodoReminder(detail.notification?.data as NotificationData);
        return;
      }
    }

    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      await storePendingNotificationPress(detail.notification?.data as NotificationData);
    }
  });
}

function resolveChannelId(data?: NotificationData): string {
  const module = typeof data?.module === 'string' ? data.module.toLowerCase() : undefined;
  const type = typeof data?.type === 'string' ? data.type.toLowerCase() : undefined;
  const screen = typeof data?.screen === 'string' ? data.screen.toLowerCase() : undefined;

  if (typeof data?.channel_id === 'string') {
    return data.channel_id;
  }

  if (
    module === 'todo' ||
    type === 'todo_reminder' ||
    screen === 'todolist'
  ) {
    return CHANNEL_IDS.TODO_REMINDERS;
  }

  if (
    module === 'service' ||
    type?.includes('service') ||
    type?.includes('enquiry')
  ) {
    return CHANNEL_IDS.SERVICE_UPDATES;
  }

  if (
    module === 'ecommerce' ||
    module === 'bbps' ||
    module === 'shipment' ||
    module === 'cart' ||
    type?.includes('order') ||
    type?.includes('shipment') ||
    type?.includes('delivery')
  ) {
    return CHANNEL_IDS.ORDER_UPDATES;
  }

  return CHANNEL_IDS.DEFAULT;
}

function getDisplayContent(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): { title: string; body: string } {
  const dataTitle =
    typeof remoteMessage.data?.title === 'string'
      ? remoteMessage.data.title
      : undefined;
  const dataBody =
    typeof remoteMessage.data?.body === 'string'
      ? remoteMessage.data.body
      : undefined;

  return {
    title: remoteMessage.notification?.title || dataTitle || 'New Message',
    body: remoteMessage.notification?.body || dataBody || '',
  };
}

export async function displayNotificationFromRemoteMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  await ensureNotificationChannels();

  const { title, body } = getDisplayContent(remoteMessage);
  const channelId = resolveChannelId(remoteMessage.data);
  const isTodoAlarm = isTodoAlarmData(remoteMessage.data);

  await notifee.displayNotification({
    title,
    body,
    data: remoteMessage.data,
    android: {
      channelId,
      category: isTodoAlarm ? AndroidCategory.ALARM : AndroidCategory.REMINDER,
      importance: AndroidImportance.HIGH,
      pressAction: { id: TODO_NOTIFICATION_ACTIONS.PRESS },
      sound: isTodoAlarm ? TODO_ALARM_SOUND : 'default',
      vibrationPattern: isTodoAlarm
        ? [300, 700, 300, 700, 300, 700]
        : undefined,
      fullScreenAction: isTodoAlarm ? { id: TODO_NOTIFICATION_ACTIONS.FULL_SCREEN } : undefined,
      loopSound: isTodoAlarm,
      ongoing: isTodoAlarm,
      autoCancel: !isTodoAlarm,
      actions: isTodoAlarm
        ? [
            {
              title: 'Snooze',
              pressAction: { id: TODO_NOTIFICATION_ACTIONS.SNOOZE },
            },
            {
              title: 'Dismiss',
              pressAction: { id: TODO_NOTIFICATION_ACTIONS.DISMISS },
            },
          ]
        : undefined,
    },
  });
}

// Fetch the unique FCM token for this device
export async function getFCMToken(): Promise<string | undefined> {
  try {
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }
    const token = await messaging().getToken();
    console.log('=== YOUR FCM TOKEN ===');
    console.log(token);
    console.log('======================');
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
}

export function registerTokenRefreshHandler(
  onRefresh: (token: string) => Promise<void> | void,
): () => void {
  return messaging().onTokenRefresh(async token => {
    try {
      await onRefresh(token);
      console.log('[FCM] Token refreshed and synced');
    } catch (error) {
      console.error('[FCM] Token refresh sync failed:', error);
    }
  });
}

// Background notifications receiver
export function registerBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);

    // Avoid duplicate notifications when FCM already includes a notification
    // payload and Android is handling display for background/quit states.
    if (!remoteMessage.notification) {
      await displayNotificationFromRemoteMessage(remoteMessage);
    }
  });
}
