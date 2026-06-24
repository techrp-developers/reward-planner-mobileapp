import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import { SearchData, SearchResultItem } from '../api/GlobalSearchAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchDropdownProps {
  query: string;
  results: SearchData | null;
  loading: boolean;
  isEmpty: boolean;
  onClose: () => void;
}

type Section = {
  title: string;
  data: SearchResultItem[];
};

// ─── Query highlight ──────────────────────────────────────────────────────────

const HighlightedText = memo(({
  text,
  query,
  titleColor,
}: {
  text: string;
  query: string;
  titleColor: string;
}) => {
  const trimmed = query.trim();

  const idx = trimmed ? text.toLowerCase().indexOf(trimmed.toLowerCase()) : -1;

  if (!trimmed || idx === -1) {
    return (
      <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={2}>
        {text}
      </Text>
    );
  }

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + trimmed.length);
  const after = text.slice(idx + trimmed.length);

  return (
    <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={2}>
      {before}
      <Text style={styles.highlight}>{match}</Text>
      {after}
    </Text>
  );
});

// ─── Result item ──────────────────────────────────────────────────────────────

const ResultItem = memo(({
  item,
  query,
  onPress,
  isLast,
  thumbBg,
  itemBg,
  titleColor,
  separatorColor,
}: {
  item: SearchResultItem;
  query: string;
  onPress: (item: SearchResultItem) => void;
  isLast: boolean;
  thumbBg: string;
  itemBg: string;
  titleColor: string;
  separatorColor: string;
}) => {
  const isProduct = item.type === 'product';
  const badgeColor = isProduct ? '#7C5CFC' : '#0EA5E9';
  const badgeLabel = isProduct ? 'Product' : 'Service';
  const badgeIcon = isProduct ? 'shopping-outline' : 'briefcase-outline';

  return (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: itemBg },
        !isLast && styles.itemBorder,
        !isLast && { borderBottomColor: separatorColor },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.thumb, { backgroundColor: thumbBg }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name={badgeIcon} size={20} color={badgeColor} />
        )}
      </View>

      <HighlightedText text={item.title} query={query} titleColor={titleColor} />

      <View style={[styles.badge, { backgroundColor: badgeColor + '18' }]}>
        <MaterialCommunityIcons name={badgeIcon} size={11} color={badgeColor} />
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Section header (sticky) ──────────────────────────────────────────────────

