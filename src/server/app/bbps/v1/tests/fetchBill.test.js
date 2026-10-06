const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const headerUtil = require("../utils/header");
const ekoService = require("../services/eko_service");

test("bill fetch sends the configured initiator with the operator fields", async (t) => {
  const config = {
    EKO_DEVELOPER_KEY: "test-developer",
    EKO_ACCESS_KEY: "test-access",
    EKO_USER_CODE: "test-retailer",
    EKO_INITIATOR_ID: " 9999999999 ",
    EKO_SOURCE_IP: "203.0.113.10",
  };
  const previous = Object.fromEntries(
    Object.keys(config).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, config);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  t.mock.method(headerUtil, "fetchHeaders", async () => ({}));
  let providerCalls = 0;
  let expectedOperator = "22";
  let expectedCategory = "8";
  t.mock.method(axios, "get", async (url, options) => {
    if (!url.endsWith("customer/payment/bbps/bill")) {
      return { data: { ip: config.EKO_SOURCE_IP } };
    }
    providerCalls += 1;
    assert.equal(options.params.initiator_id, config.EKO_INITIATOR_ID.trim());
    assert.equal(options.params.user_code, config.EKO_USER_CODE);
    assert.equal(options.params.operator_id, expectedOperator);
    assert.equal(options.params.phone_operator_code, expectedOperator);
    assert.equal(options.params.category, expectedCategory);
    assert.equal(options.params.utility_acc_no, "0012345678");
    assert.equal(options.params.confirmation_mobile_no, "9888888888");
    return { status: 200, data: { status: 0, data: { amount: "100" } } };
  });

  await ekoService.fetchBill({
    operator_id: "22",
    phone_operator_code: "untrusted-client-value",
    category: "8",
    utility_acc_no: "0012345678",
    confirmation_mobile_no: "9888888888",
    initiator_id: "untrusted-client-value",
  }, {});
  assert.equal(providerCalls, 1);
  expectedOperator = "41";
  expectedCategory = "10";
  await ekoService.fetchBill({
    operator_id: "41",
    category: "10",
    utility_acc_no: "0012345678",
    confirmation_mobile_no: "9888888888",
  }, {});
  assert.equal(providerCalls, 2);

  process.env.EKO_INITIATOR_ID = "   ";
  await assert.rejects(
    ekoService.fetchBill({ operator_id: "41" }, {}),
    /Missing BBPS provider environment configuration/,
  );
  assert.equal(providerCalls, 2);
});
