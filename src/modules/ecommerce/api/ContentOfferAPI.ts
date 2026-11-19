import api from '../../common/auth/api/axios';

export async function getContentOfferProducts(contentId: number, imageId?: number) {
  const response = await api.get(`/v1/cms/content/${contentId}/products`, {
    params: imageId == null ? undefined : { imageId },
  });
  return response.data;
}
