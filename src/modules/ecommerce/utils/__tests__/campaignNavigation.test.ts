import { Linking } from 'react-native';
import { openCampaignPoster } from '../campaignNavigation';
import type { CampaignPoster } from '../../api/CampaignAPI';

const poster: CampaignPoster = {
  campaign_id: 7, title: 'Offers', banner_image: '',
  redirect_type: null, redirect_id: null, redirect_url: null,
};

describe('campaign poster destinations', () => {
  const navigation = { navigate: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('opens external URLs instead of treating them as product collections', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    openCampaignPoster(navigation, { ...poster, navigation: { destination: 'external_url', url: 'https://example.com/sale' } });
    expect(open).toHaveBeenCalledWith('https://example.com/sale');
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('opens a single product directly', () => {
    openCampaignPoster(navigation, { ...poster, navigation: { destination: 'product_details', targetId: 12 } });
    expect(navigation.navigate).toHaveBeenCalledWith('ProductDescription', { productId: 12 });
  });

  it('uses the service campaign route for curated service selections', () => {
    openCampaignPoster(navigation, { ...poster, module: 'service', navigation: { destination: 'service_offer', targetIds: [1, 2] } });
    expect(navigation.navigate).toHaveBeenCalledWith('ServiceCampaign', { campaignId: 7, title: 'Offers' });
  });

  it('uses the redirected campaign ID', () => {
    openCampaignPoster(navigation, { ...poster, navigation: { destination: 'campaign', targetId: 15 } });
    expect(navigation.navigate).toHaveBeenCalledWith('CampaignProducts', { campaignId: 15, title: 'Offers' });
  });

  it('leaves a poster without a destination non-navigating', () => {
    openCampaignPoster(navigation, poster);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
