import React from 'react';
import { Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  value: string | number;   // discount text, e.g. "20% OFF" or "₹1215"
  cardWidth?: number;       // width of the product card (used for scaling)
};

const RPpriceBadge: React.FC<Props> = ({ value, cardWidth }) => {
  if (!value) return null;

  // Format the value - if it doesn't have ₹ symbol, add it
  const formattedValue = String(value).includes('₹') || String(value).includes('Rs') || String(value).includes('RS')
    ? value
    : `₹${value}`;

  // Responsive sizes based on card width (fallback to default 110)
  const base = cardWidth ?? 110;
  const width = Math.max(40, Math.min(65, base * 0.15));
  const fontSize = Math.max(7, Math.min(10, base * 0.022));
  const paddingVertical = Math.max(2, base * 0.015);
  const borderRadius = Math.max(8, base * 0.035);

  return (
    <LinearGradient
      colors={['#FEB014', '#FFE486', '#F5B924']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.badge,
        {
          width,
          paddingVertical,
          borderRadius,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]} numberOfLines={1}>
        RP {formattedValue}
      </Text>
    </LinearGradient>
  );
};

export default RPpriceBadge;

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    color: '#1F2937',
  },
});