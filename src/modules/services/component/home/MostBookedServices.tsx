import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { HomeStackParamList, ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import Card from '../constant/Card';

const CONTAINER_PADDING = 16;


export default function MostBookedServices() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data, isLoading, error } = useServiceHome();
  const [activeIdx, setActiveIdx] = useState(0);

  const viewConfigPairs = useRef([
    {
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: 60,
        minimumViewTime: 30,
      },
      onViewableItemsChanged: ({ viewableItems }: any) => {
        const idx = viewableItems?.[0]?.index;
        if (idx != null) setActiveIdx(idx);
      },
    },
  ]);

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data || !Array.isArray(data.data)) return [];

    const section = data.data.find(
      s => s.section_key === 'popular_services',
    );

    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <Text style={styles.title}>Most Booked Services</Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (error || services.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Most Booked Services</Text>

      <FlatList
        horizontal
        data={services}
        keyExtractor={item => `${item.service_id}-${item.variant_id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        // snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        viewabilityConfigCallbackPairs={viewConfigPairs.current}
        renderItem={({ item }) => {
          const imageSource =
            item.variant_image
              ? { uri: item.variant_image }
              : item.service_image
                ? { uri: item.service_image }
                : item.image
                  ? { uri: item.image }
                  : null;

          const discount =
            item.discount_percent && item.discount_percent > 0
              ? `${item.discount_percent}%`
              : '';

          const coinsText = item.coins ? String(item.coins) : '';

          return (
            <Card
              title={item.name}
              image={imageSource}
              price={`₹${item.price}`}
              oldPrice={
                item.mrp && item.mrp > item.price
                  ? `₹${item.mrp}`
                  : undefined
              }
              users="18.9K"
              coins={coinsText}
              discount={discount}
              onPress={() =>
                navigation.navigate('ServiceDescription', {
                  serviceId: item.service_id,
                  title: item.name,
                })
              }
            />
          );
        }}
      />

      <View style={styles.dotContainer}>
        {services.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIdx === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4F6BFF', // Integrated your explicit theme color
    marginTop: 20,

    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF', // High contrast white for dark theme background
    marginBottom: 16,
    textAlign: 'left', // Centers heading visually within your brand card element
    letterSpacing: -0.2,
    paddingLeft: CONTAINER_PADDING,

  },

  listContent: {
    paddingLeft: CONTAINER_PADDING,
  },

  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },

  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  card: {
    width: 170,
    marginRight: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Semi-transparent dots over background
  },

  activeDot: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF', // Clear active white dot indicator
  },
});