jest.mock('../../../common/auth/api/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import api from '../../../common/auth/api/axios';
import {
  fetchActiveFeaturedCampaign,
  fetchFeaturedCampaignProducts,
} from '../ProductApi';
import { normalizeProduct } from '../../utils/normalizeProduct';
import { API_BASE_URL, API_ENVIRONMENT, LOCAL_SERVER_HOST } from '../../../../config/apiConfig';

const mockedGet = jest.mocked(api.get);

describe('featured campaign API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the live API portal instead of the local port 5000 backend', () => {
    expect(API_ENVIRONMENT).toBe('live');
    expect(API_BASE_URL).toBe('https://rewardplanners.com/api/crm');
    expect(LOCAL_SERVER_HOST).toBe('');
  });

  it('returns the active campaign from the home feed contract', async () => {
    const campaign = {
      campaign_id: 23,
      title: 'Diwali Offers',
      cta_text: 'Explore Diwali',
      total_products: 1,
      background: {
        type: 'gradient',
        colors: ['#111111', '#222222'],
        image_url: null,
        text_color: '#FFFFFF',
      },
      products: [{ product_id: 501, product_name: 'Lamp', variant_id: 901 }],
    };
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: campaign },
    } as never);

    await expect(fetchActiveFeaturedCampaign()).resolves.toEqual(campaign);
    expect(mockedGet).toHaveBeenCalledWith('/v1/campaigns/home/featured');
  });

  it('returns no campaign when the home feed is empty', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: null },
    } as never);

    await expect(fetchActiveFeaturedCampaign()).resolves.toBeNull();
  });

  it('requests campaign products by page and returns the pagination contract', async () => {
    const page = {
      campaign_id: 23,
      title: 'Diwali Offers',
      products: [{ product_id: 501, product_name: 'Lamp', variant_id: 901 }],
      pagination: { page: 2, limit: 20, total: 25, totalPages: 2 },
    };
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: page },
    } as never);

    await expect(fetchFeaturedCampaignProducts(23, 2, 20)).resolves.toEqual(page);
    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/campaigns/23/featured-products/public',
      { params: { page: 2, limit: 20 } },
    );
  });

  it('does not infer an RP price when the campaign product explicitly has none', () => {
    const product = normalizeProduct({
      rp_price: null,
      member_price: 25,
    });

    expect(product.rp_price).toBeNull();
  });
});