const SectionHeader = memo(({
  title,
  sectionBg,
  sectionTextColor,
}: {
  title: string;
  sectionBg: string;
  sectionTextColor: string;
}) => (
  <View style={[styles.section, { backgroundColor: sectionBg }]}>
    <Text style={[styles.sectionText, { color: sectionTextColor }]}>{title}</Text>
  </View>
));

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  results,
  loading,
  isEmpty,
  onClose,
}) => {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<any>();

  // ── Theme tokens ──────────────────────────────────────────────────────────────
  const tk = useMemo(() => ({
    card: {
      backgroundColor: isDark ? '#1E1E32' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)'
    } as ViewStyle,
    spinnerHint: { color: isDark ? '#6A6A8E' : '#9B8FCC' } as TextStyle,
    minCharHint: { color: isDark ? '#5A5A7E' : '#B0A8D8' } as TextStyle,
    emptyTitle: { color: isDark ? '#C4BCFF' : '#1A1A2E' } as TextStyle,
    emptyHint: { color: isDark ? '#5A5A7E' : '#9B8FCC' } as TextStyle,
    sectionBg: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
    sectionText: isDark ? '#C4BCFF' : '#7C3AED',
    thumbBg: isDark ? '#2A2A3E' : '#EEF2FF',
    itemBg: isDark ? '#1E1E32' : '#FFFFFF',
    titleColor: isDark ? '#F8FAFC' : '#111827',
    separatorColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    footerBorder: { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } as ViewStyle,
    magnifyIcon: isDark ? '#3D3D5C' : '#D0CBFF',
  }), [isDark]);

  // ── Entry animation ───────────────────────────────────────────────────────────
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useMemo(() => ({
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
    }],
  }), [anim]);

  // ── Navigation handler ────────────────────────────────────────────────────────
  const handlePress = useCallback((item: SearchResultItem) => {
    onClose();
    if (item.type === 'product') {
      navigation.navigate('ProductDetails', { productId: item.id });
    } else {
      navigation.navigate('ServiceStack');
    }
  }, [navigation, onClose]);

  // ── Section data ──────────────────────────────────────────────────────────────
  const sections: Section[] = useMemo(() => {
    if (!results) return [];
    const out: Section[] = [];
    if (results.products.length > 0) out.push({ title: 'PRODUCTS', data: results.products });
    if (results.services.length > 0) out.push({ title: 'SERVICES', data: results.services });
    return out;
  }, [results]);

  // ── "See all results" footer ──────────────────────────────────────────────────
  const listFooter = useMemo(() => (
    <TouchableOpacity
      style={[styles.viewAll, tk.footerBorder]}
      onPress={() => {
        onClose();
        navigation.navigate('Search', { query: query.trim() });
      }}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name="magnify" size={14} color="#7C5CFC" />
      <Text style={styles.viewAllText}>See all results for "{query.trim()}"</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color="#7C5CFC" />
    </TouchableOpacity>
  ), [tk.footerBorder, onClose, navigation, query]);

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.card, tk.card]}>
        <Animated.View style={animStyle}>
          <View style={styles.centered}>
            <ActivityIndicator color="#7C5CFC" size="small" />
            <Text style={[styles.hint, tk.spinnerHint]}>Searching…</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Too few characters ────────────────────────────────────────────────────────
  if (query.trim().length < 2) {
    return (
      <View style={[styles.card, tk.card]}>
        <Animated.View style={animStyle}>
          <View style={styles.centered}>
            <MaterialCommunityIcons name="magnify" size={24} color={tk.magnifyIcon} />
            <Text style={[styles.hint, tk.minCharHint]}>Type at least 2 characters</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <View style={[styles.card, tk.card]}>
        <Animated.View style={animStyle}>
          <View style={styles.centered}>
            <MaterialCommunityIcons name="magnify-close" size={28} color={tk.magnifyIcon} />
            <Text style={[styles.emptyTitle, tk.emptyTitle]}>
              No results for "{query.trim()}"
            </Text>
            <Text style={[styles.hint, tk.emptyHint]}>Try a different keyword</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (!results || sections.length === 0) return null;

  // ── Results ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.card, tk.card]}>
      <Animated.View style={[styles.listWrap, animStyle]}>
        <SectionList
          style={styles.list}
          sections={sections}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          scrollEnabled={true}
          nestedScrollEnabled={true}
          bounces={false}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              sectionBg={tk.sectionBg}
              sectionTextColor={tk.sectionText}
            />
          )}
          renderItem={({ item, section, index }) => (
            <ResultItem
              item={item}
              query={query}
              onPress={handlePress}
              isLast={index === section.data.length - 1}
              thumbBg={tk.thumbBg}
              itemBg={tk.itemBg}
              titleColor={tk.titleColor}
              separatorColor={tk.separatorColor}
            />
          )}
          ListFooterComponent={listFooter}
        />
      </Animated.View>
    </View>
  );
};

export default memo(SearchDropdown);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer card: shadow + border. NO overflow:'hidden' — that blocks Android scroll events.
  card: {
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 24,
  },

  // SectionList owns the scroll area — maxHeight lives here, not on the card.
  listWrap: {
    maxHeight: 300,
    overflow: 'hidden',
    borderRadius: 18,
  },
  list: {
    maxHeight: 300,
    borderRadius: 18,
  },

  // Section header
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  // Result row
  itemBorder: {
    borderBottomWidth: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
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
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  highlight: {
    fontWeight: '800',
    color: '#7C5CFC',
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

  // "See all results" footer
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

  // Loading / empty states
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
