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

test('brand listing validates input and preserves paginated product response', async () => {
  const calls = [];
  const controller = load('../controllers/productController.js', {
    '../models/productModel': { getAllProducts: async options => {
      calls.push(options);
      return { products: [], totalItems: 21 };
    } },
  });
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  for (const brand of [undefined, '', '  ', ['Nike'], {}, 'x'.repeat(256)]) {
    await controller.getProductsByBrand({ query: { brand } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(calls.length, 0);
  await controller.getProductsByBrand({ query: { brand: '  A & B / Sports  ', search: 'shoes', page: '2', limit: '20' } }, res);
  assert.equal(calls[0].brandName, 'A & B / Sports');
  assert.equal(calls[0].search, 'shoes');
  assert.equal(calls[0].offset, 20);
  assert.equal(res.body.currentPage, 2);
  assert.equal(res.body.totalPages, 2);
  await controller.getAllProducts({ query: {} }, res);
  assert.equal(calls[1].brandName, undefined);
});

test('brand filter is parameterized and applied to both results and count', async () => {
  const calls = [];
  const model = load('../models/productModel.js', {
    '../../../../config/database': { execute: async (sql, params) => {
      calls.push({ sql, params });
      return sql.includes('COUNT(DISTINCT') ? [[{ total: 0 }]] : [[]];
    } },
  });
  const brandName = "Brand%' OR 1=1 --";
  await model.getAllProducts({ brandName, search: 'shoes', limit: 20, offset: 0, sortBy: 'created_at', sortOrder: 'DESC' });
  assert.equal(calls.length, 2);
  for (const { sql, params } of calls) {
    assert.match(sql, /LOWER\(TRIM\(p.brand_name\)\) = LOWER\(\?\)/);
    assert.equal(params[0], brandName);
    assert.equal(params[1], '%shoes%');
    assert.match(sql, /AND p.product_name LIKE \?/);
    assert.ok(!sql.includes(brandName));
    assert.match(sql, /p.status = 'approved'/);
    assert.match(sql, /p.is_visible = 1/);
    assert.match(sql, /p.is_deleted = 0/);
  }
  assert.match(calls[0].sql, /ORDER BY p.created_at DESC, p.product_id DESC/);
});
