import React from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { queryClient } from '../../../../query/queryClient';
import { fetchResolvedZones } from '../../../common/cms/cmsContentApi';
import type { CmsModuleKey } from '../../../common/cms/cmsContentApi';
import { useModuleContent, moduleContentQueryKey } from '../../../common/cms/useModuleContent';

const DEFAULT_PROMO_BG = '#852BAF';

type Props = {
  module?: CmsModuleKey;
};

function PromotionalBanner({ module = 'product' }: Props) {
  const { width } = useWindowDimensions();
  const { moduleContent } = useModuleContent(module);
  const banner = moduleContent?.promotional_banner ?? null;
  const [imageFailed, setImageFailed] = React.useState(false);

  console.log('[CMS] Promotional banner module:', module);
  console.log('[CMS] Promotional banner:', JSON.stringify(banner));

  React.useEffect(() => {
    setImageFailed(false);
  }, [banner?.content_id, banner?.image_url]);

  if (!banner) {
    return null;
  }

  const imageUrl =
    banner.content_type === 'image' && !imageFailed
      ? banner.image_url
      : null;
  const bgColor = banner.color_value || DEFAULT_PROMO_BG;
  console.log('[CMS] Promotional image URL:', imageUrl);
  console.log('[CMS] Promotional background:', bgColor);
  const isPressable = Boolean(banner.redirect_link);
  const showCta = Boolean(banner.cta_text && banner.redirect_link);
  const Container = isPressable ? TouchableOpacity : View;

  const handlePress = () => {
    if (banner.redirect_link) {
      Linking.openURL(banner.redirect_link).catch(() => undefined);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Container
        activeOpacity={0.9}
        onPress={isPressable ? handlePress : undefined}
        style={[
          styles.banner,
          {
            width: width - 32,
            backgroundColor: bgColor,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={(event) => {
              console.log('[CMS] Promotional image failed:', imageUrl, event.nativeEvent);
              setImageFailed(true);
            }}
          />
        ) : null}

        {showCta ? (
          <View style={styles.ctaPill}>
            <Text style={styles.ctaText} numberOfLines={1}>
              {banner.cta_text}
            </Text>
          </View>
        ) : null}
      </Container>
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
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  banner: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaPill: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ctaText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
});
