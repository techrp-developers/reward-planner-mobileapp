import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import Card from '../constant/Card';
import { HomeStackParamList } from '../../navigation/type';
import { getServiceImageUrl } from '../../utils/serviceImage';

// ✅ Proper Type (not any)
type ServiceItem = {
  service_id: number;
  variant_id: number;
  name: string;
  description?: string;
  price: number;
  image: string | null;
  onPress?: () => void; // ✅ ADD THIS

};

type Props = {
  data: ServiceItem[];
};

export default function MostBookedServices({ data }: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
const getImageSource = (image?: string | null) => {
  const uri = getServiceImageUrl(image || '', 'small') || null;

  if (uri) {
    return { uri };
  }

  return require('../../assete/gov_documet/domacile_certificate.png');
};
  // ✅ Handle empty state
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Most Booked Services</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {data.map((item) => (
          <Card
            key={`${item.service_id}-${item.variant_id}`}
            title={item.name}
  image={getImageSource(item.image)} // ✅ ONLY THIS

            price={`₹${item.price}`}
            oldPrice={`₹${item.price}`}
            users="20K"
            coins="100"
            onPress={() =>
              navigation.navigate('ServiceDescription', {
                serviceId: item.service_id,
                title: item.name,
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4361EE',
    paddingTop: 20,
    paddingBottom: 24,
    borderRadius: 24,
    marginHorizontal: 10,
    marginTop: 20,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});