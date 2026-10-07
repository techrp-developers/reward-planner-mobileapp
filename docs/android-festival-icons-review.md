# Android Festival App Icons - Implementation Review

## Checkout findings and original files

The requested backend lives at src/server/routes/contentRoutes.js (not server/routes/contentRoutes.js).
No app-icon campaign model, schedules migration, resolved endpoint, admin endpoints, src/services/iconService.ts,
src/hooks/useFestivalIcon.ts, or iOS AppIconSwitcher native bridge exists in this checkout.
There is therefore no existing iconService.ts content to show. Its complete new contents appear in the Part 3 diff.
iOS native files and Navratri assets/mappings were not changed. The shared service includes the requested iOS mapping,
but the hook skips iOS when its native bridge is absent. Once an iOS bridge is supplied, confirm its setAppIcon
signature accepts alternate names and null for restoring default before enabling it.

Original application block, including MainActivity and its MAIN/LAUNCHER filter:

```xml
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:supportsRtl="true">

        <!-- Google Maps API key - replace with your key from Google Cloud Console -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE" />

        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="reward_planners_general"
            tools:replace="android:value" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">

            <!-- Launcher -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep Link -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />

                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />

                <data android:scheme="rewardplanners" />
            </intent-filter>

            <!-- Health Connect Permissions Rationale -->
            <intent-filter>
                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />

                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>

            <!-- Health Permissions Metadata -->
            <meta-data
                android:name="health_permissions"
                android:resource="@array/health_permissions" />
        </activity>

        <!-- Required for Health Connect permission usage -->
        <activity-alias
            android:name="ViewPermissionUsageActivity"
            android:exported="true"
            android:targetActivity=".MainActivity"
            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">

            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />

                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>

    </application>
```

## Part 1 - Contract and deployment

- Public GET /content/resolved/app-icon?platform=android or platform=ios returns
  {"success":true,"data":{"platform":"android","icon_key":"diwali"}}.
- The specific route is registered before /resolved/:module.
- One app_icon_campaigns table stores independent iOS and Android rows. No platform/key/window uniqueness
  prevents identical festival windows on both platforms.
- Active schedules include starts_at <= now <= ends_at. Highest priority wins; starts_at then id break ties.
  No active match returns default. Resolution uses UTC_TIMESTAMP(3).
- Allowed keys for both platforms: default, diwali, eid, christmas, holi, independence_day.
- All seven /content/app-icons admin endpoints use existing authenticateToken and authorizeRoles("admin").
  GET /app-icons/keys requires platform and returns {platform, icon_keys}. GET /app-icons optionally filters platform.
  POST requires platform, icon_key, starts_at and ends_at; priority defaults to 0 and is_active defaults to true.
  PUT accepts partial updates. Dates must be ISO 8601 with Z or an explicit timezone offset.
- Apply src/server/migrations/20261007_01_create_app_icon_campaigns.sql to the deployment database before deploying
  these routes. This agent did not connect to or migrate any live database. CREATE TABLE IF NOT EXISTS does not alter
  an independently created production table: inspect its columns if a table already exists outside this checkout.
- Then deploy/restart the backend and verify both platform requests. Production uses /api/crm/content;
  local requests use /content through the existing cmsApi configuration.

Example Android POST body (administrator authentication required):

```json
{
  "platform": "android",
  "icon_key": "diwali",
  "starts_at": "2026-10-01T00:00:00Z",
  "ends_at": "2026-11-01T00:00:00Z",
  "priority": 10,
  "is_active": true
}
```

## Part 2 - Android behavior and artwork

The implementation intentionally uses a DefaultIconAlias alongside the five festival aliases, and removes only
MainActivity's MAIN/LAUNCHER filter. MainActivity itself remains enabled to preserve alias launching, deep links,
and Health Connect. This differs from the requested MainActivity disable/enable design: PackageManager toggles an
entire activity, not one of its intent filters. Disabling the real target is not a reliable launcher-filter switch.

The six .icons.*IconAlias entries target .MainActivity and use @string/app_name (Reward Planners).
Only DefaultIconAlias is manifest-enabled. The Kotlin bridge owns the key-to-ComponentName map,
uses DONT_KILL_APP, skips no-op switches, attempts rollback after failed changes, and rejects errors via the promise.
Unknown keys select DefaultIconAlias.

