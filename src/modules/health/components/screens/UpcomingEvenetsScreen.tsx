import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DiagnosticProIcon from '../../assets/icons/DiagnosticPro.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import NewXrayIcon from '../../assets/icons/newxray.svg';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<
  HealthStackParamList,
  'UpcomingEvenetsScreen'
>;

const bookings = [
  {
    id: 1,
    badge: 'Upcoming',
    title: 'Comprehensive Blood Panel',
    venue: 'City Central Diagnostics Lab',
    date: 'Oct 24, 2023',
    time: '09:30 AM',
    Icon: DiagnosticProIcon,
  },
  {
    id: 2,
    badge: 'Upcoming',
    title: 'Chest X-Ray Imaging',
    venue: 'Metropolis Radiology Center',
    date: 'Oct 28, 2023',
    time: '02:15 PM',
    Icon: NewXrayIcon,
  },
] as const;

const pastHistoryItems = [
  {
    id: 1,
    title: 'Annual Health\nScreening',
    venue: "St. Luke's Medical Plaza",
    date: 'Sep 12, 2023',
    icon: 'file-document-outline',
  },
  {
    id: 2,
    title: 'Cardiology\nStress Test',
    venue: 'Heart & Vascular Institute',
    date: 'Aug 29, 2023',
    icon: 'heart-pulse',
  },
  {
    id: 3,
    title: 'Influenza\nVaccination',
    venue: 'Walgreens Health Clinic',
    date: 'Aug 15, 2023',
    icon: 'needle',
  },
] as const;

export default function UpcomingEvenetsScreen({ navigation }: Props) {
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenBookAppointment = useCallback(() => {
    navigation.navigate('BookAppointment');
  }, [navigation]);

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

        <View style={styles.headerAvatar}>
          <HealthcareAvatar width={32} height={32} />
        </View>

        <Text style={styles.headerTitle}>My bookings</Text>

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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color="#94A3B8"
            />
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>2</Text>
          </View>
        </View>

        {bookings.map(item => {
          const BookingIcon = item.Icon;

          return (
            <View key={item.id} style={styles.bookingCard}>
              <View style={styles.bookingTopRow}>
                <View style={styles.bookingBadge}>
                  <Text style={styles.bookingBadgeText}>{item.badge}</Text>
                </View>

                <View style={styles.bookingTopIcon}>
                  <BookingIcon width={19} height={19} />
                </View>
              </View>

              <Text style={styles.bookingTitle}>{item.title}</Text>

              <View style={styles.bookingMetaRow}>
                <MaterialCommunityIcons
                  name="hospital-box-outline"
                  size={15}
                  color="#475569"
                />
                <Text style={styles.bookingMetaText}>{item.venue}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={19}
                    color="#0A5DCA"
                  />
                  <View style={styles.dateTimeTextWrap}>
                    <Text style={styles.dateTimeLabel}>Date</Text>
                    <Text style={styles.dateTimeValue}>{item.date}</Text>
                  </View>
                </View>

                <View style={styles.dateTimeItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={19}
                    color="#0A5DCA"
                  />
                  <View style={styles.dateTimeTextWrap}>
                    <Text style={styles.dateTimeLabel}>Time</Text>
                    <Text style={styles.dateTimeValue}>{item.time}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.primaryActionButton}
                >
                  <MaterialCommunityIcons
                    name="calendar-plus"
                    size={17}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryActionText}>Add to Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.secondaryActionButton}
                  onPress={handleOpenBookAppointment}
                >
                  <Text style={styles.secondaryActionText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.historySection}>
          <Text style={styles.historyHeading}>Past History</Text>

          {pastHistoryItems.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              style={styles.historyCard}
            >
              <View style={styles.historyIconWrap}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color="#6B7280"
                />
              </View>

              <View style={styles.historyContent}>
                <View style={styles.historyTopRow}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <View style={styles.historyStatusPill}>
                    <Text style={styles.historyStatusText}>Completed</Text>
                  </View>
                </View>

                <Text style={styles.historyVenue}>
                  {item.venue} {'\u2022'}
                </Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color="#0B63CE"
              />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.scheduleCheckupButton}
            onPress={handleOpenBookAppointment}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.scheduleCheckupText}>Schedule New Checkup</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 28,
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
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#075BC8',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 26,
  },
  searchInputWrap: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Manrope',
    marginLeft: 6,
    paddingVertical: 0,
  },
  filterButton: {
    height: 46,
    minWidth: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  filterButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  countPill: {
    minWidth: 24,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A5F3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 7,
  },
  countText: {
    color: '#0E7490',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  bookingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bookingBadgeText: {
    color: '#315A94',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  bookingTopIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingTitle: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 2,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingMetaText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateTimeTextWrap: {
    marginLeft: 8,
  },
  dateTimeLabel: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 14,
    fontFamily: 'Manrope',
    marginBottom: 2,
  },
  dateTimeValue: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActionButton: {
    flex: 1.15,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0B63CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 6,
  },
  secondaryActionButton: {
    flex: 0.75,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DDF8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope',
  },
  historySection: {
    marginTop: 6,
    paddingBottom: 8,
  },
  historyHeading: {
    color: '#6e727c',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 14,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7ECF3',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
    paddingRight: 8,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  historyTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginRight: 8,
  },
  historyStatusPill: {
    borderRadius: 999,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyStatusText: {
    color: '#7C8DAA',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  historyVenue: {
    color: '#6B7280',
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: 'Manrope',
    marginBottom: 1,
  },
  historyDate: {
    color: '#6B7280',
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: 'Manrope',
  },
  scheduleCheckupButton: {
    alignSelf: 'center',
    minWidth: 180,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0B63CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  scheduleCheckupText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 8,
  },
});

