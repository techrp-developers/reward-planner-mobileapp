import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,

} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';

import {
  getAllServiceCategories,
  getServiceByCategory,
} from '../../api/ServiceAPI';
import { prefetchService } from '../../utils/serviceCache';
import { getServiceImageUrl } from '../../utils/serviceImage';
import SkeletonBox from '../constant/SkeletonBox';

type CardType = 'medium' | 'large';

function ServiceHomeSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 750, useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View>
      {/* Row 1: three equal small cards */}
      <View style={styles.row}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.card, styles.skeletonCard, styles.skeletonSmallCard]}>
            <SkeletonBox pulse={pulse} width="65%" height={14} style={styles.skeletonTitle} />
            <SkeletonBox pulse={pulse} width={52} height={52} borderRadius={8} style={styles.skeletonImage} />
          </View>
        ))}
      </View>
      {/* Row 2: wide card + narrow card */}
      <View style={styles.row}>
        <View style={[styles.card, styles.skeletonCard, styles.skeletonWideCard]}>
          <SkeletonBox pulse={pulse} width="55%" height={14} style={styles.skeletonTitle} />
          <SkeletonBox pulse={pulse} width={76} height={76} borderRadius={8} style={styles.skeletonImage} />
        </View>
        <View style={[styles.card, styles.skeletonCard, styles.skeletonNarrowCard]}>
          <SkeletonBox pulse={pulse} width="70%" height={14} style={styles.skeletonTitle} />
          <SkeletonBox pulse={pulse} width={56} height={56} borderRadius={8} style={styles.skeletonImage} />
        </View>
      </View>
    </View>
  );
}

const Card = ({
  title,
  imageUrl,
  type,
  onPress,
}: {
  title: string;
  imageUrl: string;
  type: CardType;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        type === 'large' ? styles.largeCard : styles.mediumCard,
      ]}
    >
      <LinearGradient
        colors={['#F3F3F3', '#E3E4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

export default function ServicesHome() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCategoryPress = async (category: any) => {
    const categoryId = Number(category?.id);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return;
    }

    // Mutual Fund category → open calculator grid directly
    const categoryName = String(category?.name || '').toLowerCase();
    if (
      categoryName.includes('mutual fund') ||
      categoryName.includes('mf calculator') ||
      categoryName.includes('mutual fund calculator')
    ) {
      navigation.navigate('MutualFundCalculators');
      return;
    }

    const displayType = String(category?.display_type || 'list').toLowerCase();
    const title = String(category?.name || 'Service');

    const navigateToDirect = (serviceId: number) => {
      // Warm ServiceDescription data before/while transition happens.
      prefetchService(serviceId);
      try {
        navigation.navigate('ServiceDescription', {
          serviceId,
          categoryId,
          title,
        });
      } catch {
        const parentNav = (navigation as any).getParent?.();
        parentNav?.navigate?.('ServiceStack', {
          screen: 'ServiceDescription',
          params: { serviceId, categoryId, title },
        });
      }
    };

    // Prefer local ServiceHomeStack route; fallback to parent AppStack route.
    try {
      if (displayType === 'direct') {
        const directRes = await getServiceByCategory(categoryId);
        const serviceId = Number((directRes as any)?.service?.id || 0);
        if (Number.isFinite(serviceId) && serviceId > 0) {
          navigateToDirect(serviceId);
          return;
        }

        // Last resort for malformed direct response
        navigation.navigate('Government_Document_Screen', { categoryId });
        return;
      }

      navigation.navigate('Government_Document_Screen', { categoryId });
      return;
    } catch {
      const parentNav = (navigation as any).getParent?.();
      parentNav?.navigate?.('ServiceStack', {
        screen: 'Government_Document_Screen',
        params: { categoryId },
      });
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getAllServiceCategories();
        setCategories(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ServiceHomeSkeleton />
      ) : (
        <View style={styles.row}>
          {categories.map((item, index) => {
            let cardType: CardType = 'medium';

            // Match existing design rules.
            if (index === 0) cardType = 'large';
            if (item.name === 'MSEB Name Change') cardType = 'large';

            return (
              <Card
                key={item.id}
                title={item.name}

                imageUrl={getServiceImageUrl(item.icon, 'small')}
                type={cardType}
                onPress={() => {
                  handleCategoryPress(item);
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 16,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    borderRadius: 22,
    height: 120,
    marginBottom: 12,
    padding: 16,
    overflow: 'hidden',
  },

  /* GRID SIZES */
  mediumCard: {
    width: '48%',
  },

  largeCard: {
    width: '100%',
    height: 120,
  },

  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 20,
    maxWidth: '70%',
  },

  imageWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },

  cardImage: {
    width: 80,
    height: 80,
  },
  skeletonCard: {
    backgroundColor: '#F7F7FA',
  },
  skeletonTitle: {
    marginTop: 4,
  },
  skeletonImage: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  skeletonSmallCard: {
    width: '32%',
  },
  skeletonWideCard: {
    width: '60%',
  },
  skeletonNarrowCard: {
    width: '37%',
  },
});

