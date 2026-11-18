/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/modules/common/cms/cmsContentApi', () => ({
  fetchResolvedModules: jest.fn().mockResolvedValue([]),
  fetchResolvedNavbar: jest.fn().mockResolvedValue({}),
}));
jest.mock('../src/modules/common/versionupdate/checkAppVersion', () => ({
  checkAppVersion: jest.fn().mockResolvedValue({ success: false }),
}));
jest.mock('../src/modules/ecommerce/api/ProductApi', () => ({
  fetchAllCategories: jest.fn().mockResolvedValue([]),
}));
jest.mock('../src/modules/ecommerce/api/PromotionalApi', () => ({
  fetchBestSellers: jest.fn().mockResolvedValue([]),
  fetchMostViewedProducts: jest.fn().mockResolvedValue([]),
  fetchTopRatedProducts: jest.fn().mockResolvedValue([]),
}));

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => renderer.unmount());
});
