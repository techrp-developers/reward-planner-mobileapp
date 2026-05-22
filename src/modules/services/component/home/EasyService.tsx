import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Reward from '../../../../assets/product/rewards.svg';
import { HomeStackParamList } from '../../navigation/type';

interface ServiceCardProps {
  title: string;
  image: any;
  price: string;
  oldPrice: string;
  rating?: string;
  users: string;
  coins: string;
  onPress?: () => void;
}

const EasyServiceCard: React.FC<ServiceCardProps> = ({
  title,
  image,
  price,
  oldPrice,
  rating,
  users,
  coins,
  onPress,
}) => {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();

  const handlePress = () => {
    if (onPress) return onPress();

    navigation.navigate('PackEnquiryForm', {
      title,
      price,
      oldPrice,
      coins,
    });
  };

  return (
    <View style={styles.card}>
      {/* IMAGE */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.img} resizeMode="contain" />
      </View>

      {/* DETAILS */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* PRICE */}
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>₹{price}</Text>
          <Text style={styles.oldPriceText}>₹{oldPrice}</Text>
        </View>

        {/* RATING */}
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{rating ?? '⭐⭐⭐⭐⭐'}</Text>
          <Text style={styles.userText}>({users})</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.button}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.btnText}>₹{price}</Text>
              <Reward width={12} height={12} style={{ marginHorizontal: 4 }} />
              <Text style={styles.btnText}>{coins}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(EasyServiceCard);
const styles = StyleSheet.create({
  card: {
    width: 190, // ✅ reduced from 275
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  imageContainer: {
    backgroundColor: '#F3F4F6',
    height: 100, // ✅ reduced
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  img: {
    width: '80%',
    height: '80%',
  },

  details: {
    paddingHorizontal: 2,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
    marginRight: 6,
  },

  oldPriceText: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  stars: {
    fontSize: 10,
  },

  userText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },

  button: {
    borderRadius: 10,
    paddingVertical: 7, // ✅ smaller button
    alignItems: 'center',
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});