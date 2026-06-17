import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import HeaderComponent from '../header/HeaderComponent';
import { useAuth } from '../../common/auth/context/AuthContext';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';
import axios from 'axios';
import Home_Chart from '../stepcount/Home_Chart';
import ModuleBanner from '../explore/ModuleBanner';
import { rs, fs } from '../../../utils/responsive';
import ServicesModule from '../explore/ServicesModule';
import RewardsOverview from '../reward/Rewardsoverview';
// import BottomTabs, { TAB_BAR_HEIGHT } from '../../ecommerce/navigation/BottomTabs';
import { useCart } from '../../ecommerce/context/CartContext';
import type { TabKey } from '../../../bottombar/BottomTabs';
import { useAppTheme } from '../../../theme/ThemeContext';
import BottomTabs, { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import BirthdayCarousel from '../birthday/BirthdayCarousel';
import type { BirthdayEmployee } from '../birthday/types';


function Dashbord() {
  const { isDark } = useAppTheme();
  const iconSize = rs(26);
  const navigation = useNavigation<any>();
  const { totalQuantity } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [headerUserName, setHeaderUserName] = useState<string>(user?.name ?? 'User');
  const [headerUserImage, setHeaderUserImage] = useState<string | null>(null);
  const [headerCompanyLogo, setHeaderCompanyLogo] = useState<string | null>(null);
  const [thought, setThought] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [birthdays, setBirthdays] = useState<BirthdayEmployee[]>([]);
  const hasBirthdays = birthdays.length > 0;

  const loadHeaderInfo = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const userRes = await axios.get<{ success: boolean; data: any }>(
        'https://rewardplanners.com/api/crm/v1/auth/user-info',
        { headers },
      );

      if (userRes.data?.success) {
        const d = userRes.data.data;
        if (d.name)          setHeaderUserName(d.name);
        if (d.userImage)     setHeaderUserImage(d.userImage);
        if (d.company?.logo) setHeaderCompanyLogo(d.company.logo);
        if (d.thought)       setThought(d.thought);

        const raw: any[] = Array.isArray(d.birthday_employees) ? d.birthday_employees : [];
        setBirthdays(raw.map((b) => ({
          id:          b.employeeId,
          name:        b.name,
          designation: b.role,
          department:  b.department,
          photo:       b.image ?? null,
        })));
      }
    } catch { }
  }, [isAuthenticated]);

  useEffect(() => { loadHeaderInfo(); }, [loadHeaderInfo]);

  useFocusEffect(useCallback(() => { loadHeaderInfo(); }, [loadHeaderInfo]));

  const handleTabPress = useCallback(
    (tab: TabKey) => {
      switch (tab) {
        case 'Notes':
          navigation.navigate('TodoList');
          break;
        case 'Cart':
          navigation.navigate('Cart');
          break;
        case 'Search':
          navigation.navigate('GlobalSearchScreen');
          break;
        case 'Profile':
          navigation.navigate('Profile');
          break;
        // 'Home' is Dashboard itself — already here, no-op
      }
    },
    [navigation],
  );

  const handleCenterPress = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const quoteBannerGradient: string[] = ['#7928CA', '#9C3BE0', '#B84EFF'];

  const rootGradient = isDark
    ? ['#0E0E1C', '#1A1A2E']
    : ['#F0EDFF', '#FFFFFF'];

  const t = useMemo(() => StyleSheet.create({
    iconContainer: { backgroundColor: isDark ? '#2D2D44' : '#FFFFFF' },
    card: { shadowColor: isDark ? '#000000' : '#7928CA' },
  }), [isDark]);

  return (
    <LinearGradient
      colors={rootGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <HeaderComponent
        userName={headerUserName}
        userImageUri={headerUserImage ?? undefined}
        companyLogoUri={headerCompanyLogo ?? undefined}
        onSearchActiveChange={setIsSearchOpen}
        onSearchSubmit={() => navigation.navigate('GlobalSearchScreen')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(32) + TAB_BAR_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSearchOpen}
        bounces
      >
        {/* Motivational Quote Banner */}
        {hasBirthdays ? (
          <BirthdayCarousel birthdays={birthdays} />
        ) : (
          <View style={[styles.bannerOuter, { paddingHorizontal: rs(16), paddingTop: rs(14) }]}>
            <LinearGradient
              colors={quoteBannerGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.card, t.card]}
            >
              <View style={styles.glowTop} />
              <View style={styles.glowBottom} />

              <View style={[styles.iconContainer, t.iconContainer]}>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={iconSize}
                  color={isDark ? '#FFFFFF' : '#9B3DD8'}
                />
              </View>

              <Text style={styles.quote}>
                {thought
                  ? `"${thought}"`
                  : '"Success is the sum of small efforts,\nrepeated day in and day out."'}
              </Text>
            </LinearGradient>
            
          </View>
        )}
        <Home_Chart />
        <ServicesModule />
        <ModuleBanner />
        <RewardsOverview />
      </ScrollView>

      <BottomTabs
        isDashboard
        activeTabKey="Home"
        cartCount={totalQuantity}
        onTabPress={handleTabPress}
        onCenterPress={handleCenterPress}
      />
      {/* <FloatingBottomBar/> */}
    </LinearGradient>
  );
}

export default Dashbord;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // backgroundColor via t.root
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    // paddingBottom set inline so it scales with rs() and TAB_BAR_HEIGHT
  },

  bannerOuter: {
    // paddingHorizontal and paddingTop set inline
  },

  card: {
    borderRadius: rs(24),
    paddingVertical: rs(12),
    paddingHorizontal: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    // shadowColor via t.card
    shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: Platform.OS === 'ios' ? 0.38 : 0.45,
    shadowRadius: rs(20),
    elevation: 12,
  },

  glowTop: {
    position: 'absolute',
    top: -50,
    right: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  glowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  iconContainer: {
    width: rs(58),
    height: rs(58),
    borderRadius: rs(18),
    // backgroundColor via t.iconContainer
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  quote: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: fs(14),
    lineHeight: rs(22),
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
