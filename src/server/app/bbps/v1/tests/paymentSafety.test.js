const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const {
  hasProviderFailureSignal,
  isEkoPaymentSuccessful,
} = require("../services/paymentProcessor");
const {
  hasRazorpayPaymentAttempts,
  shouldIgnoreCapturedEvent,
  shouldIgnoreFailedEvent,
} = require("../utils/paymentState");
const {
  buildPayBillHashPayload,
  formatPayBillAmount,
} = require("../utils/header");

test("a retry returns a matching unpaid recharge order without calling Razorpay", async () => {
  const calls = [];
  const conn = {
    async beginTransaction() { calls.push("begin"); },
    async execute(_sql, params) {
      assert.deepEqual(Array.from(params), [42, "7", "9876543210", "plan-1", "27", 99]);
      return [[{ transaction_id: 17, razorpay_order_id: "order_existing", amount: 99 }]];
    },
    async commit() { calls.push("commit"); },
    async rollback() { assert.fail("The existing order should be returned"); },
    release() { calls.push("release"); },
  };
  const mocks = {
    "../../../../config/database": { getConnection: async () => conn },
    "../services/eko_service": {
      getOperatorDetails: async () => ({ operator_id: "7", fetchBill: 0 }),
      getRechargePlans: async () => ({ plans: [{ planId: "plan-1", amount: 99 }] }),
    },
    "../models/transactionModel": { create: () => assert.fail("Transaction already exists") },
    "../services/razorpay_service": { orders: { create: () => assert.fail("Razorpay should not be called") } },
  };
  const controllerPath = require.resolve("../controllers/paymentController");
  const moduleMock = { exports: {} };
  vm.runInNewContext(fs.readFileSync(controllerPath, "utf8"), {
    module: moduleMock,
    require: (name) => mocks[name] ?? {},
    process: { env: {} },
    console,
  }, { filename: controllerPath });

  let response;
  await moduleMock.exports.createOrder({
    user: { user_id: 42 },
    body: {
      operator_id: "7", utility_acc_no: "9876543210", plan_id: "plan-1",
      circle_id: "27", sender_name: "Customer",
    },
  }, { json: (body) => { response = body; } });
  assert.deepEqual(calls, ["begin", "commit", "release"]);
  assert.equal(response?.data.reused, true);
  assert.equal(response?.data.orderId, "order_existing");
  assert.equal(response?.data.amount, 9900);
});

test("EKO business responses are classified conservatively", () => {
  assert.equal(isEkoPaymentSuccessful({ status: 0 }), true);
  assert.equal(isEkoPaymentSuccessful({ status: "SUCCESS" }), true);
  assert.equal(isEkoPaymentSuccessful({ data: { status: 0 } }), true);
  assert.equal(isEkoPaymentSuccessful({ response_status_id: 0 }), true);
  assert.equal(isEkoPaymentSuccessful({ status: 97 }), false);
  assert.equal(
    isEkoPaymentSuccessful({ status: 0, response_type_id: -1 }),
    false,
  );
  assert.equal(isEkoPaymentSuccessful({}), false);
  assert.equal(hasProviderFailureSignal({}), false);
  assert.equal(hasProviderFailureSignal({ status: 97 }), true);
});

test("EKO paybill amount formatting is stable for request hash", () => {
  assert.equal(formatPayBillAmount("77.00"), "77");
  assert.equal(formatPayBillAmount(77), "77");
  assert.equal(formatPayBillAmount("77.50"), "77.5");
});

test("EKO paybill request hash includes timestamp without separators", () => {
  assert.equal(
    buildPayBillHashPayload("1626696381248", "151627591", "50", "20810200"),
    "16266963812481516275915020810200",
  );
});

test("duplicate captured events never re-run terminal provider states", () => {
  assert.equal(
    shouldIgnoreCapturedEvent({
      orderStatus: "success",
      transactionStatus: "FAILED_RETRY",
    }),
    true,
  );
  assert.equal(
    shouldIgnoreCapturedEvent({
      orderStatus: "created",
      transactionStatus: "FAILED_FINAL",
    }),
    true,
  );
  assert.equal(
    shouldIgnoreCapturedEvent({
      orderStatus: "created",
      transactionStatus: "INIT",
    }),
    false,
  );
});

test("late failed attempts cannot overwrite captured transaction states", () => {
  assert.equal(
    shouldIgnoreFailedEvent({
      orderStatus: "success",
      transactionStatus: "FAILED_RETRY",
    }),
    true,
  );
  assert.equal(
    shouldIgnoreFailedEvent({
      orderStatus: "created",
      razorpayPaymentId: "pay_123",
      transactionStatus: "INIT",
    }),
    true,
  );
  assert.equal(
    shouldIgnoreFailedEvent({
      orderStatus: "created",
      transactionStatus: "INIT",
    }),
    false,
  );
});

test("local cancellation is allowed only when Razorpay reports no payment attempts", () => {
  assert.equal(hasRazorpayPaymentAttempts({ count: 0, items: [] }), false);
  assert.equal(
    hasRazorpayPaymentAttempts({ count: 1, items: [{ id: "pay_123", status: "created" }] }),
    true,
  );
  assert.equal(hasRazorpayPaymentAttempts(null), false);
});
