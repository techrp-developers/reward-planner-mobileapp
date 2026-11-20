import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Animated, AppState, Linking, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HomeBanner from '../HomeBanner';
import PromotionalBanner from '../PromotionalBanner';

let mockBanner: any;
let mockBrandBanner: any;
const mockScrollTo = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
jest.mock('react-native', () => {
  const native = jest.requireActual('react-native');
  const react = require('react');
  const MockScrollView = react.forwardRef((props: any, ref: any) => {
    react.useImperativeHandle(ref, () => ({ scrollTo: mockScrollTo }));
    return react.createElement(native.View, props, props.children);
  });
  const descriptors = Object.getOwnPropertyDescriptors(native);
  delete descriptors.ScrollView;
  delete descriptors.AppState;
  return Object.defineProperties({
    ScrollView: MockScrollView,
    AppState: { currentState: 'active', addEventListener: () => ({ remove: jest.fn() }) },
  }, descriptors);
});
jest.mock('@react-navigation/native', () => ({
  CommonActions: { navigate: (name: string, params: unknown) => ({ type: 'NAVIGATE', payload: { name, params } }) },
  useIsFocused: () => true,
  useNavigation: () => ({ navigate: mockNavigate, dispatch: mockDispatch }),
}));
jest.mock('../../../../common/cms/useModuleContent', () => ({
  useModuleContent: () => ({ moduleContent: { promotional_banner: mockBanner, brand_promotional_banner: mockBrandBanner } }),
  moduleContentQueryKey: jest.fn(),
}));
jest.mock('../../../../common/cms/cmsContentApi', () => ({ fetchResolvedZones: jest.fn() }));
jest.mock('../../../../../query/queryClient', () => ({ queryClient: { prefetchQuery: jest.fn() } }));
jest.mock('../../../../../config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (url: string) => url || null }));

describe('promotional carousel', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  const scrollTo = mockScrollTo;
  let intervalSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    intervalSpy = jest.spyOn(global, 'setInterval');
    AppState.currentState = 'active';
    mockBanner = { content_id: 15, content_type: 'image', image_url: 'https://example.com/single.jpg' };
    mockBrandBanner = null;
  });
  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    intervalSpy.mockRestore();
    jest.useRealTimers();
  });
  const render = (element = <PromotionalBanner module="service" />) => {
    act(() => {
      renderer = TestRenderer.create(element, {
        createNodeMock: () => ({ scrollTo }),
      });
    });
  };

  it('opens the product grid scoped to the image pressed, including inherited selections', () => {
    mockBanner.title = 'Summer offers';
    mockBanner.target_type = 'product';
    mockBanner.target_ids = [12];
    mockBanner.images = [
      { image_id: 1, image_url: 'one.jpg', is_active: 1, sort_order: 0, target_type: 'product', target_ids: [21, 22] },
      { image_id: 2, image_url: 'two.jpg', is_active: 1, sort_order: 1 },
    ];
    render(<HomeBanner />);
    const [firstSlide, secondSlide] = renderer.root.findAllByType(TouchableOpacity);
    firstSlide.props.onPress();
    secondSlide.props.onPress();
    expect(mockNavigate).toHaveBeenNthCalledWith(1, 'CampaignProducts', {
      contentId: 15, imageId: 1, title: 'Summer offers',
    });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, 'CampaignProducts', {
      contentId: 15, imageId: 2, title: 'Summer offers',
    });
  });

  it('supports a legacy standalone banner with a banner-level selection', () => {
    mockBanner.target_type = 'product';
    mockBanner.target_id = 21;
    mockBanner.images = [{ image_id: null, image_url: mockBanner.image_url, is_active: 1, sort_order: 0 }];
    render(<HomeBanner />);
    renderer.root.findByType(TouchableOpacity).props.onPress();
    expect(mockNavigate).toHaveBeenCalledWith('CampaignProducts', {
      contentId: 15, imageId: undefined, title: 'Promotional Products',
    });
  });

  it('opens each dashboard slide in its configured module', () => {
    mockBanner.title = 'Weekend deals';
    mockBanner.images = [
      { image_id: 5, image_url: 'one.jpg', is_active: 1, sort_order: 0, target_type: 'product', target_id: 12 },
      { image_id: 6, image_url: 'two.jpg', is_active: 1, sort_order: 1, target_type: 'service_bundle', target_id: 24 },
    ];
    render(<PromotionalBanner module="mobile_dashboard" />);
    const [product, service] = renderer.root.findAllByType(TouchableOpacity);
    product.props.onPress();
    service.props.onPress();
    expect(mockNavigate).toHaveBeenNthCalledWith(1, 'Home', {
      screen: 'ProductModule',
      params: { screen: 'CampaignProducts', params: { contentId: 15, imageId: 5, title: 'Weekend deals' } },
    });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, 'Home', {
      screen: 'ServicesModule',
      params: { screen: 'PackScreen', params: { bundleId: 24, title: 'Weekend deals' } },
    });
  });

  it('opens a single service or an offer collection based on the slide selection', () => {
    mockBanner.title = 'Service deals';
    mockBanner.target_type = 'service';
    mockBanner.target_id = '12';
    mockBanner.images = [
      { image_id: 5, image_url: 'one.jpg', is_active: 1, sort_order: 0 },
      { image_id: 6, image_url: 'two.jpg', is_active: 1, sort_order: 1, target_type: 'service', target_ids: '[21,22]' },
    ];
    render();
    const [service, collection] = renderer.root.findAllByType(TouchableOpacity);
    service.props.onPress();
    collection.props.onPress();
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'NAVIGATE',
      payload: { name: 'ServiceDescription', params: { serviceId: 12 } },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'NAVIGATE',
      payload: { name: 'ServiceCampaign', params: { contentId: 15, imageId: 6, title: 'Service deals' } },
    });
  });

  it('keeps an external link clickable when there is no product selection', () => {
    mockBanner.redirect_link = 'https://example.com/promotion';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    try {
      render(<HomeBanner />);
      renderer.root.findByType(TouchableOpacity).props.onPress();
      expect(openURL).toHaveBeenCalledWith(mockBanner.redirect_link);
      expect(mockNavigate).not.toHaveBeenCalled();
    } finally {
      openURL.mockRestore();
    }
  });

  it('renders a published brand banner and opens its configured category products', () => {
    mockBanner = null;
    mockBrandBanner = {
      content_id: 32, title: 'New brands', content_type: 'image', display_mode: 'grid_2',
      images: [
        { image_id: 7, image_url: 'one.jpg', is_active: 1, sort_order: 0, target_type: 'category', target_id: 12 },
        { image_id: 8, image_url: 'two.jpg', is_active: 1, sort_order: 1 },
      ],
    };
    render(<HomeBanner />);
    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(renderer.root.findAllByType(Animated.Image)).toHaveLength(2);
    renderer.root.findByType(TouchableOpacity).props.onPress();
    expect(mockNavigate).toHaveBeenCalledWith('CampaignProducts', { contentId: 32, imageId: 7, title: 'New brands' });
  });

  it('renders the CMS gradient, title, CTA and text color for a color promotion', () => {
    const colors = ['#852BAF', '#FC3F78'];
    mockBanner = {
      ...mockBanner, content_type: 'color', color_value: JSON.stringify({ type: 'gradient', colors, direction: 'left-right' }),
      title: 'Weekend deals', cta_text: 'Shop now', text_color: '#FAFAFA', target_type: 'product',
    };
    render(<HomeBanner />);
    expect(renderer.root.findByType(LinearGradient).props.colors).toEqual(colors);
    const texts = renderer.root.findAllByType(Text);
    expect(texts.map(node => node.props.children)).toEqual(['Weekend deals', 'Shop now']);
    expect(texts.every(node => StyleSheet.flatten(node.props.style).color === '#FAFAFA')).toBe(true);
  });

  it('keeps one image static and sizes it from its natural dimensions', () => {
    render();
    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0);
    const image = renderer.root.findByType(Animated.Image);
    expect(image.props.source.uri).toBe(mockBanner.image_url);
    act(() => image.props.onLoad({ nativeEvent: { source: { width: 800, height: 400 } } }));
    expect(StyleSheet.flatten(image.parent!.props.style).aspectRatio).toBe(2);
    expect(intervalSpy.mock.calls.filter(call => call[1] === 3500)).toHaveLength(0);
  });

  it('sorts active images, advances automatically, wraps, and accepts swipes', () => {
    mockBanner.images = [
      { image_id: 2, image_url: 'two.jpg', is_active: '1', sort_order: 2 },
      { image_id: 1, image_url: 'one.jpg', is_active: 1, sort_order: 1 },
      { image_id: 3, image_url: 'hidden.jpg', is_active: 0, sort_order: 0 },
    ];
    render();
    expect(renderer.root.findAllByType(Animated.Image).map(image => image.props.source.uri)).toEqual(['one.jpg', 'two.jpg']);
    scrollTo.mockClear();
    act(() => jest.advanceTimersByTime(3500));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: expect.any(Number), animated: true });
    expect(scrollTo.mock.calls[0][0].x).toBeGreaterThan(0);
    act(() => jest.advanceTimersByTime(3500));
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: true });
    act(() => renderer.root.findByType(ScrollView).props.onScrollBeginDrag());
    const calls = scrollTo.mock.calls.length;
    act(() => jest.advanceTimersByTime(3500));
    expect(scrollTo).toHaveBeenCalledTimes(calls);
  });

  it('falls back to a static image when another slide fails', () => {
    mockBanner.images = [
      { image_id: 1, image_url: 'one.jpg', is_active: 1, sort_order: 0 },
      { image_id: 2, image_url: 'two.jpg', is_active: 1, sort_order: 1 },
    ];
    render();
    act(() => renderer.root.findAllByType(Animated.Image)[0].props.onError());
    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(renderer.root.findByType(Animated.Image).props.source.uri).toBe('two.jpg');
    scrollTo.mockClear();
    act(() => jest.advanceTimersByTime(3500));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
