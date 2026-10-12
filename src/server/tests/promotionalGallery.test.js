const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let entry;
let rows;
const model = {
  getEntryById: async () => entry,
  createEntry: async (body) => (entry = { ...body, content_id: 15 }),
  getImagesByContentId: async () => rows.filter(row => row.is_active === 1),
  getAllImagesByContentId: async () => rows,
  createEntryImage: async (id, url, order) => {
    const image = { image_id: rows.length + 1, content_id: id, image_url: url, sort_order: order, is_active: 1 };
    rows.push(image);
    return image;
  },
  resolveAllZones: async () => ({ promotional_banner: entry }),
};
const mock = (name, exports) => {
  const filename = require.resolve(name);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
mock('../models/contentZoneModel', model);
mock('../utils/contentPublicUrl', { getContentImageUrl: url => url });
mock('../utils/publicUrl', { getPublicUrl: url => url });
mock('../utils/r2upload', { uploadToR2: async () => {} });
mock('../utils/r2delete', { deleteFromR2: async () => {} });
mock('../utils/r2copy', { copyInR2: async () => {} });
const controller = require('../controllers/contentController');
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const file = () => ({ originalname: 'banner.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('test') });

beforeEach(() => {
  entry = { content_id: 15, module: 'service', zone: 'promotional_banner', content_type: 'image', image_url: 'old.jpg' };
  rows = [];
});

test('promotional creation accepts multiple images and returns a resolved gallery', async () => {
  const res = response();
  await controller.createEntry({ body: { module: 'service', zone: 'promotional_banner', content_type: 'image' }, files: { images: [file(), file()] } }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.data.images.length, 2);
  assert.deepEqual(res.body.data.images.map(image => image.sort_order), [0, 1]);
  const resolved = response();
  await controller.getResolvedZones({ params: { module: 'service' } }, resolved);
  assert.equal(resolved.body.data.promotional_banner.images.length, 2);
});

test('adding a gallery to a single promotional image preserves that image first', async () => {
  const res = response();
  await controller.addEntryImages({ params: { id: 15 }, files: [file()] }, res);
  assert.equal(res.code, 201);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].image_url, 'old.jpg');
  assert.deepEqual(rows.map(image => image.sort_order), [0, 1]);
});

test('gallery capacity counts inactive images and rejects before saving files', async () => {
  rows = Array.from({ length: 10 }, (_, index) => ({ image_id: index + 1, sort_order: index, is_active: 0 }));
  const res = response();
  await controller.addEntryImages({ params: { id: 15 }, files: [file()] }, res);
  assert.equal(res.code, 400);
  assert.equal(rows.length, 10);
});

test('navbar backgrounds continue to reject gallery uploads', async () => {
  entry.zone = 'navbar_background';
  const res = response();
  await controller.addEntryImages({ params: { id: 15 }, files: [file()] }, res);
  assert.equal(res.code, 400);
  assert.equal(rows.length, 0);
});
