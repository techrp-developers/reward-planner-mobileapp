const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(relativePath, dependencies) {
  const filename = path.join(__dirname, relativePath);
  const sandbox = { module: { exports: {} }, console, require: name => dependencies[name] || {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}


const collections = [
  ['getNewArrivals', [10, 20], []],
  ['getMostViewedProducts', [10, 20, 30], [30]],
  ['getUserRecommendations', [7, 10, 20], [7, 7, 7, 7]],
  ['getBestSellers', [10, 20, 30], [30]],
  ['getTopRatedProducts', [10, 20], []],
];
for (const [method, args, prefix] of collections) {
  test(`${method} filters before pagination and binds search safely`, async () => {
    let captured;
    const model = load('../models/productModel.js', {
      '../../../../config/database': { execute: async (sql, params) => {
        captured = { sql, params }; return [[]];
      } },
    });
    const search = "shoe' OR 1=1 --";
    await model[method](...args, search);
    assert.deepEqual(Array.from(captured.params), [...prefix, search, search, 10, 20]);
    assert.ok(captured.sql.indexOf('p.product_name LIKE') < captured.sql.indexOf('LIMIT ? OFFSET ?'));
    assert.ok(!captured.sql.includes(search));
    await model[method](...args);
    assert.deepEqual(Array.from(captured.params), [...prefix, '', '', 10, 20]);
  });
  test(`${method} controller passes trimmed search to its collection`, async () => {
    let captured;
    const controller = load('../controllers/productController.js', {
      '../models/productModel': { [method]: async (...values) => { captured = values; return []; } },
    });
    const res = { status() { return this; }, json(body) { this.body = body; return this; } };
    await controller[method]({ user: { user_id: 7 }, query: { limit: '10', offset: '20', search: ' shoes ' } }, res);
    assert.deepEqual(captured, [...args, 'shoes']);
    assert.equal(res.body.hasMore, false);
  });
}
test('recent search keeps user scope and uses requested pagination', async () => {
  let captured;
  const controller = load('../controllers/productController.js', {
    '../../../../config/database': { execute: async (sql, params) => { captured = { sql, params }; return [[]]; } },
  });
  const res = { json(body) { this.body = body; return this; }, status() { return this; } };
  await controller.getRecentProducts({ user: { user_id: 7 }, query: { search: ' shoes ', offset: '20', limit: '10' } }, res);
  assert.deepEqual(Array.from(captured.params), [7, 'shoes', 'shoes', 10, 20]);
  assert.match(captured.sql, /rv.user_id = \?/);
  assert.match(captured.sql, /LIMIT \? OFFSET \?/);
  assert.equal(res.body.hasMore, false);
  assert.equal(res.body.nextOffset, 20);
});
