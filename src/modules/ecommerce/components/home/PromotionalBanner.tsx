import React from 'react';
import {
  AppState, Animated, ImageLoadEvent, Linking, ScrollView, StyleSheet,
  TouchableOpacity, View, useWindowDimensions, type StyleProp, type ViewStyle,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import CmsBannerCopy from '../../../common/cms/CmsBannerCopy';
import { CMS_IMAGE_ASPECT_RATIOS } from '../../../common/cms/cmsImageLayout';
import type { CmsModuleKey, CmsOfferImage, CmsZoneEntry } from '../../../common/cms/cmsContentApi';
import { useModuleContent, moduleContentQueryOptions } from '../../../common/cms/useModuleContent';
import { queryClient } from '../../../../query/queryClient';

const AUTOPLAY_MS = 3500;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
type Slide = { id: string; url: string; image?: CmsOfferImage };
type Props = {
  module?: CmsModuleKey;
  zone?: 'promotional_banner' | 'brand_promotional_banner';
  getPressAction?: (banner: CmsZoneEntry, image?: CmsOfferImage) => (() => void) | undefined;
};

function PromotionalBanner({ module = 'product', zone = 'promotional_banner', getPressAction }: Props) {
  const { moduleContent } = useModuleContent(module);
  const banner = moduleContent?.[zone] ?? null;
  const isFocused = useIsFocused();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = React.useState(windowWidth);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [appActive, setAppActive] = React.useState(AppState.currentState === 'active');
  const [ratios, setRatios] = React.useState<Record<string, number>>({});
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});
  const scrollRef = React.useRef<ScrollView>(null);

  const images = React.useMemo<Slide[]>(() => {
    if (banner?.content_type !== 'image') return [];
    if (!Array.isArray(banner.images) || !banner.images.length) {
      const url = banner.image_url;
      return url ? [{ id: String(banner.content_id), url }] : [];
    }
    return banner.images.filter(image => Number(image.is_active) === 1)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map(image => ({
        id: String(image.image_id ?? `${banner.content_id}_${image.sort_order}`),
        url: image.image_url,
        image,
      }))
      .filter(slide => Boolean(slide.url));
  }, [banner]);
  const slides = React.useMemo(() => {
    const available = images.filter(image => !failedImages[image.url]);
    return banner?.display_mode === 'single' ? available.slice(0, 1) : available;
  }, [banner?.display_mode, images, failedImages]);
  const columns = banner?.display_mode === 'grid_2' ? 2 : banner?.display_mode === 'grid_3' ? 3 : 1;
  const isCarousel = columns === 1 && slides.length > 1;
  const galleryKey = JSON.stringify(images.map(({ id, url }) => [id, url]));
  const slidesKey = JSON.stringify(slides.map(({ id, url }) => [id, url]));

  React.useEffect(() => {
    setFailedImages({});
    setRatios({});
  }, [galleryKey]);

  React.useEffect(() => {
    setActiveIndex(0);
    setDragging(false);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slidesKey, width]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    if (!isCarousel || !isFocused || !appActive || dragging) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [activeIndex, isCarousel, slides.length, width, isFocused, appActive, dragging]);

  const handleImageLoad = (url: string, event: ImageLoadEvent) => {
    const source = event.nativeEvent.source;
    if (source.width && source.height) {
      setRatios(current => ({ ...current, [url]: clamp(source.width / source.height, 0.45, 2.2) }));
    }
  };

  if (!banner) return null;
  const showColor = banner.content_type === 'color';
  if (!slides.length && !showColor) return null;
  // The first slide sets the natural height, keeping the carousel stable as it rotates.
  const fallbackRatio = zone === 'brand_promotional_banner'
    ? CMS_IMAGE_ASPECT_RATIOS.brandPromotionalBanner
    : CMS_IMAGE_ASPECT_RATIOS.promotionalBanner;
  const aspectRatio = slides[0] ? ratios[slides[0].url] ?? fallbackRatio : fallbackRatio;
  const label = banner.title || 'Promotional banner';
  const redirectLink = banner.redirect_link;
  const openLink = redirectLink ? () => {
    Linking.openURL(redirectLink).catch(() => undefined);
  } : undefined;

  const renderSlide = (
    key: string,
    style: StyleProp<ViewStyle>,
    children?: React.ReactNode,
    image?: CmsOfferImage,
  ) => {
    const action = getPressAction?.(banner, image) ?? openLink;
    const copy = <CmsBannerCopy banner={banner} clickable={Boolean(action)} />;
    return action ? (
      <TouchableOpacity key={key} style={style} activeOpacity={0.9} onPress={action}
        accessibilityRole="button" accessibilityLabel={label}>
        {children}
        {copy}
      </TouchableOpacity>
    ) : <View key={key} style={style}>{children}{copy}</View>;
  };
  const renderImage = (slide: Slide) => renderSlide(slide.id, { width: width / columns, aspectRatio }, (
    <Animated.Image
      accessibilityLabel={label}
      source={{ uri: slide.url }}
      style={[StyleSheet.absoluteFill, !ratios[slide.url] ? styles.imageLoading : null]}
      resizeMode="cover"
      onLoad={event => handleImageLoad(slide.url, event)}
      onError={() => setFailedImages(current => ({ ...current, [slide.url]: true }))}
    />
  ), slide.image);

  return (
    <View style={styles.wrapper} onLayout={event => {
      if (event.nativeEvent.layout.width > 0) setWidth(event.nativeEvent.layout.width);
    }}>
      <View style={[styles.bannerBox, columns > 1 && !showColor ? styles.grid : { aspectRatio }]}>
        {showColor ? (
          renderSlide('color', StyleSheet.absoluteFill)
        ) : !isCarousel ? slides.map(renderImage) : (
          <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => setDragging(true)}
            onScrollEndDrag={() => setDragging(false)}
            onMomentumScrollEnd={event => {
              setDragging(false);
              setActiveIndex(clamp(Math.round(event.nativeEvent.contentOffset.x / width), 0, slides.length - 1));
            }}>
            {slides.map(renderImage)}
          </ScrollView>
        )}
        {isCarousel ? (
          <View style={styles.dots} pointerEvents="none">
            {slides.map((image, index) => (
              <View key={image.id} style={[styles.dot, index === activeIndex ? styles.activeDot : null]} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default React.memo(PromotionalBanner);

export const prefetchPromotionalBanner = (module: CmsModuleKey = 'product') =>
  queryClient.prefetchQuery(moduleContentQueryOptions(module));

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 8 },
  bannerBox: {
    width: '100%', overflow: 'hidden', elevation: 4, shadowColor: '#000',
    shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  imageLoading: { opacity: 0.85 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  activeDot: { width: 16, backgroundColor: '#fff' },
});