On Android 13/API 33 and later, setComponentEnabledSettings applies all six changes atomically.
On Android 12 and earlier, no batch API exists: enabling the replacement first avoids zero launcher entries,
but may temporarily expose two entries. Exactly one is enabled when a successful switch completes.
A strict never-zero AND never-two guarantee during every intermediate step is unavailable on those older APIs.
See [Android PackageManager documentation](https://developer.android.com/reference/android/content/pm/PackageManager#setComponentEnabledSettings(java.util.List))
and [activity-alias documentation](https://developer.android.com/guide/topics/manifest/activity-alias-element).

All five festivals have PNG placeholders in mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi (25 new PNGs) and adaptive-icon XML
in mipmap-anydpi-v26. The PNGs are byte-for-byte copies of each density's default icon. Adaptive XML shares the existing
default foreground/background layers. These are NOT festival artwork. Before shipping, supply real 1024x1024 festival
masters, export every density, create dedicated adaptive foreground/background resources per festival, and update the
five adaptive XML references. Replacing only the PNGs will not change the icon on adaptive-icon devices.

Binary additions appear as Git binary-file markers in the full diff below. No Navratri aliases or assets were added.
The previous app-name change in res/values/strings.xml existed before this task and was preserved.

## Part 3 - Shared lifecycle

App.tsx mounts useFestivalIcon. It refreshes on startup while active and on foreground.
iconService uses the existing cmsApi client and selects platform=android or platform=ios from Platform.OS.
Android receives the supported icon key; native code owns alias mapping.
The requested iOS map is present, with null for default restoration, but no iOS native implementation was invented.
Concurrent refreshes share one request. Responses are validated before any native call.
No last-icon JS cache is used, so native enabled-component state remains the source of truth across app restarts.

## Part 4 - Parity, verification and rollout

- Unknown string keys (including navratri and independence-day) restore default.
- Network/API failures, unsuccessful responses, wrong-platform responses and missing/non-string icon keys preserve
  the current icon. They do not call the native setter. A native setter failure rejects and attempts rollback.
- Alias changes can produce brief home-screen disappearance/reappearance or OEM-dependent relaunch behavior even with
  DONT_KILL_APP. Launcher refresh behavior is an OS/OEM limitation; code cannot force a uniform refresh.
  Test at least 2-3 real devices (for example Pixel, Samsung, and another OEM) before rollout.
- Focused tests passed: 5 backend tests and 5 Jest tests. These mock database/network/native bridges;
  a live MySQL integration test and physical-device icon-switching test have not been performed.
- TypeScript typecheck passed. Android :app:compileDebugKotlin and :app:processDebugResources passed.
- All six manifest launcher aliases and the 25 identical placeholder PNGs were checked.
- Play Console listing names are separate from launcher labels and remain a manual review.

Device verification after the backend migration/deployment:

1. Build and install the debug app using the commands below. Uninstall only for a fresh-install test;
   it deletes local app data. Also test upgrading an existing installation without uninstalling.
2. Verify default is the only launcher entry before any campaign.
3. Activate an Android campaign, foreground the app, and check the launcher component with
   adb shell dumpsys package com.rewardsplanners. Artwork currently looks identical by design.
4. Exercise all five festival keys, default restoration, scheduling expiry, priorities and separate iOS/Android rows.
5. Reopen from the selected alias and exercise rewardplanners://login deep links and Health Connect.
6. Disable network access and confirm the existing alias stays selected across foreground/restart.
7. Test both Android <=12 and >=13, plus an app upgrade while a festival alias is active.

PowerShell from the repository root (adb on PATH, connected device/emulator):

```powershell
adb devices
adb uninstall com.rewardsplanners
cd android
.\gradlew.bat clean
.\gradlew.bat :app:assembleDebug
adb install .\app\build\outputs\apk\debug\app-debug.apk
cd ..
npm start
```

For an upgrade test, omit uninstall and use adb install -r instead.
Test commands:

```powershell
node --test src/server/tests/appIcon.test.js
npx jest src/services/__tests__/iconService.test.ts --runInBand
npx tsc --noEmit
cd android
.\gradlew.bat :app:compileDebugKotlin :app:processDebugResources
```

## Full Implementation Diff

Grouped by requested part number. Part 4 has no additional runtime files; its notes are above.
This review document is an output artifact and is not recursively included in its own diff.

## Part 1 - Backend

```diff
diff --git a/src/server/routes/contentRoutes.js b/src/server/routes/contentRoutes.js
index 769f07a..98c65a5 100644
--- a/src/server/routes/contentRoutes.js
+++ b/src/server/routes/contentRoutes.js
@@ -2,6 +2,8 @@ const express = require("express");
 const router = express.Router();
 const contentController = require("../controllers/contentController");
 const moduleIconController = require("../controllers/moduleIconController");
+const appIconController = require("../controllers/appIconController");
+const { authenticateToken, authorizeRoles } = require("../middleware/auth");
 const { uploadContentImage } = require("../middleware/mediaUpload/contentUpload");
 
 // Keep in sync with MAX_OFFER_IMAGES in controllers/contentController.js.
@@ -46,6 +48,15 @@ const handleUpload = (middleware) => (req, res, next) => {
 
 // ================================= ADMIN ROUTES =================================
 
+const appIconAdmin = [authenticateToken, authorizeRoles("admin")];
+router.get("/app-icons/keys", ...appIconAdmin, appIconController.keys);
+router.get("/app-icons", ...appIconAdmin, appIconController.list);
+router.get("/app-icons/:id", ...appIconAdmin, appIconController.get);
+router.post("/app-icons", ...appIconAdmin, appIconController.create);
+router.put("/app-icons/:id", ...appIconAdmin, appIconController.update);
+router.patch("/app-icons/:id/deactivate", ...appIconAdmin, appIconController.deactivate);
+router.delete("/app-icons/:id", ...appIconAdmin, appIconController.delete);
+
 router.post(
   "/entries",
   handleUpload(uploadEntryFiles),
@@ -140,6 +151,7 @@ router.delete(
 // ================================= PUBLIC (storefront/app) =================================
 
 router.get("/resolved/navbar", contentController.getResolvedNavbar);
+router.get("/resolved/app-icon", appIconController.resolve);
 // Must be registered before the "/resolved/:module" wildcard below, or a request for
 // "modules" would be captured as module="modules" and hit getResolvedZones instead.
 router.get("/resolved/modules", moduleIconController.getResolvedModules);
diff --git a/src/server/controllers/appIconController.js b/src/server/controllers/appIconController.js
new file mode 100644
index 0000000..86344ff
--- /dev/null
+++ b/src/server/controllers/appIconController.js
@@ -0,0 +1,22 @@
+const model = require("../models/appIconModel");
+
+const handler = (action, status = 200) => async (req, res) => {
+  try {
+    const data = await action(req);
+    res.set("Cache-Control", "no-store");
+    return res.status(status).json({ success: true, data });
+  } catch (error) {
+    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
+  }
+};
+
+module.exports = {
+  resolve: handler((req) => model.resolve(req.query.platform)),
+  keys: handler((req) => ({ platform: model.validatePlatform(req.query.platform), icon_keys: model.ICON_KEYS })),
+  list: handler((req) => model.list(req.query.platform)),
+  get: handler((req) => model.getById(req.params.id)),
+  create: handler((req) => model.create(req.body), 201),
+  update: handler((req) => model.update(req.params.id, req.body)),
+  deactivate: handler((req) => model.deactivate(req.params.id)),
+  delete: handler((req) => model.delete(req.params.id)),
+};
diff --git a/src/server/models/appIconModel.js b/src/server/models/appIconModel.js
new file mode 100644
index 0000000..aae7913
--- /dev/null
+++ b/src/server/models/appIconModel.js
@@ -0,0 +1,106 @@
+const db = require("../config/database");
+
+const ICON_KEYS = ["default", "diwali", "eid", "christmas", "holi", "independence_day"];
+const PLATFORMS = ["ios", "android"];
+const fail = (message, statusCode = 400) => {
+  throw Object.assign(new Error(message), { statusCode });
+};
+
+const validatePlatform = (platform) => {
+  if (!PLATFORMS.includes(platform)) fail("platform must be ios or android");
+  return platform;
+};
+
+const validateId = (id) => {
+  if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) fail("Invalid campaign id");
+  return Number(id);
+};
+
+const toUtcSqlDate = (value) => {
+  // Require a timezone so admin schedules resolve consistently across servers.
+  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
+    fail("Schedule dates must be ISO 8601 timestamps with a timezone");
+  }
+  const date = new Date(value);
+  if (!Number.isFinite(date.getTime())) fail("Invalid schedule date");
+  return date.toISOString().slice(0, 23).replace("T", " ");
+};
+
+const validateCampaign = (data) => {
+  validatePlatform(data.platform);
+  if (!ICON_KEYS.includes(data.icon_key)) fail("Unsupported icon_key");
+  const startsAt = toUtcSqlDate(data.starts_at);
+  const endsAt = toUtcSqlDate(data.ends_at);
+  if (endsAt <= startsAt) fail("ends_at must be after starts_at");
+  const priority = data.priority === undefined ? 0 : data.priority;
+  if (!Number.isInteger(priority) || priority < -2147483648 || priority > 2147483647) fail("priority must be a 32-bit integer");
+  const active = data.is_active === undefined ? true : data.is_active;
+  if (![true, false, 0, 1].includes(active)) fail("is_active must be a boolean or 0/1");
+  return [data.platform, data.icon_key, startsAt, endsAt, priority, Number(active)];
+};
+
+const getById = async (id) => {
+  const [rows] = await db.execute("SELECT * FROM app_icon_campaigns WHERE id = ?", [validateId(id)]);
+  if (!rows[0]) fail("App icon campaign not found", 404);
+  return rows[0];
+};
+
+module.exports = {
+  ICON_KEYS,
+  validatePlatform,
+  validateCampaign,
+  getById,
+  async resolve(platform) {
+    validatePlatform(platform);
+    const [rows] = await db.execute(
+      `SELECT icon_key FROM app_icon_campaigns
+       WHERE platform = ? AND is_active = 1
+         AND starts_at <= UTC_TIMESTAMP(3) AND ends_at >= UTC_TIMESTAMP(3)
+       ORDER BY priority DESC, starts_at DESC, id DESC LIMIT 1`,
+      [platform],
+    );
+    return { platform, icon_key: ICON_KEYS.includes(rows[0]?.icon_key) ? rows[0].icon_key : "default" };
+  },
+  async list(platform) {
+    if (platform !== undefined) validatePlatform(platform);
+    const [rows] = await db.execute(
+      `SELECT * FROM app_icon_campaigns${platform === undefined ? "" : " WHERE platform = ?"} ORDER BY priority DESC, id DESC`,
+      platform === undefined ? [] : [platform],
+    );
+    return rows;
+  },
+  async create(data) {
+    const values = validateCampaign(data);
+    const [result] = await db.execute(
+      "INSERT INTO app_icon_campaigns (platform, icon_key, starts_at, ends_at, priority, is_active) VALUES (?, ?, ?, ?, ?, ?)",
+      values,
+    );
+    return getById(result.insertId);
+  },
+  async update(id, data) {
+    const existing = await getById(id);
+    // Stored DATETIME values are UTC; convert them to the accepted API format.
+    const merged = {
+      ...existing,
+      starts_at: String(existing.starts_at).replace(" ", "T") + "Z",
+      ends_at: String(existing.ends_at).replace(" ", "T") + "Z",
+      ...data,
+    };
+    const values = validateCampaign(merged);
+    await db.execute(
+      "UPDATE app_icon_campaigns SET platform = ?, icon_key = ?, starts_at = ?, ends_at = ?, priority = ?, is_active = ? WHERE id = ?",
+      [...values, validateId(id)],
+    );
+    return getById(id);
+  },
+  async deactivate(id) {
+    await getById(id);
+    await db.execute("UPDATE app_icon_campaigns SET is_active = 0 WHERE id = ?", [validateId(id)]);
+    return getById(id);
+  },
+  async delete(id) {
+    await getById(id);
+    await db.execute("DELETE FROM app_icon_campaigns WHERE id = ?", [validateId(id)]);
+    return { id: Number(id) };
+  },
+};
diff --git a/src/server/migrations/20261007_01_create_app_icon_campaigns.sql b/src/server/migrations/20261007_01_create_app_icon_campaigns.sql
new file mode 100644
index 0000000..b928d47
--- /dev/null
+++ b/src/server/migrations/20261007_01_create_app_icon_campaigns.sql
@@ -0,0 +1,13 @@
+-- Schedule timestamps are UTC. iOS and Android campaigns share this table.
+CREATE TABLE IF NOT EXISTS app_icon_campaigns (
+  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
+  platform ENUM('ios', 'android') NOT NULL,
+  icon_key ENUM('default', 'diwali', 'eid', 'christmas', 'holi', 'independence_day') NOT NULL,
+  starts_at DATETIME(3) NOT NULL,
+  ends_at DATETIME(3) NOT NULL,
+  priority INT NOT NULL DEFAULT 0,
+  is_active TINYINT(1) NOT NULL DEFAULT 1,
+  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
+  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
+  INDEX idx_app_icon_resolution (platform, is_active, starts_at, ends_at, priority)
+);
diff --git a/src/server/tests/appIcon.test.js b/src/server/tests/appIcon.test.js
new file mode 100644
index 0000000..6d5ed4e
--- /dev/null
+++ b/src/server/tests/appIcon.test.js
@@ -0,0 +1,100 @@
+const { test } = require("node:test");
+const assert = require("node:assert/strict");
+
+const databasePath = require.resolve("../config/database");
+let rows = [];
+let calls = [];
+require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: {
+  execute: async (sql, params) => { calls.push({ sql, params }); return [rows]; },
+} };
+const model = require("../models/appIconModel");
+const controller = require("../controllers/appIconController");
+
+const campaign = {
+  platform: "android", icon_key: "diwali",
+  starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-11-01T00:00:00Z",
+  priority: 10, is_active: true,
+};
+
+test("validates both platforms, exact icon keys, timezone, date order, priority and active flag", () => {
+  for (const platform of ["ios", "android"]) {
+    assert.equal(model.validateCampaign({ ...campaign, platform })[0], platform);
+  }
+  for (const override of [
+    { platform: "web" }, { icon_key: "navratri" }, { icon_key: "independence-day" },
+    { starts_at: "2026-10-01T00:00:00" }, { ends_at: campaign.starts_at },
+    { priority: 1.2 }, { is_active: "false" },
+  ]) assert.throws(() => model.validateCampaign({ ...campaign, ...override }), { statusCode: 400 });
+  assert.equal(model.validateCampaign({ ...campaign, starts_at: "2026-10-01T05:30:00+05:30" })[2], "2026-10-01 00:00:00.000");
+});
+
+test("resolution filters active platform schedules in UTC and orders priority with deterministic ties", async () => {
+  calls = [];
+  rows = [{ icon_key: "diwali" }];
+  assert.deepEqual(await model.resolve("android"), { platform: "android", icon_key: "diwali" });
+  assert.deepEqual(calls[0].params, ["android"]);
+  assert.match(calls[0].sql, /is_active = 1/);
+  assert.match(calls[0].sql, /starts_at <= UTC_TIMESTAMP\(3\) AND ends_at >= UTC_TIMESTAMP\(3\)/);
+  assert.match(calls[0].sql, /ORDER BY priority DESC, starts_at DESC, id DESC LIMIT 1/);
+  rows = [];
+  assert.deepEqual(await model.resolve("ios"), { platform: "ios", icon_key: "default" });
+  rows = [{ icon_key: "navratri" }];
+  assert.equal((await model.resolve("android")).icon_key, "default");
+});
+
+test("invalid platforms do not query the database", async () => {
+  calls = [];
+  await assert.rejects(model.resolve("web"), { statusCode: 400 });
+  assert.equal(calls.length, 0);
+});
+
+test("controller returns contract and validation errors without converting failures to default", async () => {
+  const res = {
+    statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; },
+    json(body) { this.body = body; return this; },
+  };
+  rows = [];
+  await controller.resolve({ query: { platform: "android" } }, res);
+  assert.deepEqual(res.body, { success: true, data: { platform: "android", icon_key: "default" } });
+  await controller.resolve({ query: { platform: "web" } }, res);
+  assert.equal(res.statusCode, 400);
+  assert.equal(res.body.success, false);
+});
+
+test("specific resolver precedes wildcard and every app-icon admin endpoint requires admin authentication", () => {
+  const dependencies = {};
+  const stub = (relativePath, exports) => { dependencies[relativePath] = exports; };
+  const noop = () => {};
+  stub("../controllers/contentController", new Proxy({}, { get: () => noop }));
+  stub("../controllers/moduleIconController", new Proxy({}, { get: () => noop }));
+  stub("../middleware/mediaUpload/contentUpload", { uploadContentImage: { fields: () => noop, array: () => noop } });
+  const authenticate = () => {};
+  const authorize = () => {};
+  stub("../middleware/auth", {
+    authenticateToken: authenticate,
+    authorizeRoles: (...roles) => { assert.deepEqual(roles, ["admin"]); return authorize; },
+  });
+  const routes = [];
+  const router = {};
+  for (const method of ["get", "post", "put", "patch", "delete"]) {
+    router[method] = (path, ...handlers) => routes.push({ path, stack: handlers.map((handle) => ({ handle })) });
+  }
+  stub("express", { Router: () => router });
+  stub("../controllers/appIconController", controller);
+  const source = require("node:fs").readFileSync(require.resolve("../routes/contentRoutes"), "utf8");
+  require("node:vm").runInNewContext(source, {
+    module: { exports: {} },
+    require: (path) => {
+      if (!(path in dependencies)) throw new Error(`Unexpected dependency: ${path}`);
+      return dependencies[path];
+    },
+  });
+  assert.ok(routes.findIndex((route) => route.path === "/resolved/app-icon") < routes.findIndex((route) => route.path === "/resolved/:module"));
+  const adminRoutes = routes.filter((route) => route.path.startsWith("/app-icons"));
+  assert.equal(adminRoutes.length, 7);
+  for (const route of adminRoutes) {
+    assert.equal(route.stack[0].handle, authenticate);
+    assert.equal(route.stack[1].handle, authorize);
+  }
+  assert.ok(routes.findIndex((route) => route.path === "/app-icons/keys") < routes.findIndex((route) => route.path === "/app-icons/:id"));
+});
```

## Part 2 - Android native

```diff
diff --git a/android/app/src/main/AndroidManifest.xml b/android/app/src/main/AndroidManifest.xml
index cb3f1a9..60f1af3 100644
--- a/android/app/src/main/AndroidManifest.xml
+++ b/android/app/src/main/AndroidManifest.xml
@@ -62,12 +62,6 @@
             android:windowSoftInputMode="adjustResize"
             android:exported="true">
 
-            <!-- Launcher -->
-            <intent-filter>
-                <action android:name="android.intent.action.MAIN" />
-                <category android:name="android.intent.category.LAUNCHER" />
-            </intent-filter>
-
             <!-- Deep Link -->
             <intent-filter>
                 <action android:name="android.intent.action.VIEW" />
@@ -91,6 +85,85 @@
                 android:resource="@array/health_permissions" />
         </activity>
 
+        <!-- Keep MainActivity enabled for aliases, deep links, and Health Connect. -->
+        <activity-alias
+            android:name=".icons.DefaultIconAlias"
+            android:enabled="true"
+            android:targetActivity=".MainActivity"
+            android:icon="@mipmap/ic_launcher"
+            android:label="@string/app_name"
+            android:exported="true">
+            <intent-filter>
+                <action android:name="android.intent.action.MAIN" />
+                <category android:name="android.intent.category.LAUNCHER" />
+            </intent-filter>
+        </activity-alias>
+
+        <activity-alias
+            android:name=".icons.DiwaliIconAlias"
+            android:enabled="false"
+            android:targetActivity=".MainActivity"
+            android:icon="@mipmap/ic_launcher_diwali"
+            android:label="@string/app_name"
+            android:exported="true">
+            <intent-filter>
+                <action android:name="android.intent.action.MAIN" />
+                <category android:name="android.intent.category.LAUNCHER" />
+            </intent-filter>
+        </activity-alias>
+
+        <activity-alias
+            android:name=".icons.EidIconAlias"
+            android:enabled="false"
+            android:targetActivity=".MainActivity"
+            android:icon="@mipmap/ic_launcher_eid"
+            android:label="@string/app_name"
+            android:exported="true">
+            <intent-filter>
+                <action android:name="android.intent.action.MAIN" />
+                <category android:name="android.intent.category.LAUNCHER" />
+            </intent-filter>
+        </activity-alias>
+
+        <activity-alias
+            android:name=".icons.ChristmasIconAlias"
+            android:enabled="false"
+            android:targetActivity=".MainActivity"
+            android:icon="@mipmap/ic_launcher_christmas"
+            android:label="@string/app_name"
+            android:exported="true">
+            <intent-filter>
+                <action android:name="android.intent.action.MAIN" />
+                <category android:name="android.intent.category.LAUNCHER" />
+            </intent-filter>
+        </activity-alias>
+
+        <activity-alias
+            android:name=".icons.HoliIconAlias"
+            android:enabled="false"
+            android:targetActivity=".MainActivity"
+            android:icon="@mipmap/ic_launcher_holi"
+            android:label="@string/app_name"
+            android:exported="true">
+            <intent-filter>
+                <action android:name="android.intent.action.MAIN" />
+                <category android:name="android.intent.category.LAUNCHER" />
+            </intent-filter>
+        </activity-alias>
+
+        <activity-alias
+            android:name=".icons.IndependenceDayIconAlias"
+            android:enabled="false"
+            android:targetActivity=".MainActivity"
+            android:icon="@mipmap/ic_launcher_independence_day"
+            android:label="@string/app_name"
+            android:exported="true">
+            <intent-filter>
+                <action android:name="android.intent.action.MAIN" />
+                <category android:name="android.intent.category.LAUNCHER" />
+            </intent-filter>
+        </activity-alias>
+
         <!-- Required for Health Connect permission usage -->
         <activity-alias
             android:name="ViewPermissionUsageActivity"
diff --git a/android/app/src/main/java/com/rewardsplanners/MainApplication.kt b/android/app/src/main/java/com/rewardsplanners/MainApplication.kt
index b6f1166..734df53 100644
--- a/android/app/src/main/java/com/rewardsplanners/MainApplication.kt
+++ b/android/app/src/main/java/com/rewardsplanners/MainApplication.kt
@@ -1,6 +1,7 @@
 package com.rewardsplanners
 
 import android.app.Application
+import com.rewardsplanners.icons.AppIconSwitcherPackage
 import com.facebook.react.PackageList
 import com.facebook.react.ReactApplication
 import com.facebook.react.ReactHost
@@ -17,6 +18,7 @@ class MainApplication : Application(), ReactApplication {
           // Packages that cannot be autolinked yet can be added manually here, for example:
           // add(MyReactNativePackage())
           add(PhoneNumberHintPackage())
+          add(AppIconSwitcherPackage())
         },
     )
   }
diff --git a/android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherModule.kt b/android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherModule.kt
new file mode 100644
index 0000000..a6d1c51
--- /dev/null
+++ b/android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherModule.kt
@@ -0,0 +1,72 @@
+package com.rewardsplanners.icons
+
+import android.content.ComponentName
+import android.content.pm.PackageManager
+import android.os.Build
+import com.facebook.react.bridge.Promise
+import com.facebook.react.bridge.ReactApplicationContext
+import com.facebook.react.bridge.ReactContextBaseJavaModule
+import com.facebook.react.bridge.ReactMethod
+
+class AppIconSwitcherModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
+  override fun getName() = "AppIconSwitcherModule"
+
+  private val aliases = mapOf(
+    "default" to "DefaultIconAlias",
+    "diwali" to "DiwaliIconAlias",
+    "eid" to "EidIconAlias",
+    "christmas" to "ChristmasIconAlias",
+    "holi" to "HoliIconAlias",
+    "independence_day" to "IndependenceDayIconAlias",
+  ).mapValues { (_, name) -> ComponentName(context.packageName, "com.rewardsplanners.icons.$name") }
+
+  private fun applyStates(states: Map<ComponentName, Int>) {
+    val manager = reactApplicationContext.packageManager
+    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
+      manager.setComponentEnabledSettings(states.map { (component, state) ->
+        PackageManager.ComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
+      })
+    } else {
+      // Older Android cannot batch atomically. Enable the target before removing the old entry.
+      states.entries.sortedBy { if (it.value == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) 0 else 1 }
+        .forEach { (component, state) ->
+          manager.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
+        }
+    }
+  }
+
+  @ReactMethod
+  @Synchronized
+  fun setAppIcon(iconKey: String, promise: Promise) {
+    try {
+      val manager = reactApplicationContext.packageManager
+      val target = aliases[iconKey] ?: aliases.getValue("default")
+      val previous = aliases.values.associateWith { component ->
+        val state = manager.getComponentEnabledSetting(component)
+        if (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT) {
+          if (component == aliases.getValue("default")) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
+          else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
+        } else state
+      }
+      val desired = aliases.values.associateWith { component ->
+        if (component == target) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
+        else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
+      }
+      if (previous != desired) {
+        try {
+          applyStates(desired)
+        } catch (error: Exception) {
+          try {
+            applyStates(previous)
+          } catch (rollbackError: Exception) {
+            error.addSuppressed(rollbackError)
+          }
+          throw error
+        }
+      }
+      promise.resolve(null)
+    } catch (error: Exception) {
+      promise.reject("APP_ICON_SWITCH_FAILED", "Could not switch the launcher icon", error)
+    }
+  }
+}
diff --git a/android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherPackage.kt b/android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherPackage.kt
new file mode 100644
index 0000000..81ed67b
--- /dev/null
+++ b/android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherPackage.kt
@@ -0,0 +1,13 @@
+package com.rewardsplanners.icons
+
+import com.facebook.react.ReactPackage
+import com.facebook.react.bridge.NativeModule
+import com.facebook.react.bridge.ReactApplicationContext
+import com.facebook.react.uimanager.ViewManager
+
+class AppIconSwitcherPackage : ReactPackage {
+  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
+    listOf(AppIconSwitcherModule(context))
+
+  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
+}
diff --git a/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_diwali.xml b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_diwali.xml
new file mode 100644
index 0000000..d6ed6dd
--- /dev/null
+++ b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_diwali.xml
@@ -0,0 +1,6 @@
+<?xml version="1.0" encoding="utf-8"?>
+<!-- Placeholder: replace with dedicated festival layers before release. -->
+<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
+  <background android:drawable="@mipmap/ic_launcher_adaptive_back" />
+  <foreground android:drawable="@mipmap/ic_launcher_adaptive_fore" />
+</adaptive-icon>
diff --git a/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_eid.xml b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_eid.xml
new file mode 100644
index 0000000..d6ed6dd
--- /dev/null
+++ b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_eid.xml
@@ -0,0 +1,6 @@
+<?xml version="1.0" encoding="utf-8"?>
+<!-- Placeholder: replace with dedicated festival layers before release. -->
+<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
+  <background android:drawable="@mipmap/ic_launcher_adaptive_back" />
+  <foreground android:drawable="@mipmap/ic_launcher_adaptive_fore" />
+</adaptive-icon>
diff --git a/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_christmas.xml b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_christmas.xml
new file mode 100644
index 0000000..d6ed6dd
--- /dev/null
+++ b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_christmas.xml
@@ -0,0 +1,6 @@
+<?xml version="1.0" encoding="utf-8"?>
+<!-- Placeholder: replace with dedicated festival layers before release. -->
+<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
+  <background android:drawable="@mipmap/ic_launcher_adaptive_back" />
+  <foreground android:drawable="@mipmap/ic_launcher_adaptive_fore" />
+</adaptive-icon>
diff --git a/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_holi.xml b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_holi.xml
new file mode 100644
index 0000000..d6ed6dd
--- /dev/null
+++ b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_holi.xml
@@ -0,0 +1,6 @@
+<?xml version="1.0" encoding="utf-8"?>
+<!-- Placeholder: replace with dedicated festival layers before release. -->
+<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
+  <background android:drawable="@mipmap/ic_launcher_adaptive_back" />
+  <foreground android:drawable="@mipmap/ic_launcher_adaptive_fore" />
+</adaptive-icon>
diff --git a/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_independence_day.xml b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_independence_day.xml
new file mode 100644
index 0000000..d6ed6dd
--- /dev/null
+++ b/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_independence_day.xml
@@ -0,0 +1,6 @@
+<?xml version="1.0" encoding="utf-8"?>
+<!-- Placeholder: replace with dedicated festival layers before release. -->
+<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
+  <background android:drawable="@mipmap/ic_launcher_adaptive_back" />
+  <foreground android:drawable="@mipmap/ic_launcher_adaptive_fore" />
+</adaptive-icon>
diff --git a/android/app/src/main/res/mipmap-mdpi/ic_launcher_diwali.png b/android/app/src/main/res/mipmap-mdpi/ic_launcher_diwali.png
new file mode 100644
index 0000000..47aa612
Binary files /dev/null and b/android/app/src/main/res/mipmap-mdpi/ic_launcher_diwali.png differ
diff --git a/android/app/src/main/res/mipmap-mdpi/ic_launcher_eid.png b/android/app/src/main/res/mipmap-mdpi/ic_launcher_eid.png
new file mode 100644
index 0000000..47aa612
Binary files /dev/null and b/android/app/src/main/res/mipmap-mdpi/ic_launcher_eid.png differ
diff --git a/android/app/src/main/res/mipmap-mdpi/ic_launcher_christmas.png b/android/app/src/main/res/mipmap-mdpi/ic_launcher_christmas.png
new file mode 100644
index 0000000..47aa612
Binary files /dev/null and b/android/app/src/main/res/mipmap-mdpi/ic_launcher_christmas.png differ
diff --git a/android/app/src/main/res/mipmap-mdpi/ic_launcher_holi.png b/android/app/src/main/res/mipmap-mdpi/ic_launcher_holi.png
new file mode 100644
index 0000000..47aa612
Binary files /dev/null and b/android/app/src/main/res/mipmap-mdpi/ic_launcher_holi.png differ
diff --git a/android/app/src/main/res/mipmap-mdpi/ic_launcher_independence_day.png b/android/app/src/main/res/mipmap-mdpi/ic_launcher_independence_day.png
new file mode 100644
index 0000000..47aa612
Binary files /dev/null and b/android/app/src/main/res/mipmap-mdpi/ic_launcher_independence_day.png differ
diff --git a/android/app/src/main/res/mipmap-hdpi/ic_launcher_diwali.png b/android/app/src/main/res/mipmap-hdpi/ic_launcher_diwali.png
new file mode 100644
index 0000000..733d5d7
Binary files /dev/null and b/android/app/src/main/res/mipmap-hdpi/ic_launcher_diwali.png differ
diff --git a/android/app/src/main/res/mipmap-hdpi/ic_launcher_eid.png b/android/app/src/main/res/mipmap-hdpi/ic_launcher_eid.png
new file mode 100644
index 0000000..733d5d7
Binary files /dev/null and b/android/app/src/main/res/mipmap-hdpi/ic_launcher_eid.png differ
diff --git a/android/app/src/main/res/mipmap-hdpi/ic_launcher_christmas.png b/android/app/src/main/res/mipmap-hdpi/ic_launcher_christmas.png
new file mode 100644
index 0000000..733d5d7
Binary files /dev/null and b/android/app/src/main/res/mipmap-hdpi/ic_launcher_christmas.png differ
diff --git a/android/app/src/main/res/mipmap-hdpi/ic_launcher_holi.png b/android/app/src/main/res/mipmap-hdpi/ic_launcher_holi.png
new file mode 100644
index 0000000..733d5d7
Binary files /dev/null and b/android/app/src/main/res/mipmap-hdpi/ic_launcher_holi.png differ
diff --git a/android/app/src/main/res/mipmap-hdpi/ic_launcher_independence_day.png b/android/app/src/main/res/mipmap-hdpi/ic_launcher_independence_day.png
new file mode 100644
index 0000000..733d5d7
Binary files /dev/null and b/android/app/src/main/res/mipmap-hdpi/ic_launcher_independence_day.png differ
diff --git a/android/app/src/main/res/mipmap-xhdpi/ic_launcher_diwali.png b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_diwali.png
new file mode 100644
index 0000000..c550ace
Binary files /dev/null and b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_diwali.png differ
diff --git a/android/app/src/main/res/mipmap-xhdpi/ic_launcher_eid.png b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_eid.png
new file mode 100644
index 0000000..c550ace
Binary files /dev/null and b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_eid.png differ
diff --git a/android/app/src/main/res/mipmap-xhdpi/ic_launcher_christmas.png b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_christmas.png
new file mode 100644
index 0000000..c550ace
Binary files /dev/null and b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_christmas.png differ
diff --git a/android/app/src/main/res/mipmap-xhdpi/ic_launcher_holi.png b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_holi.png
new file mode 100644
index 0000000..c550ace
Binary files /dev/null and b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_holi.png differ
diff --git a/android/app/src/main/res/mipmap-xhdpi/ic_launcher_independence_day.png b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_independence_day.png
new file mode 100644
index 0000000..c550ace
Binary files /dev/null and b/android/app/src/main/res/mipmap-xhdpi/ic_launcher_independence_day.png differ
diff --git a/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_diwali.png b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_diwali.png
new file mode 100644
index 0000000..c7fb7bb
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_diwali.png differ
diff --git a/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_eid.png b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_eid.png
new file mode 100644
index 0000000..c7fb7bb
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_eid.png differ
diff --git a/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_christmas.png b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_christmas.png
new file mode 100644
index 0000000..c7fb7bb
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_christmas.png differ
diff --git a/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_holi.png b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_holi.png
new file mode 100644
index 0000000..c7fb7bb
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_holi.png differ
diff --git a/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_independence_day.png b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_independence_day.png
new file mode 100644
index 0000000..c7fb7bb
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_independence_day.png differ
diff --git a/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_diwali.png b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_diwali.png
new file mode 100644
index 0000000..796ac4f
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_diwali.png differ
diff --git a/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_eid.png b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_eid.png
new file mode 100644
index 0000000..796ac4f
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_eid.png differ
diff --git a/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_christmas.png b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_christmas.png
new file mode 100644
index 0000000..796ac4f
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_christmas.png differ
diff --git a/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_holi.png b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_holi.png
new file mode 100644
index 0000000..796ac4f
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_holi.png differ
diff --git a/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_independence_day.png b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_independence_day.png
new file mode 100644
index 0000000..796ac4f
Binary files /dev/null and b/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_independence_day.png differ
```

## Part 3 - Shared JS/TS

```diff
diff --git a/App.tsx b/App.tsx
index 1eadc95..7775396 100644
--- a/App.tsx
+++ b/App.tsx
@@ -11,6 +11,7 @@ import { queryClient } from './src/query/queryClient';
 import { AppThemeProvider } from "./src/theme/ThemeContext";
 import NetworkGuard from './src/modules/common/noInternet/NetworkGuard';
 import PushNotificationManager from './src/modules/common/notifications/PushNotificationManager';
+import { useFestivalIcon } from './src/hooks/useFestivalIcon';
 type AuthModalStackParamList = {
   Login: undefined;
   LoginOTP: { identifier: string };
@@ -37,6 +38,7 @@ const linking: LinkingOptions<RootStackParamList> = {
 };
 
 export default function App() {
+  useFestivalIcon();
   return (
     <SafeAreaProvider>
       <QueryClientProvider client={queryClient}>
diff --git a/src/services/iconService.ts b/src/services/iconService.ts
new file mode 100644
index 0000000..31d2bee
--- /dev/null
+++ b/src/services/iconService.ts
@@ -0,0 +1,58 @@
+import { NativeModules, Platform } from 'react-native';
+import { cmsApi } from '../config/cmsApiClient';
+
+export const ICON_MAP = {
+  ios: {
+    default: 'AppIcon',
+    diwali: 'DiwaliIcon',
+    eid: 'EidIcon',
+    christmas: 'ChristmasIcon',
+    holi: 'HoliIcon',
+    independence_day: 'IndependenceDayIcon',
+  },
+  android: {
+    default: 'default',
+    diwali: 'diwali',
+    eid: 'eid',
+    christmas: 'christmas',
+    holi: 'holi',
+    independence_day: 'independence_day',
+  },
+} as const;
+
+type IconPlatform = keyof typeof ICON_MAP;
+type IconKey = keyof typeof ICON_MAP.android;
+
+const getPlatform = (): IconPlatform | null =>
+  Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null;
+
+export const applyAppIcon = async (iconKey: string): Promise<void> => {
+  const platform = getPlatform();
+  if (!platform) return;
+  const key: IconKey = Object.prototype.hasOwnProperty.call(ICON_MAP[platform], iconKey)
+    ? (iconKey as IconKey)
+    : 'default';
+  const bridge = platform === 'android'
+    ? NativeModules.AppIconSwitcherModule
+    : NativeModules.AppIconSwitcher;
+  if (!bridge?.setAppIcon) throw new Error(`App icon native bridge is unavailable on ${platform}`);
+  // Android owns ComponentName mapping; iOS receives its alternate asset name (null resets default).
+  await bridge.setAppIcon(platform === 'ios' && key === 'default' ? null : ICON_MAP[platform][key]);
+};
+
+let refreshInFlight: Promise<void> | null = null;
+
+export const refreshFestivalIcon = (): Promise<void> => {
+  const platform = getPlatform();
+  if (!platform) return Promise.resolve();
+  if (refreshInFlight) return refreshInFlight;
+  refreshInFlight = (async () => {
+    const { data } = await cmsApi.get('/content/resolved/app-icon', { params: { platform } });
+    if (data?.success !== true || data.data?.platform !== platform || typeof data.data?.icon_key !== 'string') {
+      throw new Error('Invalid resolved app-icon response');
+    }
+    // Fetch/validation failures never call the native bridge, preserving the current icon.
+    await applyAppIcon(data.data.icon_key);
+  })().finally(() => { refreshInFlight = null; });
+  return refreshInFlight;
+};
diff --git a/src/hooks/useFestivalIcon.ts b/src/hooks/useFestivalIcon.ts
new file mode 100644
index 0000000..269dc2b
--- /dev/null
+++ b/src/hooks/useFestivalIcon.ts
@@ -0,0 +1,21 @@
+import { useEffect } from 'react';
+import { AppState, NativeModules, Platform } from 'react-native';
+import { refreshFestivalIcon } from '../services/iconService';
+
+export const useFestivalIcon = (): void => {
+  useEffect(() => {
+    // This checkout has no iOS native switcher; leave iOS unchanged until it is registered.
+    const bridge = Platform.OS === 'android' ? NativeModules.AppIconSwitcherModule : NativeModules.AppIconSwitcher;
+    if (!bridge?.setAppIcon) return;
+    const refresh = () => {
+      void refreshFestivalIcon().catch(error => {
+        console.warn('[AppIcon] Keeping current icon:', error?.message);
+      });
+    };
+    if (AppState.currentState === 'active') refresh();
+    const subscription = AppState.addEventListener('change', state => {
+      if (state === 'active') refresh();
+    });
+    return () => subscription.remove();
+  }, []);
+};
diff --git a/src/services/__tests__/iconService.test.ts b/src/services/__tests__/iconService.test.ts
new file mode 100644
index 0000000..b24638c
--- /dev/null
+++ b/src/services/__tests__/iconService.test.ts
@@ -0,0 +1,60 @@
+import { NativeModules, Platform } from 'react-native';
+import { applyAppIcon, refreshFestivalIcon } from '../iconService';
+import { cmsApi } from '../../config/cmsApiClient';
+
+jest.mock('../../config/cmsApiClient', () => ({ cmsApi: { get: jest.fn() } }));
+
+const get = cmsApi.get as jest.Mock;
+const androidSwitch = jest.fn().mockResolvedValue(null);
+const iosSwitch = jest.fn().mockResolvedValue(null);
+
+beforeEach(() => {
+  jest.clearAllMocks();
+  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
+  NativeModules.AppIconSwitcherModule = { setAppIcon: androidSwitch };
+  NativeModules.AppIconSwitcher = { setAppIcon: iosSwitch };
+});
+
+test('Android sends its platform and passes the key to native', async () => {
+  get.mockResolvedValue({ data: { success: true, data: { platform: 'android', icon_key: 'independence_day' } } });
+  await refreshFestivalIcon();
+  expect(get).toHaveBeenCalledWith('/content/resolved/app-icon', { params: { platform: 'android' } });
+  expect(androidSwitch).toHaveBeenCalledWith('independence_day');
+});
+
+test('unknown and prototype-like keys restore default', async () => {
+  for (const key of ['navratri', 'independence-day', 'toString', '__proto__']) await applyAppIcon(key);
+  expect(androidSwitch.mock.calls).toEqual(Array(4).fill(['default']));
+});
+
+test('network failures and malformed responses preserve the icon', async () => {
+  get.mockRejectedValueOnce(new Error('offline'));
+  await expect(refreshFestivalIcon()).rejects.toThrow('offline');
+  for (const data of [
+    { success: false },
+    { success: true, data: { platform: 'ios', icon_key: 'diwali' } },
+    { success: true, data: { platform: 'android' } },
+  ]) {
+    get.mockResolvedValueOnce({ data });
+    await expect(refreshFestivalIcon()).rejects.toThrow('Invalid resolved app-icon response');
+  }
+  expect(androidSwitch).not.toHaveBeenCalled();
+});
+
+test('overlapping startup and foreground refreshes share one request', async () => {
+  get.mockResolvedValue({ data: { success: true, data: { platform: 'android', icon_key: 'holi' } } });
+  await Promise.all([refreshFestivalIcon(), refreshFestivalIcon()]);
+  expect(get).toHaveBeenCalledTimes(1);
+  expect(androidSwitch).toHaveBeenCalledTimes(1);
+});
+
+test('iOS maps alternate names and resets default with null', async () => {
+  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
+  get.mockResolvedValue({ data: { success: true, data: { platform: 'ios', icon_key: 'diwali' } } });
+  await refreshFestivalIcon();
+  expect(get).toHaveBeenCalledWith('/content/resolved/app-icon', { params: { platform: 'ios' } });
+  expect(iosSwitch).toHaveBeenCalledWith('DiwaliIcon');
+  await applyAppIcon('default');
+  expect(iosSwitch).toHaveBeenLastCalledWith(null);
+  expect(androidSwitch).not.toHaveBeenCalled();
+});
```


