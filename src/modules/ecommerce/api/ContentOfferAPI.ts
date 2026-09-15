import api from '../../common/auth/api/axios';

export type PromotionalContent = {
  contentId: number;
  title: string;
  imageUrl?: string | null;
  targetType?: string | null;
  targetIds?: number[];
};

export async function getPromotionalContent() {
  const response = await api.get('/v1/cms/mobile-content', { params: { modules: 'product' } });
  return (response.data?.data?.content?.product?.promotional_banner ?? null) as PromotionalContent | null;
}

export async function getContentOfferProducts(contentId: number) {
  const response = await api.get(`/v1/cms/content/${contentId}/products`);
  return response.data;
}
