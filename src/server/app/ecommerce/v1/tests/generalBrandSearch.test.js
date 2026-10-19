const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('brand suggestion opens a brand collection instead of a single product', async () => {
  const calls = [];
  const model = load('../models/productModel.js', {
    '../../../../config/database': { execute: async (sql, params) => {
      calls.push({ sql, params });
      return [calls.length === 1 ? [{ brand_name: 'Hammer' }] : []];
    } },
  });
  const result = await model.getSearchSuggestions({ search: 'hammer', limit: 10 });
  assert.equal(result.brands[0].title, 'Hammer');
  assert.equal(result.brands[0].type, 'brand');
  assert.equal(result.brands[0].navigation.destination, 'brand_products');
  assert.equal(result.brands[0].navigation.brand_name, 'Hammer');
  assert.deepEqual(Array.from(calls[0].params), ['%hammer%', 'hammer', 10]);
  assert.match(calls[0].sql, /GROUP BY LOWER\(TRIM\(p.brand_name\)\)/);
  assert.match(calls[0].sql, /p.is_searchable = 1/);
  assert.match(calls[0].sql, /pv.is_visible = 1/);
});

function load(relativePath, dependencies) {
  const filename = path.join(__dirname, relativePath);
  const sandbox = { module: { exports: {} }, console, require: name => dependencies[name] || {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return sandbox.module.exports;
}


for (const exact of [true, false]) {
  test(exact ? 'exact brand search restricts results and count to that brand' : 'partial search matches product or brand names in results and count', async () => {
    const calls = [];
    const model = load('../models/productModel.js', {
      '../../../../config/database': { execute: async (sql, params) => {
        calls.push({ sql, params });
        if (calls.length === 1) return [exact ? [{ brand_name: 'Acme' }] : []];
        return sql.includes('COUNT(DISTINCT') ? [[{ total: 0 }]] : [[]];
      } },
    });
    await model.loadProducts({ search: '  Acme  ', limit: 10, offset: 20 });
    assert.equal(calls[0].params[0], 'Acme');
    for (const { sql, params } of calls.slice(1)) {
      assert.match(sql, /p.status = \?/);
      assert.match(sql, /p.is_visible = \?/);
      assert.match(sql, /p.is_deleted = \?/);
      assert.match(sql, /v.variant_id IS NOT NULL/);
      if (exact) {
        assert.match(sql, /LOWER\(TRIM\(p.brand_name\)\) = LOWER\(\?\)/);
        assert.ok(!sql.includes('p.product_name LIKE'));
        assert.equal(params[3], 'Acme');
      } else {
        assert.match(sql, /\(p.product_name LIKE \? OR p.brand_name LIKE \?\)/);
        assert.equal(params[3], '%Acme%');
        assert.equal(params[4], '%Acme%');
      }
    }
    assert.deepEqual(Array.from(calls[1].params.slice(-2)), [10, 20]);
  });
}
test('brand search binds special characters and skips brand lookup for empty search', async () => {
  const calls = [];
  const model = load('../models/productModel.js', {
    '../../../../config/database': { execute: async (sql, params) => {
      calls.push({ sql, params });
      return sql.includes('COUNT(DISTINCT') ? [[{ total: 0 }]] : [[]];
    } },
  });
  const term = "A & B's / Sports";
  await model.loadProducts({ search: term, limit: 10, offset: 0 });
  assert.equal(calls[0].params[0], term);
  for (const call of calls) assert.ok(!call.sql.includes(term));
  calls.length = 0;
  await model.loadProducts({ search: '  ', limit: 10, offset: 0 });
  assert.equal(calls.length, 2);
  assert.ok(!calls[0].sql.includes('p.product_name LIKE'));
});
