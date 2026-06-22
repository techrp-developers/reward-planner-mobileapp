import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  Animated,
  type ImageStyle,
  type LayoutChangeEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import Logo from '../../../assets/menu/logo.png';
import { useGlobalSearch } from './useGlobalSearch';
import SearchDropdown from './SearchDropdown';

const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;
const IOS_FALLBACK_TOP   = 50;

// ── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  userName?:              string;
  userImageUri?:          string;
  companyLogoUri?:        string;
  onNotificationPress?:   () => void;
  onAIToggle?:            (value: boolean) => void;
  onSearchSubmit?:        (query: string) => void;
  onSearchActiveChange?:  (active: boolean) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const HeaderComponent: React.FC<HeaderProps> = ({
  userName = 'User',
  userImageUri,
  companyLogoUri,
  onNotificationPress,
  onSearchSubmit,
  onSearchActiveChange,
}) => {
  const { isDark }   = useAppTheme();
  const navigation   = useNavigation<any>();
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  // All animations use native driver (opacity + transform only)
  const dateFade    = useRef(new Animated.Value(1)).current;
  const searchFade  = useRef(new Animated.Value(0)).current;
  const searchSlide = useRef(new Animated.Value(28)).current;
  const inputRef    = useRef<TextInput>(null);

  const insets  = useSafeAreaInsets();
  const safeTop = insets.top > 0
    ? insets.top
    : Platform.OS === 'android' ? ANDROID_STATUS_BAR : IOS_FALLBACK_TOP;

  // ── Global search hook ────────────────────────────────────────────────────

  const { results, loading, isEmpty, reset } = useGlobalSearch(searchQuery);
  const showDropdown = searchActive && searchQuery.trim().length > 0;

  // ── Theme tokens ──────────────────────────────────────────────────────────

  const tk = useMemo(() => ({
    headerGradient:   isDark ? ['#1A1A2E', '#2D2D44'] : ['#C8B9FF', '#F0EDFF'],
    helloColor:       isDark ? '#A89FD8' : '#6B5BA8',
    nameColor:        isDark ? '#FFFFFF'  : '#1A1A2E',
    logoPillBg:       isDark ? '#2D2D44'  : '#FFFFFF',
    avatarRingBg:     isDark ? '#2D1F6E'  : '#E9E4FF',
    dateColor:        isDark ? '#C4BCFF'  : '#4A3A82',
    iconBg:           isDark ? 'rgba(255,255,255,0.10)' : 'rgba(124,92,252,0.12)',
    iconTint:         isDark ? '#D0CBFF'  : '#7C5CFC',
    searchBg:         isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.80)',
    searchBorder:     isDark ? 'rgba(255,255,255,0.15)' : 'rgba(124,92,252,0.25)',
    searchTextColor:  isDark ? '#FFFFFF'  : '#1A1A2E',
    placeholderColor: isDark ? '#6A6A8E'  : '#9B8FCC',
  }), [isDark]);

  const formattedDate = useMemo(() => {
    const n = new Date();
    const D = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${D[n.getDay()]}, ${n.getDate()} ${M[n.getMonth()]}`;
  }, []);

  // ── Layout measurement — drives dropdown top position ─────────────────────

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  // ── Search animation ──────────────────────────────────────────────────────

  const openSearch = useCallback(() => {
    setSearchActive(true);
    onSearchActiveChange?.(true);
    Animated.parallel([
      Animated.timing(dateFade,    { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(searchFade,  { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(searchSlide, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => inputRef.current?.focus());
  }, [dateFade, searchFade, searchSlide, onSearchActiveChange]);

  const closeSearch = useCallback(() => {
    inputRef.current?.blur();
    onSearchActiveChange?.(false);
    Animated.parallel([
      Animated.timing(dateFade,    { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(searchFade,  { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(searchSlide, { toValue: 28, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setSearchActive(false);
      setSearchQuery('');
      reset();
    });
  }, [dateFade, searchFade, searchSlide, reset, onSearchActiveChange]);

  const handleQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSubmit = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    closeSearch();
    // Navigation on submit is the caller's decision (GlobalSearchScreen keeps
    // results inline; Dashboard navigates to GlobalSearchScreen) — don't
    // force a route here, or it fights with onSearchSubmit's own behavior.
    onSearchSubmit?.(q);
  }, [searchQuery, closeSearch, onSearchSubmit]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Outer wrapper: creates a stacking context so the dropdown overlays
    // dashboard content below without affecting the layout flow.
    <View style={styles.wrapper}>

      <LinearGradient
        colors={tk.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, { paddingTop: safeTop + 10 }]}
        onLayout={handleHeaderLayout}
      >
        {/* ── Row 1 : Avatar | Greeting | Logo ── */}
        <View style={styles.topRow}>

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarRing, { backgroundColor: tk.avatarRingBg }]}>
              {userImageUri ? (
                <Image
                  source={{ uri: userImageUri }}
                  style={styles.avatarImg as ImageStyle}
                  resizeMode="cover"
                />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={32} color="#7C5CFC" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.greetWrap}>
            <Text style={[styles.helloText, { color: tk.helloColor }]}>Hello,</Text>
            <Text style={[styles.nameText, { color: tk.nameColor }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>

          <View style={[styles.logoPill, { backgroundColor: tk.logoPillBg }]}>
            <Image
              source={companyLogoUri ? { uri: companyLogoUri } : Logo}
              style={styles.logoImage as ImageStyle}
              resizeMode="contain"
            />
          </View>

        </View>

        {/* ── Row 2 : Date ←→ Search | Actions ── */}
        <View style={styles.bottomRow}>

          {/*
           * flexZone: two absolutely-stacked children
           *   1. Date label — fades out when search opens
           *   2. Search pill — slides in from the right
           */}
          <View style={styles.flexZone}>

            {/* Date */}
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.dateCentered, { opacity: dateFade }]}
              pointerEvents={searchActive ? 'none' : 'auto'}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={13}
                color={tk.dateColor}
                style={styles.calIcon}
              />
              <Text style={[styles.dateText, { color: tk.dateColor }]} numberOfLines={1}>
                {formattedDate}
              </Text>
            </Animated.View>

            {/* Search pill */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.searchPill,
                {
                  backgroundColor: tk.searchBg,
                  borderColor:     tk.searchBorder,
                  opacity:         searchFade,
                  transform: [{ translateX: searchSlide }],
                },
              ]}
              pointerEvents={searchActive ? 'auto' : 'none'}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={16}
                color={tk.placeholderColor}
                style={styles.searchIcon}
              />
              <TextInput
                ref={inputRef}
                placeholder="Search products, services…"
                placeholderTextColor={tk.placeholderColor}
                value={searchQuery}
                onChangeText={handleQueryChange}
                onSubmitEditing={handleSubmit}
                style={[styles.searchInput, { color: tk.searchTextColor }]}
                editable={searchActive}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setSearchQuery(''); reset(); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close-circle" size={16} color={tk.placeholderColor} />
                </TouchableOpacity>
              )}
            </Animated.View>

          </View>

          {/* Icon buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={searchActive ? closeSearch : openSearch}
              style={[styles.iconBtn, { backgroundColor: tk.iconBg }]}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={searchActive ? 'close' : 'magnify'}
                size={19}
                color={tk.iconTint}
              />
            </TouchableOpacity>

            {!searchActive && (
              <TouchableOpacity
                onPress={onNotificationPress}
                style={[styles.iconBtn, { backgroundColor: tk.iconBg }]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="bell-outline" size={19} color={tk.iconTint} />
              </TouchableOpacity>
            )}
          </View>

        </View>
      </LinearGradient>

      {/* ── Search Dropdown ─────────────────────────────────────────────────
       *  Absolutely positioned below the gradient so it overlays page content
       *  without affecting the layout flow of the dashboard.
       */}
      {showDropdown && headerHeight > 0 && (
        <View
          style={[styles.dropdownWrap, { top: headerHeight }]}
        >
          <SearchDropdown
            query={searchQuery}
            results={results}
            loading={loading}
            isEmpty={isEmpty}
            onClose={closeSearch}
          />
        </View>
      )}

    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer wrapper creates a stacking context
  wrapper: {
    zIndex: 100,
  },

  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  // ── Row 1 ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  greetWrap: {
    flex: 1,
  },
  helloText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  logoPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  logoImage: {
    width: 90,
    height: 32,
  },

  // ── Row 2 ──
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 40,
  },
  flexZone: {
    flex: 1,
    position: 'relative',
    height: 40,
  },

  // Date
  dateCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calIcon: {
    marginRight: 5,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    flexShrink: 1,
  },

  // Search pill
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 40,
    gap: 6,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    height: 40,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown container — absolute, overlays content below header
  dropdownWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 200,
    elevation: 20,
  },

});

export default HeaderComponent;
