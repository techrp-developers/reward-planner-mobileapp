const { test } = require('node:test');
const assert = require('node:assert/strict');
const dbPath = require.resolve('../config/database');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {} };
const uploaderPath = require.resolve('../utils/r2upload');
require.cache[uploaderPath] = { id: uploaderPath, filename: uploaderPath, loaded: true, exports: {
  uploadToR2: async () => {},
} };
const model = require('../models/contentZoneModel');
const controller = require('../controllers/contentController');
const base = { zone: 'brand_promotional_banner', content_type: 'image', title: 'Brand campaign' };

test('brand zone accepts all modules and display modes; existing zone validation remains intact', () => {
  for (const module of ['product', 'service', 'payment', 'dineout', 'mobile_dashboard']) {
    for (const display_mode of ['single', 'carousel', 'grid_2', 'grid_3']) {
      assert.doesNotThrow(() => model.validateEntry({ ...base, module, display_mode }));
    }
  }
  assert.throws(() => model.validateEntry({ ...base, module: 'product', display_mode: 'invalid' }), /Invalid display_mode/);
  assert.doesNotThrow(() => model.validateEntry({ ...base, module: 'product', zone: 'promotional_banner' }));
  assert.doesNotThrow(() => model.validateEntry({ ...base, module: 'product', zone: 'offers_banner' }));
  assert.doesNotThrow(() => model.validateEntry({ ...base, module: 'product', content_type: 'color', color_value: '#852BAF' }));
});

test('resolution keeps four independent zones scoped to the requested module', async () => {
  const original = model.resolveActiveEntry;
  const calls = [];
  model.resolveActiveEntry = async (module, zone, options) => { calls.push([module, zone, options]); return null; };
  try {
    const result = await model.resolveAllZones('service');
    assert.deepEqual(Object.keys(result), ['navbar_background', 'promotional_banner', 'offers_banner', 'brand_promotional_banner']);
    assert.ok(calls.every(([module]) => module === 'service'));
    assert.equal(calls[3][2].allowDefaultFallback, false);
  } finally { model.resolveActiveEntry = original; }
});

test('admin can manage inactive promotional images while resolved API hides them and primary fallback', async () => {
  const original = { getEntryById: model.getEntryById, getAllImagesByContentId: model.getAllImagesByContentId, resolveAllZones: model.resolveAllZones };
  const entry = { ...base, content_id: 1, module: 'product', image_url: 'brand.png' };
  model.getEntryById = async () => entry;
  model.getAllImagesByContentId = async () => [{ image_id: 1, image_url: 'brand.png', sort_order: 0, is_active: 0 }];
  const response = () => ({ json(payload) { this.payload = payload; return this; }, status(code) { this.code = code; return this; } });
  try {
    const admin = response(); await controller.getEntry({ params: { id: 1 } }, admin);
    assert.equal(admin.payload.data.images[0].is_active, 0);
    for (const zone of ['promotional_banner', 'brand_promotional_banner']) {
      model.resolveAllZones = async () => ({ [zone]: { ...entry, zone } });
      const publicResponse = response(); await controller.getResolvedZones({ params: { module: 'product' } }, publicResponse);
      assert.deepEqual(publicResponse.payload.data[zone].images, []);
      assert.equal(publicResponse.payload.data[zone].image_url, null);
    }
  } finally { Object.assign(model, original); }
});

test('a gallery upload makes a color banner visible and replacing its main image preserves the slide target', async (t) => {
  const entry = { ...base, zone: 'promotional_banner', content_id: 9, module: 'product', content_type: 'color', color_value: '#852BAF' };
  const images = [];
  const response = () => ({ code: 200, json(payload) { this.payload = payload; return this; }, status(code) { this.code = code; return this; } });
  const file = { mimetype: 'image/png', originalname: 'banner.png', buffer: Buffer.from('image') };
  const params = { id: 9 };

  t.mock.method(model, 'getEntryById', async () => ({ ...entry }));
  t.mock.method(model, 'getAllImagesByContentId', async () => images.map(image => ({ ...image })));
  t.mock.method(model, 'createEntryImage', async (contentId, imageUrl, sortOrder) => {
    const image = { content_id: contentId, image_id: images.length + 1, image_url: imageUrl, sort_order: sortOrder, is_active: 1 };
    images.push(image);
    return image;
  });
  t.mock.method(model, 'updateEntryImage', async (_, imageUrl) => Object.assign(entry, { content_type: 'image', image_url: imageUrl }));
  t.mock.method(model, 'updateEntry', async (_, body) => ({ ...Object.assign(entry, body) }));
  t.mock.method(model, 'replaceEntryImage', async (_, imageId, url) => {
    images.find(image => image.image_id === imageId).image_url = url;
  });
  t.mock.method(model, 'findConflicts', async () => []);
  t.mock.method(model, 'resolveAllZones', async () => ({ promotional_banner: entry }));

  const upload = response();
  await controller.addEntryImages({ params, files: [file] }, upload);
  assert.equal(upload.code, 201);
  assert.equal(entry.content_type, 'image');
  const oldUrl = images[0].image_url;
  images[0].target_type = 'product';
  images[0].target_ids = [27, 29];

  // Keep the original asset referenced by the legacy entry while swapping the active slide.
  entry.image_url = oldUrl;
  const update = response();
  await controller.updateEntry({ params, body: { is_published: '1', color_value: '' }, files: { image: [file] } }, update);
  assert.equal(update.code, 200);
  assert.equal(entry.is_published, true);
  const resolved = response();
  await controller.getResolvedZones({ params: { module: 'product' } }, resolved);
  const [slide] = resolved.payload.data.promotional_banner.images;
  assert.equal(slide.image_id, 1);
  assert.notEqual(images[0].image_url, oldUrl);
  assert.ok(slide.image_url.endsWith(images[0].image_url));
  assert.deepEqual(slide.target_ids, [27, 29]);
});
