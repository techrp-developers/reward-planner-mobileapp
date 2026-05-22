import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const LimitedImage = require('../../assete/service/Limited_offer.png');
import Reward from '../../../../assets/product/rewards.svg';
import { ServiceData } from './ServiceData';

function LimitedOffer() {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#E6ECFF', '#5B7CFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* LEFT : LIMITED OFFER IMAGE */}
        <View style={styles.left}>
          <Image
            source={LimitedImage}
            style={styles.limitedImage}
            resizeMode="contain"
          />
        </View>

        {/* RIGHT : HORIZONTAL CARDS */}
        <View style={styles.right}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {ServiceData.map((item) => {
              const CardImage = item.Image;
              const isImageAsset = typeof CardImage === 'number' || typeof CardImage === 'string';
              const imageSource =
                typeof CardImage === 'string'
                  ? { uri: CardImage }
                  : CardImage;

              return (
                <View key={item.id} style={styles.card}>
                  {/* IMAGE */}
                  <View style={styles.imageWrap}>
                    {isImageAsset ? (
                      <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      React.createElement(CardImage as React.ComponentType<{ width?: number; height?: number }>, {
                        width: 160,
                        height: 90,
                      })
                    )}
                  </View>

                  {/* TITLE */}
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>

                  {/* DESC */}
                  <Text numberOfLines={2} style={styles.desc}>
                    {item.desc}
                  </Text>

                  {/* RATING */}
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={14} color="#FACC15" />
                    <Text style={styles.ratingText}>
                      {item.rating} ({item.reviews})
                    </Text>
                  </View>

                  {/* BUTTON */}
                  <TouchableOpacity activeOpacity={0.85} style={styles.priceBtn}>
                    {item.price ? (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{item.price}</Text>
                        {Boolean(item.discount) && (
                          <View style={styles.discountRow}>
                            <Reward width={14} height={14} />
                            <Text style={styles.discountText}>
                              {item.discount}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.priceText}>{item.cta}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}

export default LimitedOffer;
const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },

  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 180,
  },

  /* LEFT */
  left: {
    width: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },

  limitedImage: {
    width: 140,
    height: 140,
  },

  /* RIGHT */
  right: {
    flex: 1,
    paddingVertical: 12,
  },

  scroll: {
    paddingRight: 12,
  },

  /* CARD */
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },

  imageWrap: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    // backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#202020',
  },

  desc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 14,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  ratingText: {
    fontSize: 11,
    color: '#4B5563',
    marginLeft: 4,
  },

  priceBtn: {
    marginTop: 10,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  priceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  discountText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
