import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import FastingIcon from '../../assets/icons/Fasting.svg';
import FullBodyIcon1 from '../../assets/icons/fullbodyicon1.svg';
import FullBodyIcon2 from '../../assets/icons/fullbodyicon2.svg';
import FullBodyIcon3 from '../../assets/icons/fullbodyicon3.svg';
import FullBodyIcon4 from '../../assets/icons/fullbodyicon4.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import InstructionsIcon from '../../assets/icons/Instructions.svg';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HealthStackParamList, 'FullBodyScreen'>;

const BOOK_NOW_BUTTON_HEIGHT = 52;

const includedItems = [
  {
    id: 'blood-panel',
    title: 'Blood Panel',
    description: 'CBC, Kidney Profile, Liver Profile, Diabetes (HbA1c), Thyroid.',
    Icon: FullBodyIcon1,
  },
  {
    id: 'consultation',
    title: 'Consultation',
    description: 'Detailed physical exam and results review with a Physician.',
    Icon: FullBodyIcon2,
  },
  {
    id: 'xray',
    title: 'X-Ray',
    description: 'Chest PA view digital imaging for respiratory & cardiac analysis.',
    Icon: FullBodyIcon3,
  },
  {
    id: 'ecg',
    title: 'ECG',
    description: 'Resting electrocardiogram to monitor heart rhythm and electrical activity.',
    Icon: FullBodyIcon4,
  },
];

export default function FullBodyScreen({ navigation }: Props) {
  const handleOpenBookAppointment = useCallback(() => {
    navigation.navigate('BookAppointment');
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
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

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerAvatar}>
            <HealthcareAvatar width={34} height={34} />
          </View>
          <Text style={styles.headerTitle}>Healthcare</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.headerIconButton}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#075BC8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.popularPill}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={12}
              color="#115E67"
            />
            <Text style={styles.popularPillText}>Most Popular</Text>
          </View>

          <Text style={styles.heroTitle}>Premium Full Body Checkup</Text>
          <Text style={styles.heroSubtitle}>
            Our most comprehensive diagnostic screening designed for proactive
            health management and early detection.
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.durationPill}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color="#0D5FD3"
              />
              <Text style={styles.durationPillText}>
                Estimated Duration: 2-3 hours
              </Text>
            </View>

            <View style={styles.infoIconBox}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={18}
                color="#64748B"
              />
              <Text style={styles.infoIconBoxText}>10</Text>
            </View>
          </View>
        </View>

        <View style={styles.availabilityCard}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={76}
            color="rgba(255,255,255,0.12)"
            style={styles.availabilityWatermark}
          />

          <Text style={styles.availabilityLabel}>NEXT AVAILABLE</Text>
          <Text style={styles.availabilityTime}>Tomorrow, 08:30 AM</Text>
          <Text style={styles.availabilitySubtitle}>
            Secure your slot at our Central Diagnostic Center.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.scheduleButton}
            onPress={handleOpenBookAppointment}
          >
            <Text style={styles.scheduleButtonText}>
              Schedule Full Body Check
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.includedSection}>
          <Text style={styles.includedHeading}>What's Included</Text>

          {includedItems.map(item => {
            const IncludedIcon = item.Icon;

            return (
              <View key={item.id} style={styles.includedCard}>
                <View style={styles.includedIconWrap}>
                  <IncludedIcon width={22} height={22} />
                </View>

                <View style={styles.includedTextWrap}>
                  <Text style={styles.includedCardTitle}>{item.title}</Text>
                  <Text style={styles.includedCardDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <View style={styles.instructionsInfoIcon}>
              <InstructionsIcon width={22} height={22} />
            </View>

            <Text style={styles.instructionsTitle}>
              Pre-checkup Instructions
            </Text>
          </View>

          <View style={styles.instructionsItem}>
            <FastingIcon width={24} height={24} />
            <View style={styles.instructionsTextWrap}>
              <Text style={styles.instructionsItemTitle}>8-hour Fasting</Text>
              <Text style={styles.instructionsItemSubtitle}>
                Do not consume food or beverage except water for 8 hours prior.
              </Text>
            </View>
          </View>

          <View style={styles.instructionsItem}>
            <MaterialCommunityIcons name="tshirt-crew-outline" size={24} color="#0A5DCA" />
            <View style={styles.instructionsTextWrap}>
              <Text style={styles.instructionsItemTitle}>Comfortable Clothing</Text>
              <Text style={styles.instructionsItemSubtitle}>
                Wear loose-fitting clothes. Front-opening shirts are preferred for ECG.
              </Text>
            </View>
          </View>

          <View style={styles.instructionsItemLast}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#0A5DCA" />
            <View style={styles.instructionsTextWrap}>
              <Text style={styles.instructionsItemTitle}>Medical Records</Text>
              <Text style={styles.instructionsItemSubtitle}>
                Bring previous reports or current medications for the doctor's review.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bookingBar}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>TOTAL PRICE</Text>
            <Text style={styles.priceValue}>₹199.00</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.bookNowButton}
            onPress={handleOpenBookAppointment}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
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
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#075BC8',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 22,
  },
  popularPill: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: '#7AF1FC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 22,
    marginLeft: 16,
  },
  popularPillText: {
    color: '#115E67',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  heroTitle: {
    color: '#0F172A',
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 16,
  },
  heroSubtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 31,
    fontFamily: 'Manrope',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#E5EEFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginRight: 10,
  },
  durationPillText: {
    color: '#0D5FD3',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginLeft: 8,
  },
  infoIconBox: {
    width: 58,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  infoIconBoxText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },
  availabilityCard: {
    backgroundColor: '#0D5FD3',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  availabilityWatermark: {
    position: 'absolute',
    right: 18,
    top: 18,
  },
  availabilityLabel: {
    color: 'rgba(191,219,254,0.95)',
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 1.6,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 16,
  },
  availabilityTime: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 8,
  },
  availabilitySubtitle: {
    color: 'rgba(239,246,255,0.96)',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '400',
    fontFamily: 'Manrope',
    marginBottom: 18,
  },
  scheduleButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scheduleButtonText: {
    color: '#0D5FD3',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  includedSection: {
    marginTop: 24,
  },
  includedHeading: {
    color: '#1E293B',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 14,
  },
  includedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C1C6D7',
    minHeight: 94,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  includedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  includedTextWrap: {
    flex: 1,
  },
  includedCardTitle: {
    color: '#1E293B',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 2,
  },
  includedCardDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Manrope',
  },
  instructionsCard: {
    marginTop: 20,
    backgroundColor: '#EEF3FF',
    borderWidth: 1,
    borderColor: '#B9C8EB',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  instructionsInfoIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  instructionsTitle: {
    color: '#0A5DCA',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  instructionsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 19,
    marginLeft: 12,
  },
  instructionsItemLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginLeft: 12,
  },
  instructionsTextWrap: {
    flex: 1,
    marginLeft: 19,
  },
  instructionsItemTitle: {
    color: '#1E293B',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'Manrope',
  },
  instructionsItemSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: 'Manrope',
  },
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 18,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  priceCard: {
    flex: 1,
    height: BOOK_NOW_BUTTON_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    marginRight: 8,
  },
  priceLabel: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 2,
  },
  priceValue: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  bookNowButton: {
    flex: 1,
    height: BOOK_NOW_BUTTON_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#0A5DCA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: 'Manrope',
    marginLeft: 10,
  },
});

