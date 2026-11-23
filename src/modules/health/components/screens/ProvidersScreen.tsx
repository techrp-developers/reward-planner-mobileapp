import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import VenueHospitalOne from '../../assets/banners/venue-hospital-1.svg';
import VenueHospitalTwo from '../../assets/banners/venue-hospital-2.svg';
import VenueHospitalThree from '../../assets/banners/venue-hospital-3.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import HealthBottomTabs, {
  HEALTH_TAB_BAR_HEIGHT,
} from '../HealthBottomTabs';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HealthStackParamList, 'ProvidersScreen'>;

export default function ProvidersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  const handleOpenBookAppointment = useCallback(() => {
    navigation.navigate('BookAppointment');
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleHealthTabPress = useCallback(
    (tab: 'Home' | 'Providers' | 'Events' | 'Profile') => {
      if (tab === 'Home') {
        navigation.navigate('Home');
        return;
      }

      if (tab === 'Providers') {
        return;
      }

      if (tab === 'Events') {
        navigation.navigate('EventsScreen');
        return;
      }

      navigation.getParent()?.navigate('Profile');
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.headerIconButton}
          onPress={handleGoBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#075BC8" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerAvatar}>
            <HealthcareAvatar width={34} height={34} />
          </View>
          <Text style={styles.headerTitle}>Healthcare</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.headerIconButton}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color="#075BC8"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: HEALTH_TAB_BAR_HEIGHT + bottomInset + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search events.."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.filterButton}>
            <MaterialCommunityIcons
              name="filter-variant"
              size={18}
              color="#334155"
            />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

<View style={styles.recommendedCard}>
  <View style={styles.recommendedBadge}>
    <Text style={styles.recommendedBadgeText}>
      Recommended for you
    </Text>
  </View>

  <Text style={styles.recommendedTitle}>
    Premium Health Labs
  </Text>

  <Text style={styles.recommendedSubtitle}>
    Direct integration with your WellCheck profile. Skip the paperwork and
    sync results automatically.
  </Text>

  <View style={styles.recommendedActionsRow}>
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.priorityButton}
      onPress={handleOpenBookAppointment}
    >
      <Text style={styles.priorityButtonText}>
        Book Priority
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.detailsButton}
    >
      <Text style={styles.detailsButtonText}>
        View Details
      </Text>
    </TouchableOpacity>
  </View>
</View>

        <Text style={styles.sectionTitle}>Venues near you</Text>

        {[
          {
            id: 1,
            title: 'St. Jude Medical',
            miles: '3.5 miles away',
            rating: '4.6',
            Banner: VenueHospitalOne,
          },
          {
            id: 2,
            title: 'Wellness Center',
            miles: '2.8 miles away',
            rating: '4.7',
            Banner: VenueHospitalTwo,
          },
          {
            id: 3,
            title: 'General Hospital',
            miles: '1.2 miles away',
            rating: '4.8',
            Banner: VenueHospitalThree,
          },
        ].map(item => (
          <View key={item.id} style={styles.venueCard}>
            <View style={styles.venueBannerWrap}>
              <item.Banner
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
              />

              <View style={styles.ratingPill}>
                <MaterialCommunityIcons name="star" size={11} color="#0B63CE" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>

            <View style={styles.venueContent}>
              <Text style={styles.venueTitle}>{item.title}</Text>

              <View style={styles.venueMetaRow}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color="#64748B"
                />
                <Text style={styles.venueMetaText}>{item.miles}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.bookButton}
                onPress={handleOpenBookAppointment}
              >
                <Text style={styles.bookButtonText}>Book Checkup</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <HealthBottomTabs
        activeTabKey="Providers"
        onTabPress={handleHealthTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#075BC8',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  searchInputWrap: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4DCEA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontFamily: 'Manrope',
    marginLeft: 6,
    paddingVertical: 0,
  },
  filterButton: {
    height: 42,
    minWidth: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4DCEA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 6,
  },
  recommendedCard: {
    backgroundColor: '#0B63CE',
    borderRadius: 12,
    paddingLeft: 32,
    paddingRight: 26,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 22,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 22,
  },
  recommendedBadgeText: {
    color: '#2F6CBD',
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  recommendedTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 14,
  },
  recommendedSubtitle: {
    color: 'rgba(232,242,255,0.95)',
    fontSize: 15,
    lineHeight: 28,
    fontFamily: 'Manrope',
    marginBottom: 24,
    maxWidth: 268,
  },
  recommendedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  priorityButtonText: {
    color: '#0B63CE',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  detailsButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    textAlign: 'left',
    marginBottom: 14,
    marginLeft: 2,
  },
  venueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  venueBannerWrap: {
    height: 156,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  ratingPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 50,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#EAF4FF',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  venueContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  venueTitle: {
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 6,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueMetaText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  bookButton: {
    height: 38,
    borderRadius: 6,
    backgroundColor: '#0B63CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
});

