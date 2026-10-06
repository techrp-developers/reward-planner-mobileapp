import { canRetryRequest, isPositiveAmount, isValidCheckoutOrder } from '../src/modules/bbps/utils/paymentSafety';

describe('BBPS checkout guards', () => {
  test.each(['-100', '0', 'Infinity', 'NaN', 'abc100', '', '1.001'])('rejects invalid payable amount %s', value => {
    expect(isPositiveAmount(value)).toBe(false);
  });
  test.each(['100', '0.01', ' 123.45 '])('accepts valid payable amount %s', value => {
    expect(isPositiveAmount(value)).toBe(true);
  });
  test('requires a trackable order and positive integer paise', () => {
    const order = { key: 'test', orderId: 'order_1', transaction_id: 12, amount: 10000 };
    expect(isValidCheckoutOrder(order)).toBe(true);
    expect(isValidCheckoutOrder({ ...order, transaction_id: undefined })).toBe(false);
    expect(isValidCheckoutOrder({ ...order, amount: -100 })).toBe(false);
    expect(isValidCheckoutOrder({ ...order, amount: 1.5 })).toBe(false);
  });
  test('does not replay mutation requests after timeouts', () => {
    for (const method of ['post', 'POST', 'put', 'patch', 'delete']) expect(canRetryRequest(method)).toBe(false);
    expect(canRetryRequest('GET')).toBe(true);
  });
});
