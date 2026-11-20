import api from '../../common/auth/api/axios';
import { normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import type { ServiceItem } from '../navigation/type';

type ContentOfferService = {
  id: number | string;
  name: string;
  service_image: string | null;
  original_price: number | string;
  offer_price?: number | string | null;
  regular_price?: number | string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
};

export async function getContentOfferServices(contentId: number, imageId?: number): Promise<ServiceItem[]> {
  const { data: response } = await api.get<{ data: { services: ContentOfferService[] } }>(
    `/v1/cms/content/${contentId}/services`,
    { params: imageId == null ? undefined : { imageId } },
  );
  return (response.data?.services ?? []).map(row => {
    const price = Number(row.offer_price ?? row.original_price);
    const mrp = Number(row.regular_price ?? row.original_price);
    return {
      service_id: Number(row.id),
      variant_id: 0,
      name: row.name,
      price,
      mrp,
      discount_percent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
      rating: Number(row.rating) || 0,
      review_count: Number(row.review_count) || 0,
      image: normalizeLocalCmsImageUrl(row.service_image),
    };
  });
}

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
