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

import EventHeroCard from '../../assets/banners/eventherocard.svg';
import VenueHospitalOne from '../../assets/banners/venue-hospital-1.svg';
import VenueHospitalTwo from '../../assets/banners/venue-hospital-2.svg';
import WorldBloodDonorBanner from '../../assets/banners/world-blood-donor-banner.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import HealthBottomTabs, {
  HEALTH_TAB_BAR_HEIGHT,
} from '../HealthBottomTabs';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HealthStackParamList, 'EventsScreen'>;

const upcomingEvents = [
  {
    id: 'mindfulness-seminar',
    title: 'Mindfulness Seminar',
    description:
      'Expert-led talk on managing work-life balance through meditation and presence.',
    dateTime: 'Nov 02 - 2:00 PM',
    location: 'Online (Webinar)',
    cta: 'Reserve Seat',
    Banner: VenueHospitalTwo,
  },
  {
    id: 'healthy-meal-prep',
    title: 'Healthy Meal Prep',
    description:
      'Interactive workshop on quick, nutritious recipes for busy professionals.',
    dateTime: 'Nov 05 - 6:00 PM',
    location: 'Staff Lounge B',
    cta: 'Register Now',
    Banner: VenueHospitalOne,
  },
  {
    id: 'blood-donation-camp',
    title: 'Annual Blood Donation Camp',
    description:
      'Support our community health initiative. Every donation can save up to three lives.',
    dateTime: 'Nov 05 - 6:00 PM',
    location: 'Staff Lounge B',
    cta: 'Register Now',
    Banner: WorldBloodDonorBanner,
  },
] as const;

export default function EventsScreen({ navigation }: Props) {
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
        navigation.navigate('ProvidersScreen');
        return;
      }

      if (tab === 'Events') {
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
          { paddingBottom: HEALTH_TAB_BAR_HEIGHT + bottomInset + 18 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.featureCard}>
          <EventHeroCard
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={styles.featureImage}
          />

          <View style={styles.featureContent}>
            <View style={styles.featureBadge}>
              <MaterialCommunityIcons
                name="star-circle"
                size={10}
                color="#0B63CE"
              />
              <Text style={styles.featureBadgeText}>FEATURED SESSION</Text>
            </View>

            <Text style={styles.featureTitle}>Corporate Wellness Yoga</Text>

            <Text style={styles.featureSubtitle}>
              Join our guided sunset session designed to relieve office-related
              stress and improve posture. Perfect for all levels.
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color="#D6E7FF"
                />
                <Text style={styles.metaText}>5:30 PM - 6:30 PM</Text>
              </View>

              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={12}
                  color="#D6E7FF"
                />
                <Text style={styles.metaText}>Oct 24, 2024</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.registerButton}
              onPress={handleOpenBookAppointment}
            >
              <Text style={styles.registerButtonText}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search events..."
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

        {upcomingEvents.map(event => (
          <View key={event.id} style={styles.upcomingCard}>
            <View style={styles.upcomingImageWrap}>
              <event.Banner
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
              />
            </View>

            <View style={styles.upcomingContent}>
              <Text style={styles.upcomingTitle}>{event.title}</Text>

              <Text style={styles.upcomingDescription}>
                {event.description}
              </Text>

              <View style={styles.upcomingMetaRow}>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={14}
                  color="#4B5563"
                />
                <Text style={styles.upcomingMetaText}>{event.dateTime}</Text>
              </View>

              <View style={styles.upcomingMetaRow}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={14}
                  color="#4B5563"
                />
                <Text style={styles.upcomingMetaText}>{event.location}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.upcomingButton}
                onPress={handleOpenBookAppointment}
              >
                <Text style={styles.upcomingButtonText}>{event.cta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <HealthBottomTabs activeTabKey="Events" onTabPress={handleHealthTabPress} />
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
    paddingHorizontal: 0,
    paddingTop: 4,
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
  featureCard: {
    height: 600,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  featureImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featureContent: {
    position: 'absolute',
    top: 18,
    left: 55,
    right: 16,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    minHeight: 22,
    borderRadius: 999,
    backgroundColor: '#FDF2C8',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureBadgeText: {
    color: '#1F2937',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginBottom: 14,
    maxWidth: 235,
  },
  featureSubtitle: {
    color: '#E4EEFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    fontFamily: 'Manrope',
    marginBottom: 18,
    maxWidth: 336,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  metaText: {
    color: '#D6E7FF',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  registerButton: {
    alignSelf: 'flex-start',
    minWidth: 108,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  registerButtonText: {
    color: '#0B63CE',
    fontSize: 14,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 19,
    lineHeight: 32,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginLeft: 14,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  searchInputWrap: {
    flex: 1,
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4DCEA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginRight: 8,
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
    borderRadius: 6,
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
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginLeft: 6,
  },
  upcomingCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#D9E2F2',
    borderRadius: 14,
    overflow: 'hidden',
  },
  upcomingImageWrap: {
    height: 144,
    backgroundColor: '#E5E7EB',
  },
  upcomingContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  upcomingTitle: {
    color: '#172554',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 8,
  },
  upcomingDescription: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Manrope',
    marginBottom: 10,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingMetaText: {
    color: '#4B5563',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  upcomingButton: {
    height: 38,
    borderRadius: 6,
    backgroundColor: '#0B63CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  upcomingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
});

