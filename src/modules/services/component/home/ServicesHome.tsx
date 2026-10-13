import { queryClient } from '../../../../query/queryClient';
import ModuleSkeleton from '../../../common/components/ModuleSkeleton';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,

} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import type { HomeStackParamList } from '../../navigation/type';

import {
  getAllServiceCategories,
  getServiceByCategory,
} from '../../api/ServiceAPI';
import { prefetchService } from '../../utils/serviceCache';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { useServicesTheme } from '../../utils/useServicesTheme';

type CardType = 'small' | 'wide' | 'narrow';
const SERVICE_CATEGORIES_QUERY_KEY = ['services', 'categories'] as const;
const SERVICE_CATEGORIES_STALE_TIME = 10 * 60 * 1000;



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
  const servicesTheme = useServicesTheme();
  const sizeStyle =
    type === 'wide'
      ? styles.wideCard
      : type === 'narrow'
        ? styles.narrowCard
        : styles.smallCard;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, sizeStyle, { borderColor: servicesTheme.colors.border }]}
    >
      <LinearGradient
        colors={servicesTheme.gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Text style={[styles.title, { color: servicesTheme.colors.textStrong }]} numberOfLines={2} ellipsizeMode="tail">
        {title}
      </Text>

      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.cardImage,
            type === 'wide' ? styles.wideImage : styles.smallImage,
          ]}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

export const prefetchServiceCategories = () => queryClient.prefetchQuery({
  queryKey: SERVICE_CATEGORIES_QUERY_KEY,
  queryFn: async () => { const data = await getAllServiceCategories(); return Array.isArray(data) ? data : []; },
  staleTime: SERVICE_CATEGORIES_STALE_TIME,
});

export default function ServicesHome() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: SERVICE_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const data = await getAllServiceCategories();
      return Array.isArray(data) ? data : [];
    },
    staleTime: SERVICE_CATEGORIES_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

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

  return (
    <View style={styles.container}>
      {loading ? (
        <ModuleSkeleton variant="services" height={220} />
      ) : (
        <View style={styles.row}>
          {categories.map((item, index) => {
            const cardType: CardType = index === 3 ? 'wide' : index === 4 ? 'narrow' : 'small';

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
    marginTop: 12,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    borderRadius: 16,
    height: 120,
    marginBottom: 8,
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(101, 73, 195, 0.18)',
  },

  /* GRID SIZES */
  smallCard: {
    width: '31.5%',
  },

  wideCard: {
    width: '65.5%',
    height: 120,
  },

  narrowCard: {
    width: '31.5%',
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 18,
  },

  imageWrap: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },

  cardImage: {
    width: 72,
    height: 72,
  },
  smallImage: {
    width: 72,
    height: 72,
  },
  wideImage: {
    width: 150,
    height: 86,
  },
});

