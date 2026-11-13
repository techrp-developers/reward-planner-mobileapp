export type AppliedOffer = {
  type: 'flash_sale' | 'promotional_offer';
  title: string;
  campaign_id: number | null;
  content_id: number | null;
  original_price: number | null;
  savings: number;
};

export type OfferLine = {
  offer?: AppliedOffer | null;
  is_offer?: boolean | number;
  original_price?: number | string | null;
  original_sale_price?: number | string | null;
  regular_price?: number | string | null;
  offer_price?: number | string | null;
  price?: number | string;
  sale_price?: number | string;
  quantity?: number;
  flash_sale_campaign_id?: number | null;
  promotional_content_id?: number | null;
};

export function getAppliedOffer(line: OfferLine): AppliedOffer | null {
  // Historical order metadata is authoritative, including an explicit null.
  if (line.offer !== undefined) return line.offer;
  if (!line.is_offer && !line.flash_sale_campaign_id && !line.promotional_content_id) return null;
  const original = line.original_price ?? line.original_sale_price ?? line.regular_price;
  const originalPrice = original == null ? null : Number(original);
  const paid = Number(line.offer_price ?? line.price ?? line.sale_price);
  const quantity = Number(line.quantity ?? 1);
  return {
    type: line.flash_sale_campaign_id ? 'flash_sale' : 'promotional_offer',
    title: line.flash_sale_campaign_id ? 'Flash Sale' : 'Promotional offer',
    campaign_id: line.flash_sale_campaign_id ?? null,
    content_id: line.promotional_content_id ?? null,
    original_price: originalPrice !== null && Number.isFinite(originalPrice) ? originalPrice : null,
    savings: originalPrice !== null && Number.isFinite(originalPrice) && Number.isFinite(paid) && Number.isFinite(quantity)
      ? Math.max(0, originalPrice - paid) * Math.max(0, quantity) || 0 : 0,
  };
}
