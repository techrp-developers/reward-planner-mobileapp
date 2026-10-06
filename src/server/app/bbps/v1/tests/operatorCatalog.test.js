const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const headerUtil = require("../utils/header");
const ekoService = require("../services/eko_service");

test("empty credit card fields use the current parameter endpoint", async (t) => {
  const previous = process.env.EKO_INITIATOR_ID;
  process.env.EKO_INITIATOR_ID = "9999999999";
  t.after(() => {
    if (previous === undefined) delete process.env.EKO_INITIATOR_ID;
    else process.env.EKO_INITIATOR_ID = previous;
  });
  t.mock.method(headerUtil, "fetchHeaders", async () => ({}));
  const fields = [{ param_name: "utility_acc_no", param_label: "Card identifier", regex: "^[0-9]{4}$", param_type: "Numeric" }];
  let calls = 0;
  t.mock.method(axios, "get", async (url, options) => {
    calls++;
    if (url.endsWith("billpayments/operators/9206")) {
      return { data: { operator_name: "SBI Card", operator_id: 9206, fetchBill: 1, BBPS: 1, data: [] } };
    }
    assert.match(url, /customer\/payment\/bbps\/operator\/9206\/parameters$/);
    assert.equal(options.params.initiator_id, "9999999999");
    return { data: { status: 0, param_attributes: { list_elements: fields } } };
  });
  const result = await ekoService.getOperatorDetails(9206);
  assert.deepEqual(result.data, fields);
  assert.equal(result.fetchBill, 1);
  assert.equal(result.operator_name, "SBI Card");
  await ekoService.getOperatorDetails(9206);
  assert.equal(calls, 2);
});

test("existing operator fields do not trigger a fallback", async (t) => {
  t.mock.method(headerUtil, "fetchHeaders", async () => ({}));
  const response = { operator_id: 41, fetchBill: 1, data: [{ param_name: "utility_acc_no", param_label: "Mobile Number" }] };
  t.mock.method(axios, "get", async (url) => {
    assert.match(url, /billpayments\/operators\/41$/);
    return { data: response };
  });
  assert.deepEqual(await ekoService.getOperatorDetails(41), response);
});

test("empty provider schemas fail and can be retried instead of being cached", async (t) => {
  const previous = process.env.EKO_INITIATOR_ID;
  process.env.EKO_INITIATOR_ID = "9999999999";
  t.after(() => {
    if (previous === undefined) delete process.env.EKO_INITIATOR_ID;
    else process.env.EKO_INITIATOR_ID = previous;
  });
  t.mock.method(headerUtil, "fetchHeaders", async () => ({}));
  let calls = 0;
  t.mock.method(axios, "get", async () => { calls++; return { data: { status: 0, data: [] } }; });
  await assert.rejects(ekoService.getOperatorDetails(9208), /fields are currently unavailable/);
  await assert.rejects(ekoService.getOperatorDetails(9208), /fields are currently unavailable/);
  assert.equal(calls, 4);
});

test("operator catalog matches EKO operator_category_id category responses", async (t) => {
  t.mock.method(headerUtil, "fetchHeaders", async () => ({}));
  t.mock.method(axios, "get", async (url) => {
    if (url.endsWith("operators_category")) {
      return {
        data: {
          status: 0,
          data: [
            {
              operator_category_id: 5,
              operator_category_name: "Electricity",
            },
            {
              operator_category_id: 9,
              operator_category_name: "Insurance",
            },
          ],
        },
      };
    }

    if (url.endsWith("operators")) {
      return {
        data: {
          status: 0,
          data: [
            { operator_id: 101, name: "Power Board", operator_category: 5 },
            { operator_id: 202, name: "Insurer", operator_category: 9 },
          ],
        },
      };
    }

    throw new Error(`Unexpected URL: ${url}`);
  });

  const result = await ekoService.getOperators();

  assert.deepEqual(result.data, [
    { operator_id: 101, name: "Power Board", operator_category: 5 },
  ]);
});

test("category catalog exposes stable category fields to clients", async (t) => {
  t.mock.method(headerUtil, "fetchHeaders", async () => ({}));
  t.mock.method(axios, "get", async (url) => {
    assert.match(url, /operators_category$/);
    return {
      data: {
        status: 0,
        data: [
          {
            operator_category_id: 5,
            operator_category_name: "Electricity",
          },
        ],
      },
    };
  });

  const result = await ekoService.getCategories();

  assert.equal(result.data[0].category_id, 5);
  assert.equal(result.data[0].category_name, "Electricity");
});
