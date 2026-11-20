import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HealthStackParamList, 'BookAppointment'>;

const venues = [
  {
    id: 'north-suburban',
    name: 'North Suburban Clinic',
    address: '890 Oak Ridge Pkwy',
    distance: '3.8 miles',
    isSelected: false,
  },
  {
    id: 'city-lab',
    name: 'City Lab Center',
    address: '452 Medical Plaza, Suite 100',
    distance: '1.2 miles',
    isSelected: true,
  },
] as const;

const morningSlots = [
  '08:30 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
] as const;

const afternoonSlots = [
  '02:00 PM',
  '02:30 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
] as const;

export default function BookAppointment({ navigation }: Props) {
  const today = useMemo(() => new Date(), []);
  const { width: screenWidth } = useWindowDimensions();
  const dateListRef = useRef<FlatList>(null);
  const [selectedVenueId, setSelectedVenueId] = useState('city-lab');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const dateOptions = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(year, month, index + 1);

      return {
        id: `${year}-${month + 1}-${index + 1}`,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: String(index + 1),
        monthLabel: date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
      };
    });
  }, [today]);
  const [selectedDateId, setSelectedDateId] = useState(dateOptions[today.getDate() - 1]?.id);

  const selectedDateIndex = dateOptions.findIndex(
    option => option.id === selectedDateId,
  );
  const monthLabel = dateOptions[0]?.monthLabel ?? '';
  const DATE_CARD_WIDTH = 68;
  const DATE_CARD_GAP = 10;
  const dateSidePadding = Math.max((screenWidth - 28 - DATE_CARD_WIDTH) / 2, 0);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenConfirmModal = useCallback(() => {
    setIsConfirmModalVisible(true);
  }, []);

  const handleCloseConfirmModal = useCallback(() => {
    setIsConfirmModalVisible(false);
  }, []);

  const handleOpenBookings = useCallback(() => {
    navigation.navigate('UpcomingEvenetsScreen');
  }, [navigation]);

  const selectedVenue = venues.find(venue => venue.id === selectedVenueId);
  const selectedDate = dateOptions.find(option => option.id === selectedDateId);

  useEffect(() => {
    if (selectedDateIndex < 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      dateListRef.current?.scrollToIndex({
        index: selectedDateIndex,
        animated: false,
        viewPosition: 0.5,
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedDateIndex]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.headerIconButton}
          onPress={handleGoBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#0A63C9" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerAvatar}>
            <HealthcareAvatar width={32} height={32} />
          </View>
          <Text style={styles.headerTitle}>Book Appointment</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.headerIconButton}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={21}
            color="#0A63C9"
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Nearest Lab</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={14}
              color="#0A63C9"
            />
            <Text style={styles.locationText}>Current Location</Text>
          </View>
        </View>

        {venues.map(venue => {
          const isSelected = venue.id === selectedVenueId;

          return (
            <TouchableOpacity
              key={venue.id}
              activeOpacity={0.9}
              style={[
                styles.venueCard,
                isSelected && styles.venueCardSelected,
              ]}
              onPress={() => setSelectedVenueId(venue.id)}
            >
              <View
                style={[
                  styles.venueIconWrap,
                  isSelected && styles.venueIconWrapSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={isSelected ? 'hospital-box' : 'shield-check-outline'}
                  size={18}
                  color={isSelected ? '#FFFFFF' : '#4B6DAA'}
                />
              </View>

              <View style={styles.venueTextWrap}>
                <Text style={styles.venueTitle}>{venue.name}</Text>
                <Text style={styles.venueAddress}>{venue.address}</Text>
                {isSelected && (
                  <View style={styles.selectedVenueRow}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={12}
                      color="#0A63C9"
                    />
                    <Text style={styles.selectedVenueText}>Selected Venue</Text>
                  </View>
                )}
              </View>

              <View style={styles.distancePill}>
                <Text style={styles.distanceText}>{venue.distance}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.dateHeader}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Text style={styles.monthText}>{monthLabel}</Text>
        </View>

        <FlatList
          ref={dateListRef}
          horizontal
          data={dateOptions}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.dateListContent,
            { paddingHorizontal: dateSidePadding },
          ]}
          getItemLayout={(_, index) => ({
            length: DATE_CARD_WIDTH + DATE_CARD_GAP,
            offset: (DATE_CARD_WIDTH + DATE_CARD_GAP) * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item, index }) => {
            const isSelected = item.id === selectedDateId;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.dateCard,
                  index !== dateOptions.length - 1 && styles.dateCardGap,
                  isSelected && styles.dateCardSelected,
                ]}
                onPress={() => {
                  setSelectedDateId(item.id);
                  dateListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.5,
                  });
                }}
              >
                <Text
                  style={[
                    styles.dateDayText,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateNumberText,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.slotsHeader}>
          <Text style={styles.sectionTitle}>Available slots</Text>
          <Text style={styles.monthText}>October 2026</Text>
        </View>

        <View style={styles.slotSection}>
          <View style={styles.slotLabelRow}>
            <MaterialCommunityIcons
              name="weather-sunny"
              size={17}
              color="#4F46E5"
            />
            <Text style={styles.slotLabelText}>Morning Slots</Text>
          </View>

          <View style={styles.slotGrid}>
            {morningSlots.map(slot => {
              const isSelected = selectedSlot === slot;

              return (
                <TouchableOpacity
                  key={slot}
                  activeOpacity={0.9}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotText,
                      isSelected && styles.slotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.slotSection}>
          <View style={styles.slotLabelRow}>
            <MaterialCommunityIcons
              name="weather-sunset"
              size={17}
              color="#0F766E"
            />
            <Text style={styles.slotLabelText}>Afternoon Slots</Text>
          </View>

          <View style={styles.slotGrid}>
            {afternoonSlots.map(slot => {
              const isSelected = selectedSlot === slot;

              return (
                <TouchableOpacity
                  key={slot}
                  activeOpacity={0.9}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotText,
                      isSelected && styles.slotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.confirmButton}
          onPress={handleOpenConfirmModal}
        >
          <Text style={styles.confirmButtonText}>Confirm Appointment</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <MaterialCommunityIcons
              name="briefcase-check-outline"
              size={18}
              color="#0A63C9"
            />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Pre-visit Prep</Text>
            <Text style={styles.infoDescription}>
              Please refrain from eating 8 hours prior to your blood work for
              accurate results.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <MaterialCommunityIcons
              name="shield-check"
              size={18}
              color="#0F766E"
            />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Insurance Verified</Text>
            <Text style={styles.infoDescription}>
              Your current plan covers 100% of this laboratory diagnostic
              screening.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <MaterialCommunityIcons
              name="map-outline"
              size={18}
              color="#4F46E5"
            />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Live Traffic</Text>
            <Text style={styles.infoDescription}>
              Traffic is currently light. Estimated travel time is 8 minutes
              from your location.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.calendarButton}
          onPress={handleOpenBookings}
        >
          <Text style={styles.calendarButtonText}>View calendar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseConfirmModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.modalCloseButton}
              onPress={handleCloseConfirmModal}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color="#0F172A"
              />
            </TouchableOpacity>

            <View style={styles.modalSuccessIcon}>
              <MaterialCommunityIcons
                name="check"
                size={34}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.modalTitle}>Confirm Appointment</Text>
            <Text style={styles.modalSubtitle}>
              Please review your checkup details
            </Text>

            <View style={styles.modalInfoCard}>
              <View style={styles.modalInfoRow}>
                <View style={styles.modalInfoIconWrap}>
                  <MaterialCommunityIcons
                    name="briefcase-check-outline"
                    size={16}
                    color="#0A63C9"
                  />
                </View>
                <View style={styles.modalInfoTextWrap}>
                  <Text style={styles.modalInfoLabel}>Service</Text>
                  <Text style={styles.modalInfoValue}>Blood Checkup</Text>
                </View>
              </View>

              <View style={styles.modalInfoRow}>
                <View style={styles.modalInfoIconWrap}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color="#0A63C9"
                  />
                </View>
                <View style={styles.modalInfoTextWrap}>
                  <Text style={styles.modalInfoLabel}>Facility</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedVenue?.name ?? 'City Lab Center'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalDateTimeRow}>
                <View style={styles.modalDateTimeCard}>
                  <View style={styles.modalDateTimeIconWrap}>
                    <MaterialCommunityIcons
                      name="calendar-month-outline"
                      size={15}
                      color="#0A63C9"
                    />
                  </View>
                  <View>
                    <Text style={styles.modalDateTimeTopText}>
                      {selectedDate?.day ?? 'Wed'} {selectedDate?.date ?? '18'},
                    </Text>
                    <Text style={styles.modalDateTimeBottomText}>
                      {today.getFullYear()}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDateTimeCard}>
                  <View style={styles.modalDateTimeIconWrap}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={15}
                      color="#0A63C9"
                    />
                  </View>
                  <View>
                    <Text style={styles.modalDateTimeTopText}>
                      {selectedSlot ?? '--:--'}
                    </Text>
                    <Text style={styles.modalDateTimeBottomText}>AM</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.modalPrimaryButton}
            >
              <Text style={styles.modalPrimaryButtonText}>Confirm details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.modalSecondaryButton}
              onPress={handleCloseConfirmModal}
            >
              <Text style={styles.modalSecondaryButtonText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#0A63C9',
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    height: 46,
    minWidth: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
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
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#1E293B',
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#0A63C9',
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  venueCard: {
    minHeight: 82,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DEED',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueCardSelected: {
    borderColor: '#0A63C9',
    backgroundColor: '#FCFDFF',
  },
  venueIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#E7EEFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venueIconWrapSelected: {
    backgroundColor: '#0A63C9',
  },
  venueTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  venueTitle: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 2,
  },
  venueAddress: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Manrope',
  },
  selectedVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  selectedVenueText: {
    color: '#0A63C9',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  distancePill: {
    minWidth: 64,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#DCEBFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  distanceText: {
    color: '#0A63C9',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 19,
  },
  monthText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 16,
    fontFamily: 'Manrope',
  },
  dateListContent: {
    paddingRight: 14,
  },
  dateCard: {
    width: 68,
    height: 74,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5DEED',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardGap: {
    marginRight: 10,
  },
  dateCardSelected: {
    backgroundColor: '#0A63C9',
    borderColor: '#0A63C9',
  },
  dateDayText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Manrope',
    marginBottom: 6,
  },
  dateNumberText: {
    color: '#1E293B',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '500',
    fontFamily: 'Manrope',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 36,
    marginBottom: 18,
  },
  slotSection: {
    marginBottom: 14,
  },
  slotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotLabelText: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 8,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotCard: {
    width: '30.5%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  slotCardSelected: {
    backgroundColor: '#79E2E8',
    borderColor: '#0A63C9',
  },
  slotText: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 16,
    fontFamily: 'Manrope',
  },
  slotTextSelected: {
    color: '#0A63C9',
    fontWeight: '600',
  },
  confirmButton: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0A63C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  infoCard: {
    minHeight: 108,
    backgroundColor: '#DCE9FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoTextWrap: {
    paddingRight: 4,
  },
  infoTitle: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginBottom: 8,
  },
  infoDescription: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Manrope',
  },
  calendarButton: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: '#0A63C9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  calendarButtonText: {
    color: '#0A63C9',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    minHeight: 520,
    maxHeight: 700,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A63C9',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Manrope',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  modalInfoCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 14,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  modalInfoIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#DCEBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalInfoTextWrap: {
    flex: 1,
  },
  modalInfoLabel: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Manrope',
    marginBottom: 2,
  },
  modalInfoValue: {
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  modalDateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalDateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  modalDateTimeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#DCEBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalDateTimeTopText: {
    color: '#0F172A',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  modalDateTimeBottomText: {
    color: '#475569',
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: 'Manrope',
  },
  modalPrimaryButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0A63C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  modalSecondaryButton: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8E2F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    color: '#0A63C9',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: 'Manrope',
  },
});
