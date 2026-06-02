import { useCallback } from 'react';
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
import HeaderComponent from '../header/HeaderComponent';
import Home_Chart from '../stepcount/Home_Chart';
import ModuleBanner from '../explore/ModuleBanner';
import { rs, fs } from '../../../utils/responsive';
import ServicesModule from '../explore/ServicesModule';
import RewardsOverview from '../reward/Rewardsoverview';
import BottomTabs, { TAB_BAR_HEIGHT } from '../../ecommerce/navigation/BottomTabs';
import { useCart } from '../../ecommerce/context/CartContext';
import type { TabKey } from '../../ecommerce/navigation/BottomTabs';

function Dashbord() {
  const iconSize = rs(26);
  const navigation = useNavigation<any>();
  const { totalQuantity } = useCart();

  const handleTabPress = useCallback(
    (tab: TabKey) => {
      switch (tab) {
        case 'Explore':
          navigation.navigate('ExploreModule');
          break;
        case 'Cart':
          navigation.navigate('Cart');
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

  return (
    <View style={styles.root}>
      <HeaderComponent />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(32) + TAB_BAR_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Motivational Quote Banner */}
        <View style={[styles.bannerOuter, { paddingHorizontal: rs(16), paddingTop: rs(14) }]}>
          <LinearGradient
            colors={['#7928CA', '#9C3BE0', '#B84EFF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.card}
          >
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={iconSize}
                color="#9B3DD8"
              />
            </View>

            <Text style={styles.quote}>
              "Success is the sum of small efforts,{'\n'}repeated day in and day out."
            </Text>
          </LinearGradient>
        </View>

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
    </View>
  );
}

export default Dashbord;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F5FF',
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
    shadowColor: '#7928CA',
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
    backgroundColor: '#FFFFFF',
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
