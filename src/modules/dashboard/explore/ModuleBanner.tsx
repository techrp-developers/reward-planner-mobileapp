import { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { rs } from '../../../utils/responsive';

const Banner1  = require('../../../assets/sampleImages/Category_banner(1).png');
const Banner2  = require('../../../assets/sampleImages/Category_banner(2).png');
const Banner3  = require('../../../assets/sampleImages/Category_banner(3).png');
const Banner4  = require('../../../assets/sampleImages/Category_banner(4).png');
const Banner5  = require('../../../assets/sampleImages/Category_banner(5).png');
const Banner6  = require('../../../assets/sampleImages/Category_banner(6).png');
const Banner7  = require('../../../assets/sampleImages/Category_banner(7).png');
const Banner8  = require('../../../assets/sampleImages/Category_banner(8).png');
const Banner9  = require('../../../assets/sampleImages/Category_banner(9).png');
const Banner10 = require('../../../assets/sampleImages/Category_banner(10).png');

const bannerSources = [
  Banner1, Banner2, Banner3, Banner4, Banner5,
  Banner6, Banner7, Banner8, Banner9, Banner10,
];

export default function ModuleBanner() {
  const { width } = useWindowDimensions();
  const scrollRef  = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const indexRef   = useRef(0);

  // Banner height scales with screen width (38 % of width)
  const bannerHeight = Math.round(width * 0.38);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % bannerSources.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      indexRef.current = next;
      setIndex(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [width]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={width}
        onMomentumScrollEnd={e => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
          indexRef.current = newIndex;
        }}
      >
        {bannerSources.map((src, i) => (
          <View key={i} style={[styles.banner, { width }]}>
            <Image
              source={src}
              style={[styles.bannerImage, { height: bannerHeight }]}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {bannerSources.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: rs(16),
    marginTop: rs(12),
  },

  bannerImage: {
    width: '100%',
    borderRadius: rs(18),
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(10),
    gap: rs(6),
  },

  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: '#D0D5E2',
  },

  activeDot: {
    width: rs(18),
    height: rs(6),
    borderRadius: rs(4),
    backgroundColor: '#4A6CF7',
  },
});
