import api from '../../common/auth/api/axios';
import { normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import type { ServiceItem } from '../navigation/type';

export async function getCampaignServices(campaignId: number): Promise<ServiceItem[]> {
  const { data: response } = await api.get(`/v1/service-campaign/${campaignId}/services`);
  if (response.show_section === false) return [];
  return (response.data ?? []).map((row: any) => ({
    service_id: Number(row.service_id),
    variant_id: Number(row.variant_id) || 0,
    name: row.name,
    title: row.variant_name || row.title,
    price: Number(row.sale_price),
    mrp: Number(row.original_price),
    discount_percent: Number.parseFloat(row.discount) || 0,
    rating: Number(row.rating) || 0,
    review_count: Number(row.reviews) || 0,
    image: normalizeLocalCmsImageUrl(row.image),
  }));
}
