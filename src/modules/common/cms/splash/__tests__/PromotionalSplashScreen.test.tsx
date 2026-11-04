import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Animated, BackHandler, Image, Modal } from 'react-native';
import PromotionalSplashScreen, { FADE_MS, IMAGE_LOAD_TIMEOUT_MS, MAX_VISIBLE_MS } from '../PromotionalSplashScreen';
import { __resetFrequencyForTests, recordServerTime } from '../splashFrequency';

let backListener: (() => boolean) | null = null;
const removeBack = jest.fn();

const campaign = (display: Record<string, any> = {}, extra: Record<string, any> = {}) => ({
  content_id: 21,
  placement_id: 1,
  title: 'Happy Diwali',
  cta_text: 'Diwali Utsaav',
  image_url: 'https://cdn.rewardplanners.com/x.webp',
  display_mode: 'single',
  navigation: null,
  link: null,
  priority: 0,
  starts_at: null,
  expires_at: null,
  ...extra,
  display: { frequency_rule: 'every_visit' as const, display_seconds: 3, auto_dismiss: true, dismissible: true, ...display },
});

describe('PromotionalSplashScreen', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  let onShown: jest.Mock;
  let onFinish: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    __resetFrequencyForTests();
    onShown = jest.fn();
    onFinish = jest.fn();
    backListener = null;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, listener: any) => {
      backListener = listener;
      return { remove: removeBack };
    });
    // Run the fade synchronously at its real duration via fake timers.
    jest.spyOn(Animated, 'timing').mockImplementation((value: any, config: any) => ({
      start: (cb?: (r: { finished: boolean }) => void) => {
        setTimeout(() => {
          value.setValue(config.toValue);
          cb?.({ finished: true });
        }, config.duration);
      },
      stop: jest.fn(),
      reset: jest.fn(),
    }) as any);
  });
  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const render = (c = campaign(), actionable = false) => {
    act(() => {
      renderer = TestRenderer.create(
        <PromotionalSplashScreen campaign={c} actionable={actionable} onShown={onShown} onFinish={onFinish} />,
      );
    });
  };
  const artwork = () => renderer.root.findByProps({ testID: 'promo-splash-image' });
  const load = () => act(() => artwork().props.onLoad());
  const skip = () => renderer.root.findAll(n => n.props.testID === 'promo-splash-skip' && typeof n.props.onPress === 'function').slice(0, 1);

  it('renders the exact CMS artwork contained over a blurred fill, without a Modal', () => {
    render();
    const images = renderer.root.findAllByType(Image);
    expect(images.every(img => img.props.source.uri === 'https://cdn.rewardplanners.com/x.webp')).toBe(true);
    expect(artwork().props.resizeMode).toBe('contain');
    expect(images.some(img => img.props.blurRadius > 0 && img.props.resizeMode === 'cover')).toBe(true);
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
  });

  it('records shown and starts the countdown only after the fade completes', () => {
    render();
    load();
    act(() => jest.advanceTimersByTime(FADE_MS - 1));
    expect(onShown).not.toHaveBeenCalled();
    expect(skip()).toHaveLength(0);

    act(() => jest.advanceTimersByTime(1));
    expect(onShown).toHaveBeenCalledTimes(1);
    expect(skip()).toHaveLength(1);

    act(() => jest.advanceTimersByTime(2999));
    expect(onFinish).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onFinish).toHaveBeenCalledWith('auto');
  });

  it('closes immediately on Skip and never finishes twice', () => {
    render();
    load();
    act(() => jest.advanceTimersByTime(FADE_MS));
    act(() => skip()[0].props.onPress());
    act(() => jest.advanceTimersByTime(MAX_VISIBLE_MS));
    act(() => { backListener?.(); });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('skip');
  });

  it('Android Back dismisses a dismissible campaign and is always consumed', () => {
    render();
    let handled = false;
    act(() => { handled = backListener!(); });
    expect(handled).toBe(true);
    expect(onFinish).toHaveBeenCalledWith('back');
  });

  it('a non-dismissible campaign hides Skip, swallows Back and still auto-closes', () => {
    render(campaign({ dismissible: false, auto_dismiss: false, display_seconds: 4 }));
    load();
    act(() => jest.advanceTimersByTime(FADE_MS));
    expect(skip()).toHaveLength(0);
    act(() => { expect(backListener!()).toBe(true); });
    expect(onFinish).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(4000));
    expect(onFinish).toHaveBeenCalledWith('auto');
  });

  it('a manual-close campaign is capped by the safety ceiling', () => {
    render(campaign({ auto_dismiss: false }));
    load();
    act(() => jest.advanceTimersByTime(FADE_MS + MAX_VISIBLE_MS));
    expect(onFinish).toHaveBeenCalledWith('safety');
  });

  it('falls back to the default duration for an invalid one', () => {
    render(campaign({ display_seconds: Number.NaN }));
    load();
    act(() => jest.advanceTimersByTime(FADE_MS + 3000));
    expect(onFinish).toHaveBeenCalledWith('auto');
  });

  it('closes without recording when the image fails or never loads', () => {
    render();
    act(() => artwork().props.onError());
    expect(onFinish).toHaveBeenCalledWith('image_error');

    onFinish.mockClear();
    act(() => renderer.unmount());
    render();
    act(() => jest.advanceTimersByTime(IMAGE_LOAD_TIMEOUT_MS));
    expect(onFinish).toHaveBeenCalledWith('image_error');
    expect(onShown).not.toHaveBeenCalled();
  });

  it('closes when the campaign expires while visible', () => {
    recordServerTime(new Date(Date.now()).toISOString());
    render(campaign({}, { expires_at: new Date(Date.now() + 1000).toISOString() }));
    load();
    act(() => jest.advanceTimersByTime(1000));
    expect(onFinish).toHaveBeenCalledWith('expired');
  });

  it('artwork tap finishes with cta only when actionable', () => {
    render(campaign(), false);
    const area = () => renderer.root.findByProps({ testID: 'promo-splash-artwork' });
    expect(area().props.disabled).toBe(true);
    act(() => renderer.unmount());
    render(campaign(), true);
    act(() => area().props.onPress());
    expect(onFinish).toHaveBeenCalledWith('cta');
  });

  it('clears timers and the Back listener on unmount', () => {
    render();
    load();
    act(() => renderer.unmount());
    act(() => jest.advanceTimersByTime(MAX_VISIBLE_MS * 2));
    expect(onFinish).not.toHaveBeenCalled();
    expect(removeBack).toHaveBeenCalled();
  });
});
