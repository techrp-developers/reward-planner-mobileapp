import { isPaymentVerified } from '../paymentStatus';

describe('ecommerce payment verification', () => {
  it.each(['paid', 'captured'])('recognizes backend paymentStatus %s', paymentStatus => {
    expect(isPaymentVerified({ paymentStatus })).toBe(true);
  });
  it('recognizes direct server verification', () => {
    expect(isPaymentVerified({ status: 'success' })).toBe(true);
  });
  it.each(['pending', 'failed', 'cancelled', 'refunded'])('does not treat HTTP success as payment %s', status => {
    expect(isPaymentVerified({ success: true, status })).toBe(false);
  });
  it('does not treat a generic success response as captured money', () => {
    expect(isPaymentVerified({ success: true })).toBe(false);
  });
});
