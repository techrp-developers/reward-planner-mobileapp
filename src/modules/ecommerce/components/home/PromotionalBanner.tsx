import React from 'react';
import {
  AppState, Animated, ImageLoadEvent, Linking, ScrollView, StyleSheet,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { normalizeLocalCmsImageUrl } from '../../../../config/apiConfig';
import { fetchResolvedZones } from '../../../common/cms/cmsContentApi';
import type { CmsModuleKey } from '../../../common/cms/cmsContentApi';
import { useModuleContent, moduleContentQueryKey } from '../../../common/cms/useModuleContent';
import { queryClient } from '../../../../query/queryClient';

const FALLBACK_ASPECT_RATIO = 1 / 0.92;
const AUTOPLAY_MS = 3500;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
type Slide = { id: string; url: string };
type Props = { module?: CmsModuleKey };

function PromotionalBanner({ module = 'product' }: Props) {
  const { moduleContent } = useModuleContent(module);
  const banner = moduleContent?.promotional_banner ?? null;
  const isFocused = useIsFocused();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = React.useState(windowWidth);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [appActive, setAppActive] = React.useState(AppState.currentState === 'active');
  const [ratios, setRatios] = React.useState<Record<string, number>>({});
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});
  const scrollRef = React.useRef<ScrollView>(null);

  const images = React.useMemo(() => {
    if (banner?.content_type !== 'image') return [];
    const gallery = Array.isArray(banner.images) && banner.images.length > 0
      ? banner.images
      : banner.image_url
        ? [{ image_id: banner.content_id, image_url: banner.image_url, is_active: 1, sort_order: 0 }]
        : [];
    return gallery.filter(image => Number(image.is_active) === 1)
      .slice().sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map(image => ({
        id: String(image.image_id ?? `${banner.content_id}_${image.sort_order}`),
        url: normalizeLocalCmsImageUrl(image.image_url),
      }))
      .filter((image): image is Slide => Boolean(image.url));
  }, [banner]);
  const slides = React.useMemo(() => images.filter(image => !failedImages[image.url]), [images, failedImages]);
  const galleryKey = JSON.stringify(images);
  const slidesKey = JSON.stringify(slides);

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
    if (slides.length <= 1 || !isFocused || !appActive || dragging) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [activeIndex, slides.length, width, isFocused, appActive, dragging]);

  const handlePress = () => {
    if (banner?.redirect_link) Linking.openURL(banner.redirect_link).catch(() => undefined);
  };
  const handleImageLoad = (url: string, event: ImageLoadEvent) => {
    const source = event.nativeEvent.source;
    if (source.width && source.height) {
      setRatios(current => ({ ...current, [url]: clamp(source.width / source.height, 0.45, 2.2) }));
    }
  };

  const showColor = slides.length === 0 && Boolean(banner?.color_value);
  if (!slides.length && !showColor) return null;
  // The first slide sets the natural height, keeping the carousel stable as it rotates.
  const aspectRatio = slides[0] ? ratios[slides[0].url] ?? FALLBACK_ASPECT_RATIO : FALLBACK_ASPECT_RATIO;
  const Wrapper = banner?.redirect_link ? TouchableOpacity : View;
  const renderImage = (image: Slide) => (
    <Wrapper key={image.id} activeOpacity={0.9}
      onPress={banner?.redirect_link ? handlePress : undefined}
      style={{ width, aspectRatio }}>
      <Animated.Image
        accessibilityLabel={banner?.title || 'Promotional banner'}
        source={{ uri: image.url }}
        style={[StyleSheet.absoluteFill, !ratios[image.url] ? styles.imageLoading : null]}
        resizeMode="cover"
        onLoad={event => handleImageLoad(image.url, event)}
        onError={() => setFailedImages(current => ({ ...current, [image.url]: true }))}
      />
    </Wrapper>
  );

  return (
    <View style={styles.wrapper} onLayout={event => {
      if (event.nativeEvent.layout.width > 0) setWidth(event.nativeEvent.layout.width);
    }}>
      <View style={[styles.bannerBox, { aspectRatio }]}>
        {showColor ? (
          <Wrapper activeOpacity={0.9} onPress={banner?.redirect_link ? handlePress : undefined}
            style={[StyleSheet.absoluteFill, { backgroundColor: banner!.color_value! }]} />
        ) : slides.length === 1 ? renderImage(slides[0]) : (
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
        {slides.length > 1 ? (
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
  queryClient.prefetchQuery({
    queryKey: moduleContentQueryKey(module),
    queryFn: () => fetchResolvedZones(module),
    staleTime: 5 * 60 * 1000,
  });

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 8 },
  bannerBox: {
    width: '100%', overflow: 'hidden', elevation: 4, shadowColor: '#000',
    shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  imageLoading: { opacity: 0.85 },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  activeDot: { width: 16, backgroundColor: '#fff' },
});
