import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Reward from '../../../../assets/product/rewards.svg';
import { HomeStackParamList } from '../../navigation/type';
const fallbackImage = require('../../assete/gov_documet/aadhar card.png');

type Props = {
  title: string;
  image: any;
  price: string;
  oldPrice?: string;
  rating?: string;
  users?: string;
  offerPrice?: string;
  coins?: string;
  onPress?: () => void;
};

function Card({
  title,
  image,
  price,
  oldPrice,
  users,
  offerPrice,
  coins,
  onPress,
}: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const [imgError, setImgError] = useState(false);

  // ✅ Hybrid press handler (BEST PRACTICE)
  const handlePress = () => {
    if (onPress) {
      onPress(); // parent navigation
    } else {
      navigation.navigate('PackEnquiryForm', {
        title,
        price: offerPrice || price,
        oldPrice: oldPrice || '',
        coins: coins || '',
      });
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
      <View style={styles.card}>
        {/* IMAGE */}
        <View style={styles.imageBox}>
<Image
  source={imgError || !image ? fallbackImage : image}
  style={styles.cardImage}
  resizeMode="contain"
  onError={() => setImgError(true)}
/>        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {/* PRICE */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{price}</Text>
            {!!oldPrice && (
              <Text style={styles.oldPrice}>{oldPrice}</Text>
            )}
          </View>

          {/* USERS */}
          {!!users && (
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.users}>({users})</Text>
            </View>
          )}

          {/* CTA */}
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {offerPrice || price}
              {coins ? ' + ' : ''}
            </Text>

            {!!coins && (
              <View style={styles.coinWrapper}>
                <Reward width={14} height={14} />
                <Text style={styles.ctaText}> {coins}</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ✅ Prevent unnecessary re-renders
export default memo(Card);

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    marginRight: 12,
  },
  imageBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 120,
  },
  infoContainer: {
    paddingTop: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  stars: {
    fontSize: 10,
    letterSpacing: -2,
  },
  users: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  cta: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  coinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});