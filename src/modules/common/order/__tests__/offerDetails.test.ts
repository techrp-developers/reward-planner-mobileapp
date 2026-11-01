import { getAppliedOffer } from '../appliedOffer';

describe('applied offer display', () => {
  it('does not turn a normal MRP discount into a campaign offer', () => {
    expect(getAppliedOffer({ price: 100, original_price: 200 })).toBeNull();
  });
  it('uses the cart original sale price and quantity, not MRP or rewards', () => {
    expect(getAppliedOffer({ is_offer: true, flash_sale_campaign_id: 6, original_sale_price: '200', sale_price: 150, quantity: 2 })?.savings).toBe(100);
  });
  it('uses service regular prices', () => {
    expect(getAppliedOffer({ is_offer: true, regular_price: 400, price: 300 })?.savings).toBe(100);
  });
  it('preserves the recorded order offer without multiplying savings again', () => {
    const offer = { type: 'flash_sale' as const, title: 'Diwali', campaign_id: 6, content_id: null, original_price: 200, savings: 100 };
    expect(getAppliedOffer({ offer, price: 150, quantity: 2 })).toBe(offer);
  });
  it('handles older orders with an unknown regular price', () => {
    expect(getAppliedOffer({ flash_sale_campaign_id: 6, price: 150 })).toMatchObject({ title: 'Flash Sale', original_price: null, savings: 0 });
  });
  it('honors an explicit no-offer result', () => {
    expect(getAppliedOffer({ offer: null, flash_sale_campaign_id: 6 })).toBeNull();
  });
  it('does not show negative savings', () => {
    expect(getAppliedOffer({ is_offer: true, original_price: 100, price: 150 })?.savings).toBe(0);
  });
});
