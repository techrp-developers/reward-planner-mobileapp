import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';

type Props = { variant?: 'products' | 'categories' | 'services' | 'cities'; height?: number };

export default function ModuleSkeleton({ variant = 'products', height = 280 }: Props) {
  const { isDark } = useAppTheme();
  const focused = useIsFocused();
  const opacity = useRef(new Animated.Value(0.55)).current;
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const timer = setTimeout(() => setVisible(true), 120);
    return () => { mounted = false; clearTimeout(timer); listener.remove(); };
  }, []);
  useEffect(() => {
    if (!focused || !visible || reduceMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.95, duration: 900, useNativeDriver: true, isInteraction: false }),
      Animated.timing(opacity, { toValue: 0.55, duration: 900, useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [focused, visible, reduceMotion, opacity]);
  const fill = { backgroundColor: isDark ? '#303440' : '#E8EBF0' };
  return (
    <View style={[styles.container, { height }]} accessible accessibilityLabel="Loading content" accessibilityState={{ busy: true }}>
      {visible && <Animated.View style={[styles.body, { opacity: reduceMotion ? 0.8 : opacity }]} importantForAccessibility="no-hide-descendants">
        {variant !== 'categories' && <View style={[styles.heading, fill]} />}
        {variant === 'cities' ? [0, 1, 2, 3].map(key => <View key={key} style={styles.cityRow}><View style={[styles.cityIcon, fill]} /><View style={[styles.cityLine, fill]} /></View>) :
          <View style={styles.row}>{Array.from({ length: variant === 'categories' ? 4 : variant === 'services' ? 3 : 2 }, (_, key) =>
            <View key={key} style={styles.card}>
              <View style={[variant === 'categories' ? styles.category : styles.image, fill]} />
              <View style={[styles.line, fill]} /><View style={[styles.shortLine, fill]} />
            </View>)}</View>}
      </Animated.View>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, overflow: 'hidden' }, body: { flex: 1 },
  heading: { width: '42%', height: 18, borderRadius: 7, marginBottom: 18 },
  row: { flex: 1, flexDirection: 'row', gap: 14 }, card: { flex: 1 },
  image: { flex: 1, borderRadius: 16, minHeight: 36 },
  category: { flex: 1, borderRadius: 18, minHeight: 32 },
  line: { height: 12, borderRadius: 6, marginTop: 12, width: '86%' },
  shortLine: { height: 10, borderRadius: 5, marginTop: 8, width: '52%' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  cityIcon: { width: 32, height: 32, borderRadius: 10 }, cityLine: { width: '62%', height: 14, borderRadius: 7 },
});
