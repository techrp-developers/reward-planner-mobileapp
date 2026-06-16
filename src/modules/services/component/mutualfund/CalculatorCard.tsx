import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ImageSourcePropType,
} from 'react-native';

export interface CalculatorItem {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  screen: string;
}

interface Props {
  item: CalculatorItem;
  onPress: () => void;
}

const CalculatorCard: React.FC<Props> = ({ item, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.card}
    onPress={onPress}
  >
    <View style={styles.topRow}>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={4}>
          {item.subtitle}
        </Text>
      </View>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
    </View>

    <View style={styles.calcRow}>
      <Text style={styles.calcText}>Calculate Now</Text>
      <Text style={styles.calcArrow}>{' >'}</Text>
    </View>
  </TouchableOpacity>
);

export default CalculatorCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 170,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  textBlock: {
    flex: 1,
    paddingRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 6,
  },
  description: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    flexShrink: 1,
  },
  image: {
    width: 68,
    height: 68,
    flexShrink: 0,
    alignSelf: 'center',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  calcText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8665FF',
    textDecorationLine: 'underline',
  },
  calcArrow: {
    fontSize: 13,
    color: '#8665FF',
    fontWeight: '700',
    marginLeft: 1,
  },
});
