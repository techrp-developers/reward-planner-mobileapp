const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildNotificationPayload,
  buildPushMessage,
} = require("../utils/notificationPayload");

test("mobile screen is inferred without changing the existing action URL", () => {
  const payload = buildNotificationPayload({
    userId: 7,
    module: "ecommerce",
    type: "order_paid",
    title: "Order confirmed",
    message: "Your order is confirmed.",
    reference_type: "order",
    reference_id: 42,
    action_url: "/orders/order-details/42",
  });

  assert.equal(payload.screen, "OrderDetails");
  assert.equal(payload.action_url, "/orders/order-details/42");
  assert.equal(payload.idempotency_key, "7:ecommerce:order_paid:42");
});

test("explicit mobile screen takes precedence", () => {
  const payload = buildNotificationPayload({
    userId: 7,
    module: "todo",
    type: "todo_reminder",
    title: "Reminder",
    message: "Task starts soon.",
    screen: "CustomTodoScreen",
  });

  assert.equal(payload.screen, "CustomTodoScreen");
  assert.match(payload.idempotency_key, /^window:[a-f0-9]{64}$/);
});

test("FCM data payload contains strings only", () => {
  const message = buildPushMessage({
    module: "bbps",
    type: "bbps_payment_success",
    title: "Paid",
    message: "Payment complete.",
    reference_type: "bbps_transaction",
    reference_id: 99,
    screen: "BbpsHome",
    priority: "high",
  }, "token-1");

  assert.equal(message.token, "token-1");
  assert.equal(message.data.reference_id, "99");
  assert.ok(Object.values(message.data).every((value) => typeof value === "string"));
});

test("carries the persisted CRM artwork and destination into Android on the quiet offers channel", () => {
  const image = "https://cdn.rewardplanners.com/public/notifications/festival.jpg";
  const metadata = {
    image_url: image,
    target_route: { path: ["App", "Home", "ProductModule", "ProductDescription"], params: { productId: 23 } },
  };
  const payload = buildNotificationPayload({
    module: "ecommerce", type: "promotion", title: "Festival", message: "Shop now",
    metadata: JSON.stringify(metadata),
    destination_type: "product", destination_id: 23, campaign_id: 56,
    android_channel_id: "reward_planners_offers",
  });
  assert.equal(payload.metadata.image_url, image);
  assert.equal(payload.metadata.destination_id, 23);
  const message = buildPushMessage({ ...payload, notification_id: 81 }, "test-token");
  assert.deepEqual(message.android, {
    priority: "normal",
    notification: { channelId: "reward_planners_offers", imageUrl: image, tag: "n:81" },
  });
  assert.deepEqual(message.notification, { title: "Festival", body: "Shop now" });
  assert.deepEqual(message.apns, { payload: { aps: { sound: "default" } } });
  assert.equal(message.data.notification_id, "81");
  assert.equal(message.data.campaign_id, "56");
  assert.equal(message.data.destination_type, "product");
  assert.equal(message.data.destination_id, "23");
  assert.equal(message.data.image_url, image);
  assert.deepEqual(JSON.parse(message.data.target_route), metadata.target_route);
});

test("invalid artwork leaves a text payload and distinct campaign IDs keep separate dedupe keys", () => {
  const input = { module: "ecommerce", type: "promotion", title: "Sale", message: "Shop now" };
  const first = buildNotificationPayload({ ...input, campaign_id: 1, image_url: "https://cdn.rewardplanners.com@other.example/sale.jpg" });
  const second = buildNotificationPayload({ ...input, campaign_id: 2 });
  assert.notEqual(first.idempotency_key, second.idempotency_key);
  const message = buildPushMessage(first, "test-token");
  assert.equal(message.android.notification.imageUrl, undefined);
  assert.equal(message.data.image_url, undefined);
  assert.equal(message.android.notification.channelId, "reward_planners_offers");
  assert.equal(message.data.screen, "Notifications");
});

test("stores metadata as an object for inbox reads even when the producer supplied JSON", async () => {
  const imageUrl = "https://cdn.rewardplanners.com/public/notifications/festival.jpg";
  const dbPath = require.resolve("../../../config/database");
  let stored;
  require.cache[dbPath] = { loaded: true, exports: {
    async execute(sql, values) {
      if (sql.includes("INSERT INTO notifications")) {
        stored = values[9];
        return [{ insertId: 81, affectedRows: 1 }];
      }
      return [[{ notification_id: 81, metadata: stored }]];
    },
  } };
  const model = require("../models/notificationModel");
  const payload = buildNotificationPayload({
    userId: 7, module: "ecommerce", type: "promotion", title: "Festival", message: "Shop now",
    metadata: JSON.stringify({ imageUrl, destination_type: "product", destination_id: 23 }),
  });
  const persisted = await model.create(payload);
  const [row] = await model.getByUser(7);
  assert.equal(row.notification_id, persisted.notificationId);
  assert.deepEqual(row.metadata, {
    imageUrl, image_url: imageUrl, destination_type: "product", destination_id: 23, screen: "Notifications",
  });
});

test("an explicit daily idempotency key is preserved", () => {
  const payload = buildNotificationPayload({
    userId: 7,
    module: "fitness",
    type: "fitness_midday_hook",
    title: "Let's get moving!",
    message: "Keep walking.",
    reference_type: "fitness_goal",
    reference_id: "midday_hook",
    idempotency_key: "fitness:midday:7:2026-09-21",
  });

  assert.equal(payload.idempotency_key, "fitness:midday:7:2026-09-21");
});

test("matching ordinary pushes in the same window get the same key", () => {
  const input = {
    userId: 7,
    module: "ecommerce",
    type: "cart_message",
    title: "Cart reminder",
    message: "Your cart is waiting.",
    reference_type: "cart",
    reference_id: "7",
  };

  const first = buildNotificationPayload(input);
  const second = buildNotificationPayload(input);
  assert.equal(first.idempotency_key, second.idempotency_key);
});
