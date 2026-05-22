import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const HomePack = require('../../assete/home/home_setup_pack.png');
const MarriedPack = require('../../assete/home/marrige_pack.png');
const JobPack = require('../../assete/home/job_joining_pack.png');
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/type';
import { useServiceBundles } from '../../hooks/useServiceBundles';
import { getServiceImageUrl } from '../../utils/serviceImage';

type NavProp = NativeStackNavigationProp<HomeStackParamList>;

interface BundleCardProps {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  imageUrl?: string;
  fallbackImage: any;
  onPress: () => void;
}


const BundleCard = ({
  title,
  description,
  price,
  oldPrice,
  imageUrl,
  fallbackImage,
  onPress,
}: BundleCardProps) => (<LinearGradient
  colors={['#EDE8FF', '#C2B2FF']} // 180deg background gradient
  style={styles.card}
>
  <View style={styles.textContainer}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{description}</Text>
  </View>

  <TouchableOpacity
    activeOpacity={0.8}
    style={styles.buttonWrapper}
    onPress={onPress}
  >
    <LinearGradient
      colors={['#8665FF', '#5B47A3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.cta}
    >
      <Text style={styles.ctaText}>
        Get the Full Package at ₹{price}
        <Text style={styles.oldPriceText}> ₹{oldPrice}</Text>
      </Text>
    </LinearGradient>
  </TouchableOpacity>

  <View style={styles.imageContainer}>
    <Image
      source={
        imageUrl
          ? { uri: getServiceImageUrl(imageUrl, 'medium') }
          : fallbackImage
      }
      style={styles.bundleImage}
      resizeMode="contain"
    />
  </View>
</LinearGradient>
);

export default function BundleService() {
  const navigation = useNavigation<NavProp>();
  const { data, isLoading } = useServiceBundles();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.mainHeading}>Bundle Services</Text>
        <ActivityIndicator size="large" color="#8665FF" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mainHeading}>Bundle Services</Text>

      {data?.map((item) => {
        // Map fallback images by id
        let fallbackImage = HomePack;

        if (item.id === 2) fallbackImage = MarriedPack;
        if (item.id === 3) fallbackImage = JobPack;

        // Map id to packType
        const packTypeMap: { [key: number]: 'home' | 'married' | 'job' } = {
          1: 'home',
          2: 'married',
          3: 'job',
        };

        return (
          <BundleCard
            key={item.id}
            title={item.name}
            description={item.description}
            price={item.bundle_price}
            oldPrice={item.original_price}
            imageUrl={item.banner_image}
            fallbackImage={fallbackImage}
            onPress={() =>
              navigation.navigate('PackScreen', {
                packType: packTypeMap[item.id] || 'home',
                bundleId: item.id,
                title: item.name,
              })
            }
          />
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    paddingTop: 20,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
    elevation: 4, // for shadow
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonWrapper: {
    width: '80%',
    zIndex: 10,
  },
  cta: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  oldPriceText: {
    textDecorationLine: 'line-through',
    fontSize: 12,
    color: '#E5E7EB',
    opacity: 0.8,
  },
  imageContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },

  bundleImage: {
    width: '100%',
    height: 120,
  },
  loader: {
    marginTop: 20,
  },
});