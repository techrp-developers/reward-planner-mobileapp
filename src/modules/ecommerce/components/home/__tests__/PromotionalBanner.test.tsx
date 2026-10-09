import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Animated, AppState, ScrollView, StyleSheet } from 'react-native';
import PromotionalBanner from '../PromotionalBanner';

let mockBanner: any;
const mockScrollTo = jest.fn();
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
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('../../../../common/cms/useModuleContent', () => ({
  useModuleContent: () => ({ moduleContent: { promotional_banner: mockBanner } }),
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
  });
  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    intervalSpy.mockRestore();
    jest.useRealTimers();
  });
  const render = () => {
    act(() => {
      renderer = TestRenderer.create(<PromotionalBanner module="service" />, {
        createNodeMock: () => ({ scrollTo }),
      });
    });
  };

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
