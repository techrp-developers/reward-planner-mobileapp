import api from '../src/modules/common/auth/api/axios';
import { fetchCheckoutCart, fetchBuyNowCheckout, addCartOrder, addBuyNowOrder } from '../src/modules/ecommerce/api/CheckoutApi';

jest.mock('../src/modules/common/auth/api/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (api.get as jest.Mock).mockResolvedValue({ data: { deliveryChoices: [] } });
  (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
});

test('cart preview defaults to standard delivery and supports fastest for the selected address', async () => {
  await fetchCheckoutCart(true, 12);
  expect(api.get).toHaveBeenLastCalledWith('/v1/checkout/get-cart', {
    params: { use_rewards: true, address_id: 12, delivery_preference: 'cheapest' },
  });
  await fetchCheckoutCart(false, 15, 'fastest');
  expect(api.get).toHaveBeenLastCalledWith('/v1/checkout/get-cart', {
    params: { use_rewards: false, address_id: 15, delivery_preference: 'fastest' },
  });
});

test('Buy Now preserves campaign attribution with the delivery preference', async () => {
  await fetchBuyNowCheckout(1, 2, 3, true, 12, 4, 5, 'fastest');
  expect(api.get).toHaveBeenCalledWith('/v1/checkout/get-buy-now', {
    params: { product_id: 1, variant_id: 2, qty: 3, use_rewards: true, address_id: 12, campaign_id: 4, content_id: 5, delivery_preference: 'fastest' },
  });
});

test.each(['cheapest', 'fastest'] as const)('both order endpoints preserve %s delivery and quoted totals', async delivery_preference => {
  const payload = { address_id: 12, expected_total: 150, expected_redeemable: 20, use_rewards: true, delivery_preference };
  await addCartOrder(payload);
  expect(api.post).toHaveBeenLastCalledWith('/v1/checkout/cart', payload);
  const buyNow = { ...payload, product_id: 1, variant_id: 2, quantity: 3 };
  await addBuyNowOrder(buyNow);
  expect(api.post).toHaveBeenLastCalledWith('/v1/checkout/buy-now', buyNow);
});
