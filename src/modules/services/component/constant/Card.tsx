import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';
const fallbackImage = require('../../assete/gov_documet/aadhar card.png');

const DEFAULT_CARD_WIDTH = 172;

type Props = {
  title: string;
  image: any;
  price: string;
  oldPrice?: string;
  rating?: number | string;
  users?: string;
  offerPrice?: string;
  coins?: string;
  discount?: string;
  cardWidth?: number;
  onPress?: () => void;
};

function Card({
  title,
  image,
  price,
  oldPrice,
  rating,
  users,
  offerPrice,
  coins,
  discount,
  cardWidth = DEFAULT_CARD_WIDTH,
  onPress,
}: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const servicesTheme = useServicesTheme();
  const [imgError, setImgError] = useState(false);
  const parsedRating = Number(rating);
  const hasRating = rating !== undefined && rating !== null && Number.isFinite(parsedRating);

  // Same proportional formulas as ServiceGridCard so both card designs stay
  // visually consistent across the app instead of drifting on fixed pixels.
  const calculations = useMemo(() => ({
    imageDynamicSize: Math.round(Math.min(Math.max(cardWidth * 0.88, 56), 104)),
    borderRadius: Math.round(cardWidth * 0.06),
    imageWrapHeight: Math.round(Math.min(Math.max(cardWidth * 1.02, 104), 132)),
    fontSizeLabel: Math.max(11, Math.round(cardWidth * 0.07)),
    fontSizeReview: Math.max(9, Math.round(cardWidth * 0.066)),
    fontSizePrice: Math.max(12, Math.round(cardWidth * 0.096)),
    fontSizeDiscount: Math.max(9, Math.round(cardWidth * 0.07)),
  }), [cardWidth]);

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
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.card,
        {
          width: cardWidth,
          borderRadius: calculations.borderRadius,
          backgroundColor: servicesTheme.isDark ? servicesTheme.appTheme.card : '#FFFFFF',
          borderColor: servicesTheme.isDark ? servicesTheme.appTheme.border : '#EEF0F4',
        },
      ]}
    >
      {/* IMAGE */}
      <View
        style={[
          styles.imageWrap,
          {
            height: calculations.imageWrapHeight,
            borderRadius: calculations.borderRadius,
            backgroundColor: servicesTheme.isDark ? '#303038' : '#F9FAFB',
          },
        ]}
      >
        {discount ? (
          <View style={styles.discountBadgeWrap}>
            <View style={styles.discountBadge}>
              <Text style={[styles.discountArrow, { fontSize: calculations.fontSizeDiscount }]}>
                {'\u2193'}
              </Text>
              <Text
                style={[styles.discountText, { fontSize: calculations.fontSizeDiscount }]}
                numberOfLines={1}
              >
                {discount}
              </Text>
            </View>
          </View>
        ) : null}
        <Image
          source={imgError || !image ? fallbackImage : image}
          style={[
            styles.cardImage,
            { width: calculations.imageDynamicSize, height: calculations.imageDynamicSize },
          ]}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      </View>

      <View style={styles.details}>
        <Text
          style={[
            styles.title,
            { fontSize: calculations.fontSizeLabel, color: servicesTheme.appTheme.text },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        {(hasRating || !!users) && (
          <View style={styles.ratingRow}>
            {hasRating && <MaterialIcons name="star" size={11} color="#FFC514" />}
            <Text
              style={[
                styles.ratingText,
                { fontSize: calculations.fontSizeReview, color: servicesTheme.appTheme.secondaryText },
              ]}
              numberOfLines={1}
            >
              {hasRating ? `${parsedRating.toFixed(1)}` : ''}
              {!!users ? `(${users})` : ''}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text
            style={[
              styles.price,
              { fontSize: calculations.fontSizePrice, color: servicesTheme.appTheme.text },
            ]}
            numberOfLines={1}
          >
            <Text style={styles.rpPrefix}>RP </Text>
            {`\u20B9${offerPrice || price}`}
          </Text>
          {!!oldPrice && (
            <Text
              style={[
                styles.oldPrice,
                { fontSize: calculations.fontSizePrice, color: servicesTheme.appTheme.secondaryText },
              ]}
              numberOfLines={1}
            >
              {`\u20B9${oldPrice}`}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ✅ Prevent unnecessary re-renders
export default memo(Card);

const styles = StyleSheet.create({
  card: {
    padding: 7,
    borderWidth: 1,
    marginRight: 14,
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F2F5',
  },
  cardImage: {
    alignSelf: 'center',
  },
  discountBadgeWrap: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8EF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountArrow: {
    color: '#16A34A',
    fontWeight: '900',
    marginRight: 1,
  },
  discountText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  details: {
    flex: 1,
    marginTop: 9,
  },
  title: {
    flexShrink: 1,
    minHeight: 34,
    fontWeight: '800',
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    marginTop: 3,
  },
  ratingText: {
    marginLeft: 3,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 4,
    columnGap: 6,
    rowGap: 3,
  },
  price: {
    fontWeight: '800',
  },
  rpPrefix: {
    fontWeight: '800',
  },
  oldPrice: {
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
});