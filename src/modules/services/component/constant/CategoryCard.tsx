import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { prefetchService } from '../../utils/serviceCache';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { getServiceImageUrl } from '../../utils/serviceImage';

type VerticalServiceCardProps = {
  serviceId: number;
  title: string;
  description: string;
  image: string | React.ComponentType<{ width?: number; height?: number }>;
  priceText?: string;
  days?: string; 
  rating?: number;
};

const STAR_INDICES = [1, 2, 3, 4];

function CategoryCard({
  serviceId,
  title,
  description,
  image,
  priceText,
  days,
}: VerticalServiceCardProps) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const isUrlImage = typeof image === 'string';
  const [imageLoading, setImageLoading] = useState(isUrlImage);

  const imageUri = useMemo(
    () => (isUrlImage ? getServiceImageUrl(String(image || ''), 'small') : ''),
    [isUrlImage, image]
  );

  useEffect(() => {
    setImageLoading(isUrlImage);
  }, [isUrlImage, image]);

  const handlePress = useCallback(() => {
    // Warm the cache immediately; ServiceDescription will read from it on mount.
    prefetchService(serviceId);
    navigation.navigate('ServiceDescription', {
      serviceId,
      title,
    });
  }, [navigation, serviceId, title]);

  const handleLoadStart = useCallback(() => setImageLoading(true), []);
  const handleLoadEnd = useCallback(() => setImageLoading(false), []);
  const handleLoadError = useCallback(() => setImageLoading(false), []);

  const parsedPriceValue = Number(String(priceText || '').replace(/[^0-9.]/g, ''));
  const hasPositivePrice = Number.isFinite(parsedPriceValue) && parsedPriceValue > 0;
  const primaryButtonText = hasPositivePrice
    ? `${priceText} + Get Start`
    : 'Get Started';

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* LEFT: IMAGE SECTION */}
      <View style={styles.imageBox}>
        {isUrlImage ? (
          <>
            {imageLoading && (
              <View style={styles.imageSkeleton} />
            )}
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, imageLoading && styles.imageHidden]}
              resizeMode="cover"
              onLoadStart={handleLoadStart}
              
              onLoadEnd={handleLoadEnd}
              onError={handleLoadError}
            />
          </>
        ) : (
          React.createElement(image, {
            width: 120,
            height: 120,
          })
        )}
      </View>

      {/* RIGHT: CONTENT SECTION */}
      <View style={styles.content}>
        <View>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.desc} numberOfLines={2}>{description}</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              {STAR_INDICES.map((i) => (
                <MaterialIcons key={i} name="star" size={18} color="#FFC107" />
              ))}
              <MaterialIcons name="star-half" size={18} color="#FFC107" />
            </View>
            <Text style={styles.reviewCount}>({days || '12.2K'})</Text>
          </View>

          <LinearGradient
            colors={['#8E70FF', '#6049C3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{primaryButtonText}</Text>
            {hasPositivePrice && (
               <View style={styles.coinIcon} />
            )}
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(CategoryCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'transparent', // Ensures no background interference
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  imageBox: {
    width: 120,
    height: 120,
    borderRadius: 18, // More rounded for the "modern" look
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    position: 'absolute',
    opacity: 0,
  },
  imageSkeleton: {
    width: '100%',
    height: 120,
    borderRadius: 18,
    backgroundColor: '#ECECEC',
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1C1E',
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 14,
    color: '#606470',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '400',
  },
  bottomSection: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    marginLeft: 6,
    fontSize: 13,
    color: '#717680',
    fontWeight: '500',
  },
  ctaButton: {
    borderRadius: 10,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignSelf: 'flex-start', // Keeps button width natural to content
    minWidth: 140,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  coinIcon: {
     width: 16,
     height: 16,
     backgroundColor: '#FFD700',
     borderRadius: 8,
     marginLeft: 4,
  }
});