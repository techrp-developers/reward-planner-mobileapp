import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import Card from './Card';
import { HomeStackParamList, type ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';

const fallbackImg = require('../../assete/gov_documet/aadhar card.png');

const YouMayNeedServicesCarousel = () => {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data, isLoading, error } = useServiceHome();

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data) return [];
    const section = data.data.find(s => s.section_key === 'featured_services');
    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.heading}>You may also need</Text>
        <ActivityIndicator size="small" color="#8665FF" style={styles.loader} />
      </View>
    );
  }

  if (error || services.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>You may also need</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {services.map(item => {
          const imageUri = item.variant_image || item.service_image || item.image;
          const imageSource = imageUri ? { uri: imageUri } : fallbackImg;
          const discount =
            item.discount_percent && item.discount_percent > 0
              ? `${item.discount_percent}%`
              : undefined;
          const coinsText = item.coins ? String(item.coins) : '';

          return (
            <Card
              key={`${item.service_id}-${item.variant_id}`}
              title={item.name}
              image={imageSource}
              price={item.price > 0 ? `₹${item.price}` : 'Get Quote'}
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
        })}
      </ScrollView>
    </View>
  );
};

export default YouMayNeedServicesCarousel;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  heading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 8,
    marginLeft: 16,
  },
});
