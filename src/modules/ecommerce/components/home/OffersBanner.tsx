import React from 'react';
import {
  FlatList,
  Image,
  ImageResizeMode,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { queryClient } from '../../../../query/queryClient';
import CmsBannerCopy from '../../../common/cms/CmsBannerCopy';
import type { CmsModuleKey, CmsOfferImage, CmsResolvedZones } from '../../../common/cms/cmsContentApi';
import { useModuleContent, moduleContentQueryOptions } from '../../../common/cms/useModuleContent';
import { getCmsPromotionPress, type CmsPromotionNavigation } from '../../utils/cmsBannerNavigation';

const AUTOPLAY_MS = 3500;
const OFFER_ASPECT_RATIO = 4 / 5;

type OfferSlide = {
  id: string;
  imageUrl: string;
  image?: CmsOfferImage;
};

type Props = {
  module?: CmsModuleKey;
  aspectRatio?: number;
  resizeMode?: ImageResizeMode;
  moduleContent?: CmsResolvedZones | null;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function OffersBanner({
  module = 'product',
  aspectRatio = OFFER_ASPECT_RATIO,
  resizeMode = 'contain',
  moduleContent: controlledModuleContent,
  wrapperStyle,
}: Props) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<CmsPromotionNavigation>();
  const { moduleContent: fetchedModuleContent } = useModuleContent(module);
  const moduleContent = controlledModuleContent ?? fetchedModuleContent;
  const banner = moduleContent?.offers_banner ?? null;
  const listRef = React.useRef<FlatList<OfferSlide>>(null);
  const pauseCyclesRef = React.useRef(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});

  const itemWidth = width - 32;
  const slides = React.useMemo<OfferSlide[]>(() => {
    if (banner?.content_type !== 'image') {
      return [];
    }

    if (!banner.images?.length) {
      const id = String(banner.content_id);
      return banner.image_url && !failedImages[id] ? [{ id, imageUrl: banner.image_url }] : [];
    }

    return banner.images
      .filter((image) => Number(image.is_active) === 1)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: String(image.image_id ?? `${banner.content_id}_${image.sort_order}`),
        imageUrl: image.image_url,
        image,
      }))
      .filter((slide) => slide.imageUrl && !failedImages[slide.id]);
  }, [banner, failedImages]);

  React.useEffect(() => {
    setActiveIndex(0);
    setFailedImages({});
  }, [banner?.content_id]);

  React.useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (pauseCyclesRef.current > 0) {
        pauseCyclesRef.current -= 1;
        return;
      }

      const nextIndex = (activeIndex + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  React.useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(Math.max(slides.length - 1, 0));
    }
  }, [activeIndex, slides.length]);

  if (!banner) {
    return null;
  }

  const showColorFallback =
    slides.length === 0 &&
    banner.content_type === 'color' &&
    Boolean(banner.color_value);

  if (!slides.length && !showColorFallback) {
    return null;
  }

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
  };

  if (showColorFallback) {
    const onPress = getCmsPromotionPress(navigation, module, banner);
    return (
      <View style={[styles.wrapper, wrapperStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!onPress}
          onPress={onPress}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={banner.title || 'Offer banner'}
          style={[
            styles.colorFallback,
            {
              width: itemWidth,
              aspectRatio,
            },
          ]}
        >
          <CmsBannerCopy banner={banner} clickable={Boolean(onPress)} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => {
          pauseCyclesRef.current = 1;
        }}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        renderItem={({ item }) => {
          const onPress = getCmsPromotionPress(navigation, module, banner, item.image);
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!onPress}
              onPress={onPress}
              accessibilityRole={onPress ? 'button' : undefined}
              accessibilityLabel={banner.title || 'Offer banner'}
              style={[styles.slide, { width: itemWidth, aspectRatio }]}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode={resizeMode}
                onError={() => {
                  setFailedImages((current) => ({
                    ...current,
                    [item.id]: true,
                  }));
                }}
              />
              <CmsBannerCopy banner={banner} clickable={Boolean(onPress)} />
            </TouchableOpacity>
          );
        }}
      />

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(OffersBanner);

export const prefetchOffersBanner = (module: CmsModuleKey = 'product') =>
  queryClient.prefetchQuery(moduleContentQueryOptions(module));

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  slide: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  colorFallback: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.65)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#111827',
  },
});
