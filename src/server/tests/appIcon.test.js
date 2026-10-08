const { test } = require("node:test");
const assert = require("node:assert/strict");

const databasePath = require.resolve("../config/database");
let rows = [];
let calls = [];
require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: {
  execute: async (sql, params) => { calls.push({ sql, params }); return [rows]; },
} };
const model = require("../models/appIconModel");
const controller = require("../controllers/appIconController");

const campaign = {
  platform: "android", icon_key: "diwali",
  starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-11-01T00:00:00Z",
  priority: 10, is_active: true,
};

test("validates both platforms, exact icon keys, timezone, date order, priority and active flag", () => {
  for (const platform of ["ios", "android"]) {
    assert.equal(model.validateCampaign({ ...campaign, platform })[0], platform);
  }
  for (const override of [
    { platform: "web" }, { icon_key: "unknown_festival" }, { icon_key: "independence-day" },
    { starts_at: "2026-10-01T00:00:00" }, { ends_at: campaign.starts_at },
    { priority: 1.2 }, { is_active: "false" },
  ]) assert.throws(() => model.validateCampaign({ ...campaign, ...override }), { statusCode: 400 });
  assert.equal(model.validateCampaign({ ...campaign, starts_at: "2026-10-01T05:30:00+05:30" })[2], "2026-10-01 00:00:00.000");
});

test("Navratri and Dasera are supported on Android without advertising unregistered iOS icons", async () => {
  for (const icon_key of ["navratri", "dasera"]) {
    assert.equal(model.validateCampaign({ ...campaign, icon_key })[1], icon_key);
    assert.ok(model.getIconKeys("android").includes(icon_key));
    assert.ok(!model.getIconKeys("ios").includes(icon_key));
    assert.throws(() => model.validateCampaign({ ...campaign, platform: "ios", icon_key }), { statusCode: 400 });
    rows = [{ icon_key }];
    assert.equal((await model.resolve("android")).icon_key, icon_key);
    assert.equal((await model.resolve("ios")).icon_key, "default");
  }
});

test("resolution filters active platform schedules in UTC and orders priority with deterministic ties", async () => {
  calls = [];
  rows = [{ icon_key: "diwali" }];
  assert.deepEqual(await model.resolve("android"), { platform: "android", icon_key: "diwali" });
  assert.deepEqual(calls[0].params, ["android"]);
  assert.match(calls[0].sql, /is_active = 1/);
  assert.match(calls[0].sql, /starts_at <= UTC_TIMESTAMP\(3\) AND ends_at >= UTC_TIMESTAMP\(3\)/);
  assert.match(calls[0].sql, /ORDER BY priority DESC, starts_at DESC, id DESC LIMIT 1/);
  rows = [];
  assert.deepEqual(await model.resolve("ios"), { platform: "ios", icon_key: "default" });
  rows = [{ icon_key: "unknown_festival" }];
  assert.equal((await model.resolve("android")).icon_key, "default");
});

test("invalid platforms do not query the database", async () => {
  calls = [];
  await assert.rejects(model.resolve("web"), { statusCode: 400 });
  assert.equal(calls.length, 0);
});

test("controller returns contract and validation errors without converting failures to default", async () => {
  const res = {
    statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  rows = [];
  await controller.resolve({ query: { platform: "android" } }, res);
  assert.deepEqual(res.body, { success: true, data: { platform: "android", icon_key: "default" } });
  await controller.resolve({ query: { platform: "web" } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("specific resolver precedes wildcard and every app-icon admin endpoint requires admin authentication", () => {
  const dependencies = {};
  const stub = (relativePath, exports) => { dependencies[relativePath] = exports; };
  const noop = () => {};
  stub("../controllers/contentController", new Proxy({}, { get: () => noop }));
  stub("../controllers/moduleIconController", new Proxy({}, { get: () => noop }));
  stub("../middleware/mediaUpload/contentUpload", { uploadContentImage: { fields: () => noop, array: () => noop } });
  const authenticate = () => {};
  const authorize = () => {};
  stub("../middleware/auth", {
    authenticateToken: authenticate,
    authorizeRoles: (...roles) => { assert.deepEqual(roles, ["admin"]); return authorize; },
  });
  const routes = [];
  const router = {};
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    router[method] = (path, ...handlers) => routes.push({ path, stack: handlers.map((handle) => ({ handle })) });
  }
  stub("express", { Router: () => router });
  stub("../controllers/appIconController", controller);
  const source = require("node:fs").readFileSync(require.resolve("../routes/contentRoutes"), "utf8");
  require("node:vm").runInNewContext(source, {
    module: { exports: {} },
    require: (path) => {
      if (!(path in dependencies)) throw new Error(`Unexpected dependency: ${path}`);
      return dependencies[path];
    },
  });
  assert.ok(routes.findIndex((route) => route.path === "/resolved/app-icon") < routes.findIndex((route) => route.path === "/resolved/:module"));
  const adminRoutes = routes.filter((route) => route.path.startsWith("/app-icons"));
  assert.equal(adminRoutes.length, 7);
  for (const route of adminRoutes) {
    assert.equal(route.stack[0].handle, authenticate);
    assert.equal(route.stack[1].handle, authorize);
  }
  assert.ok(routes.findIndex((route) => route.path === "/app-icons/keys") < routes.findIndex((route) => route.path === "/app-icons/:id"));
});
