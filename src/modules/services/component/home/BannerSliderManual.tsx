import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';

const Banner1 = require('../../assete/service/HomeService_Banner (1).png');
const Banner2 = require('../../assete/service/HomeService_Banner (2).png');
const Banner3 = require('../../assete/service/HomeService_Banner (3).png');
const Banner4 = require('../../assete/service/HomeService_Banner (4).png');
const Banner5 = require('../../assete/service/HomeService_Banner (5).png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Define the card width (e.g., 85% of screen) to let the next card peek in
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const SPACING = 12;
// This ensures the snapping happens exactly at the center/start of each card
const SNAP_OFFSET = CARD_WIDTH + SPACING;

const banners = [Banner1, Banner2, Banner3, Banner4, Banner5];

export default function BannerSliderManual() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    // Calculate index based on the width of the card + gap
    const index = Math.round(xOffset / SNAP_OFFSET);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Use decelerationRate and snapToInterval instead of pagingEnabled
        decelerationRate="fast"
        snapToInterval={SNAP_OFFSET}
        snapToAlignment="start"
        // This padding lets the first card align with the screen edge
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((bannerSource, index) => (
          <View key={index} style={styles.slide}>
            <Image
              source={bannerSource}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* DOT INDICATOR */}
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              activeIndex === i ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 16, // Matches your screen's side margin
  },
  slide: {
    width: CARD_WIDTH,
    marginRight: SPACING, // The gap between cards
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerImage: {
    width: CARD_WIDTH,
    height: 180,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  inactiveDot: {
    width: 15, 
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    width: 50, // Much longer active pill to match the image
    backgroundColor: '#374151',
  },
});