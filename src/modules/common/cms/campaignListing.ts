export const campaignSortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price (low to high)' },
  { value: 'price-high', label: 'Price (high to low)' },
  { value: 'rating', label: 'Top rated' },
  { value: 'discount', label: 'Biggest discount' },
] as const;

export const campaignPriceBands = [
  { label: 'All prices', min: 0, max: Infinity },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500–₹999', min: 500, max: 1000 },
  { label: '₹1,000–₹1,999', min: 1000, max: 2000 },
  { label: '₹2,000 and above', min: 2000, max: Infinity },
] as const;

export type CampaignSort = typeof campaignSortOptions[number]['value'];
export type CampaignFilters = { priceBand: number; rating: number; discount: number; brand: string };
export type CampaignItemMetrics = { price: number; rating: number; discount: number; brand?: string };

export const defaultCampaignFilters: CampaignFilters = { priceBand: 0, rating: 0, discount: 0, brand: '' };

export function campaignFilterCount({ priceBand, rating, discount, brand }: CampaignFilters) {
  return Number(priceBand > 0) + Number(rating > 0) + Number(discount > 0) + Number(Boolean(brand));
}

export function campaignPrice(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : NaN;
  if (typeof value !== 'string') return NaN;
  const amount = value.trim().replace(/^(?:RP\s*)?₹\s*/i, '').replace(/,/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(amount)) return NaN;
  return campaignPrice(Number(amount));
}

export function filterCampaignItems<T>(
  items: readonly { item: T; metrics: CampaignItemMetrics }[],
  filters: CampaignFilters,
  sort: CampaignSort,
): T[] {
  const { min, max } = campaignPriceBands[filters.priceBand];
  const matches = items.filter(({ metrics }) =>
    (!filters.priceBand || (metrics.price >= min && metrics.price < max)) &&
    (!filters.rating || metrics.rating >= filters.rating) &&
    (!filters.discount || metrics.discount >= filters.discount) &&
    (!filters.brand || metrics.brand === filters.brand),
  );

  if (sort !== 'featured') matches.sort(({ metrics: a }, { metrics: b }) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'discount') return b.discount - a.discount;
    if (!Number.isFinite(a.price)) return Number.isFinite(b.price) ? 1 : 0;
    if (!Number.isFinite(b.price)) return -1;
    return sort === 'price-low' ? a.price - b.price : b.price - a.price;
  });
  return matches.map(({ item }) => item);
}
