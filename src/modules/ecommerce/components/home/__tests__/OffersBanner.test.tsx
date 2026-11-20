import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { FlatList, Linking, TouchableOpacity } from 'react-native';
import OffersBanner from '../OffersBanner';

const mockNavigate = jest.fn();
const mockAppNavigate = jest.fn();
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate, dispatch: mockDispatch, getParent: () => ({ navigate: mockAppNavigate }),
  }),
  CommonActions: { navigate: (name: string, params: unknown) => ({ type: 'NAVIGATE', payload: { name, params } }) },
}));
jest.mock('../../../../common/cms/useModuleContent', () => ({
  useModuleContent: () => ({ moduleContent: null }),
  moduleContentQueryKey: jest.fn(),
}));
jest.mock('../../../../common/cms/cmsContentApi', () => ({ fetchResolvedZones: jest.fn() }));
jest.mock('../../../../../query/queryClient', () => ({ queryClient: { prefetchQuery: jest.fn() } }));

describe('CMS offer images', () => {
  let renderer: TestRenderer.ReactTestRenderer;

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
  });

  const renderOffers = (banner: any) => {
    act(() => {
      renderer = TestRenderer.create(
        <OffersBanner module="service" moduleContent={{ offers_banner: banner }} />,
      );
    });
    return renderer.root.findByType(FlatList).props.data;
  };

  it('renders active numeric and string flags in CMS order', () => {
    const slides = renderOffers({
      content_id: 9,
      content_type: 'image',
      images: [
        { image_id: 1, image_url: 'https://example.com/one.jpg', is_active: '1', sort_order: 2 },
        { image_id: 2, image_url: 'https://example.com/two.jpg', is_active: 1, sort_order: 1 },
        { image_id: 3, image_url: 'https://example.com/hidden.jpg', is_active: 0, sort_order: 0 },
      ],
    });
    expect(slides.map((slide: any) => slide.id)).toEqual(['2', '1']);
  });

  it('renders an older single-image campaign with an empty gallery', () => {
    expect(renderOffers({
      content_id: 9,
      content_type: 'image',
      image_url: 'https://example.com/offer.jpg',
      images: [],
    })).toEqual([{ id: '9', imageUrl: 'https://example.com/offer.jpg' }]);
  });

  it('gives legacy gallery images without IDs distinct keys', () => {
    const slides = renderOffers({
      content_id: 9,
      content_type: 'image',
      images: [
        { image_id: null, image_url: 'https://example.com/one.jpg', is_active: 1, sort_order: 0 },
        { image_id: null, image_url: 'https://example.com/two.jpg', is_active: 1, sort_order: 1 },
      ],
    });
    expect(slides.map((slide: any) => slide.id)).toEqual(['9_0', '9_1']);
  });

  it('opens the service campaign for the tapped CMS offer slide', () => {
    renderOffers({
      content_id: 9, title: 'Service deals', content_type: 'image',
      images: [
        { image_id: 2, image_url: 'two.jpg', is_active: 1, sort_order: 0, target_type: 'service', target_id: 11 },
      ],
    });
    act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'ServiceCampaign', params: { contentId: 9, imageId: 2, title: 'Service deals' } },
    });
  });

  it('opens an app offer link in the corresponding module from another module', () => {
    renderOffers({
      content_id: 9, title: 'Product deals', content_type: 'image', image_url: 'offer.jpg',
      redirect_link: 'rewardplanners://offers/products/15?imageId=7',
    });
    act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
    expect(mockAppNavigate).toHaveBeenCalledWith('Home', {
      screen: 'ProductModule',
      params: { screen: 'CampaignProducts', params: { contentId: 15, imageId: 7, title: 'Product deals' } },
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens the service campaign linked from a color offer', () => {
    act(() => {
      renderer = TestRenderer.create(<OffersBanner module="service" moduleContent={{
        offers_banner: {
          content_id: 9, title: 'Service deals', content_type: 'color', color_value: '#5B47A3',
          image_url: null, text_color: null, cta_text: null, status: 'active', is_default: 0,
          redirect_link: 'rewardapp://service-campaign?campaignId=34',
        },
      }} />);
    });
    act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'ServiceCampaign', params: { campaignId: 34, title: 'Service deals' } },
    });
  });

  it('still opens a website offer link externally', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    try {
      renderOffers({ content_id: 9, content_type: 'image', image_url: 'offer.jpg', redirect_link: 'https://example.com/offers' });
      act(() => renderer.root.findByType(TouchableOpacity).props.onPress());
      expect(openURL).toHaveBeenCalledWith('https://example.com/offers');
    } finally {
      openURL.mockRestore();
    }
  });
});
