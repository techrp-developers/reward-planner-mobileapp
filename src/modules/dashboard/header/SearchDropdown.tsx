import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import { SearchData, SearchResultItem } from '../api/GlobalSearchAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchDropdownProps {
  query:     string;
  results:   SearchData | null;
  loading:   boolean;
  isEmpty:   boolean;
  onClose:   () => void;
}

// ─── Result item ─────────────────────────────────────────────────────────────

const ResultItem = memo(({
  item,
  onPress,
  isLast,
  isDark,
}: {
  item:    SearchResultItem;
  onPress: (item: SearchResultItem) => void;
  isLast:  boolean;
  isDark:  boolean;
}) => {
  const isProduct  = item.type === 'product';
  const badgeColor = isProduct ? '#7C5CFC' : '#0EA5E9';
  const badgeLabel = isProduct ? 'Product' : 'Service';
  const badgeIcon  = isProduct ? 'shopping-outline' : 'briefcase-outline';

  return (
    <TouchableOpacity
      style={[
        styles.item,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: isDark ? '#2A2A3E' : '#F3F0FF' }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.thumbImg}
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons
            name={badgeIcon}
            size={20}
            color={badgeColor}
          />
        )}
      </View>

      {/* Title */}
      <Text
        style={[styles.itemTitle, { color: isDark ? '#F0EFFF' : '#1A1A2E' }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      {/* Type badge */}
      <View style={[styles.badge, { backgroundColor: badgeColor + '18' }]}>
        <MaterialCommunityIcons name={badgeIcon} size={11} color={badgeColor} />
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = ({ label, isDark }: { label: string; isDark: boolean }) => (
  <View style={[styles.section, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(124,92,252,0.05)' }]}>
    <Text style={[styles.sectionText, { color: isDark ? '#9B8FCC' : '#7C5CFC' }]}>
      {label}
    </Text>
  </View>
);

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  results,
  loading,
  isEmpty,
  onClose,
}) => {
  const { isDark }   = useAppTheme();
  const navigation   = useNavigation<any>();

  const cardBg     = isDark ? '#1E1E32' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,92,252,0.12)';

  const handlePress = useCallback((item: SearchResultItem) => {
    onClose();
    if (item.type === 'product') {
      navigation.navigate('ProductDetails', { productId: item.id });
    } else {
      navigation.navigate('ServiceStack');
    }
  }, [navigation, onClose]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.centered}>
          <ActivityIndicator color="#7C5CFC" size="small" />
          <Text style={[styles.hint, { color: isDark ? '#6A6A8E' : '#9B8FCC' }]}>
            Searching…
          </Text>
        </View>
      </View>
    );
  }

  // ── Too few characters ────────────────────────────────────────────────────
  if (query.trim().length < 2) {
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="magnify" size={24} color={isDark ? '#3D3D5C' : '#D0CBFF'} />
          <Text style={[styles.hint, { color: isDark ? '#5A5A7E' : '#B0A8D8' }]}>
            Type at least 2 characters
          </Text>
        </View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="magnify-close" size={28} color={isDark ? '#3D3D5C' : '#D0CBFF'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#C4BCFF' : '#1A1A2E' }]}>
            No results for "{query.trim()}"
          </Text>
          <Text style={[styles.hint, { color: isDark ? '#5A5A7E' : '#9B8FCC' }]}>
            Try a different keyword
          </Text>
        </View>
      </View>
    );
  }

  // ── No results yet (initial state) ───────────────────────────────────────
  if (!results) return null;

  const { products, services } = results;
  const hasProducts = products.length > 0;
  const hasServices = services.length > 0;

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {hasProducts && (
          <>
            <SectionHeader label="PRODUCTS" isDark={isDark} />
            {products.map((item, i) => (
              <ResultItem
                key={`p-${item.id}`}
                item={item}
                onPress={handlePress}
                isLast={i === products.length - 1 && !hasServices}
                isDark={isDark}
              />
            ))}
          </>
        )}

        {hasServices && (
          <>
            <SectionHeader label="SERVICES" isDark={isDark} />
            {services.map((item, i) => (
              <ResultItem
                key={`s-${item.id}`}
                item={item}
                onPress={handlePress}
                isLast={i === services.length - 1}
                isDark={isDark}
              />
            ))}
          </>
        )}

        {/* View all option */}
        <TouchableOpacity
          style={[styles.viewAll, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
          onPress={() => {
            onClose();
            navigation.navigate('Search', { query: query.trim() });
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="magnify" size={14} color="#7C5CFC" />
          <Text style={styles.viewAllText}>
            See all results for "{query.trim()}"
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#7C5CFC" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default memo(SearchDropdown);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    maxHeight: 400,
    overflow: 'hidden',
    // Shadow — iOS
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    // Shadow — Android
    elevation: 16,
  },
  scroll: {
    maxHeight: 400,
  },

  // Section label
  section: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sectionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },

  // Result item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  itemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // View all row
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
  },
  viewAllText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#7C5CFC',
  },

  // Loading / empty
  centered: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
