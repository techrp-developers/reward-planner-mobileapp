import React, { useCallback, useState } from 'react';
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

import BloodTestCardBg from '../../assets/banners/bloodtestcardbg.svg';
import HemoglobinIcon from '../../assets/icons/Hemoglobin.svg';
import ThyroidIcon from '../../assets/icons/Thyroid.svg';
import CBCIcon from '../../assets/icons/CBC.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import type { HealthStackParamList } from '../../navigation/types';

import BloodGroupIcon from '../../assets/icons/BloodG.svg';
import BloodSugarIcon from '../../assets/icons/BloodS.svg';
import CholesterolIcon from '../../assets/icons/Cholesterol.svg';
import VitaminIcon from '../../assets/icons/VitaminLevels.svg';
import LiverIcon from '../../assets/icons/LiverFunction.svg';
import KidneyIcon from '../../assets/icons/KidneyFunction.svg';
import RoutineIcon from '../../assets/icons/RoutineMarkers.svg';
import AlcoholIcon from '../../assets/icons/Alcohol.svg';
import HydratedIcon from '../../assets/icons/Hydrated.svg';
import FastingIcon from '../../assets/icons/Fasting.svg';
import InstructionsIcon from '../../assets/icons/Instructions.svg';

type Props = NativeStackScreenProps<HealthStackParamList, 'BloodTestScreen'>;
const essentialMarkers = [
  {
    id: 1,
    title: 'Hemoglobin',
    subtitle: 'Checks oxygen levels and\npotential anemia markers.',
    Icon: HemoglobinIcon,
  },
  {
    id: 2,
    title: 'Thyroid Profile',
    subtitle: 'Monitors metabolism and\nhormonal balance (TSH).',
    Icon: ThyroidIcon,
  },
  {
    id: 3,
    title: 'Blood Group',
    subtitle: 'Verifies blood type and Rh\nfactor for records.',
    Icon: BloodGroupIcon,
  },
  {
    id: 4,
    title: 'Blood Sugar',
    subtitle: 'Screens for pre-diabetes\nand fasting glucose levels.',
    Icon: BloodSugarIcon,
  },
  {
    id: 5,
    title: 'Cholesterol',
    subtitle: 'Heart health check via LDL\nand HDL profiles.',
    Icon: CholesterolIcon,
  },
  {
    id: 6,
    title: 'Vitamin Levels',
    subtitle: 'Essential screening for D3\nand B12 deficiencies.',
    Icon: VitaminIcon,
  },
  {
    id: 7,
    title: 'CBC',
    subtitle: 'Complete Blood Count for\noverall immunity.',
    Icon: CBCIcon,
  },
  {
    id: 8,
    title: 'Liver Function',
    subtitle: 'Tests for enzymes\nindicating hepatic health.',
    Icon: LiverIcon,
  },
  {
    id: 9,
    title: 'Kidney Function',
    subtitle: 'Checks filtration efficiency\nvia Creatinine levels.',
    Icon: KidneyIcon,
  },
  {
    id: 10,
    title: 'Routine Markers',
    subtitle: 'Standard biomarkers for\nsystemic inflammation.',
    Icon: RoutineIcon,
  },
];

const howItWorksSteps = [
  {
    id: 1,
    title: 'Book Appointment',
    subtitle:
      'Select a convenient slot from the\navailable calendar.',
  },
  {
    id: 2,
    title: 'Sample Collection',
    subtitle:
      'Visit our certified lab or request a\nhome sample pickup.',
  },
  {
    id: 3,
    title: 'Digital Results',
    subtitle:
      'Receive comprehensive reports in\nyour app within 24 hours.',
  },
];

const BOOK_NOW_BUTTON_HEIGHT = 52;


export default function BloodTestScreen({ navigation }: Props) {
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<number[]>(
    essentialMarkers.map(item => item.id),
  );

  const selectedTestsCount = selectedMarkerIds.length;
  const isAllSelected = selectedTestsCount === essentialMarkers.length;
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  const toggleMarker = useCallback((id: number) => {
    setSelectedMarkerIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      }

      return [...prev, id];
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedMarkerIds(prev => {
      if (prev.length === essentialMarkers.length) {
        return [];
      }

      return essentialMarkers.map(item => item.id);
    });
  }, []);

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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBackground}>
            <BloodTestCardBg
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              style={styles.heroBackgroundImage}
            />

            <View style={styles.heroTextBlock}>
              <View style={styles.planPill}>
                <Text style={styles.planPillText}>
                  Included in your Annual Plan
                </Text>
              </View>

              <Text style={styles.heroTitle}>Complete Blood Panel</Text>
              <Text style={styles.heroSubtitle}>
                Our most comprehensive diagnostic screening covering 45+ vital
                health markers.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.markersSection}>
            <Text style={styles.markersHeading}>
              Essential Health Markers{'\n'}Included
            </Text>

            <Text style={styles.markersSubheading}>
              A deep dive into your metabolic and functional health
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.selectAllCard}
              onPress={toggleSelectAll}
            >
              <View style={styles.selectAllLeft}>
                <View
                  style={[
                    styles.checkedBox,
                    !isAllSelected && styles.uncheckedBox,
                  ]}
                >
                  {isAllSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <Text style={styles.selectAllText}>Select All</Text>
              </View>

              <View style={styles.selectAllDivider} />

              <Text style={styles.testsSelectedText}>
                {selectedTestsCount} tests selected
              </Text>
            </TouchableOpacity>

            {essentialMarkers.map(item => {
              const MarkerIcon = item.Icon;
              const isSelected = selectedMarkerIds.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={styles.markerCard}
                  onPress={() => toggleMarker(item.id)}
                >
                  <View style={styles.markerIconOnly}>
                    <MarkerIcon width={44} height={44} />
                  </View>

                  <View style={styles.markerContent}>
                    <Text style={styles.markerTitle}>{item.title}</Text>
                    <Text style={styles.markerSubtitle}>{item.subtitle}</Text>
                  </View>

                  <View
                    style={[
                      styles.markerCheckedBox,
                      !isSelected && styles.markerUncheckedBox,
                    ]}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.howItWorksSection}>
            <Text style={styles.howItWorksHeading}>How It Works</Text>

            <View style={styles.stepsWrapper}>
              {howItWorksSteps.map((step, index) => {
                const isLast = index === howItWorksSteps.length - 1;

                return (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{step.id}</Text>
                      </View>

                      {!isLast && <View style={styles.stepLine} />}
                    </View>

                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
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
                  No food or calorie drinks
                </Text>
              </View>
            </View>

            <View style={styles.instructionsItem}>
              <HydratedIcon width={24} height={24} />
              <View style={styles.instructionsTextWrap}>
                <Text style={styles.instructionsItemTitle}>Stay Hydrated</Text>
                <Text style={styles.instructionsItemSubtitle}>
                  Drink plenty of water
                </Text>
              </View>
            </View>

            <View style={styles.instructionsItem}>
              <AlcoholIcon width={24} height={24} />
              <View style={styles.instructionsTextWrap}>
                <Text style={styles.instructionsItemTitle}>Avoid Alcohol</Text>
                <Text style={styles.instructionsItemSubtitle}>
                  Refrain for 24 hours
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
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.bookNowText}>Book Now</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 18,
    paddingBottom: 32,
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
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#075BC8',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  heroCard: {
    marginHorizontal: 6,
    marginBottom: 4,
  },
  heroBackground: {
    height: 304,
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  heroTextBlock: {
    position: 'absolute',
    left: 32,
    right: 28,
    bottom: 38,
  },
  planPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#64DAE9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  planPillText: {
    color: '#0E5B63',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: 'Poppins',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '600',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  heroSubtitle: {
    maxWidth: 320,
    color: 'rgba(241, 245, 249, 0.98)',
    fontSize: 15,
    lineHeight: 28,
    fontWeight: '400',
    fontFamily: 'Poppins',
  },
  contentSection: {
    marginHorizontal: 14,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Poppins',
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins',
    marginBottom: 14,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  testIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  testSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EAF4FF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 22,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    color: '#1E3A5F',
    fontSize: 13,
    lineHeight: 21,
    fontFamily: 'Poppins',
  },
  markersSection: {
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#D8E2FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
    marginTop: 2,
  },

  markersHeading: {
    color: '#1A2438',
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '800',
    fontFamily: 'Poppins',
    marginBottom: 2,
  },

  markersSubheading: {
    color: '#687489',
    fontSize: 13,
    lineHeight: 22,
    fontFamily: 'Poppins',
    marginBottom: 14,
  },

  selectAllCard: {
    minHeight: 48,
    width: 270,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDD5E4',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  selectAllLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectAllDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#D3DAE6',
    marginHorizontal: 14,
  },

  checkedBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0E61C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  uncheckedBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0E61C9',
  },

  selectAllText: {
    color: '#1A2438',
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },

  testsSelectedText: {
    color: '#0E61C9',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },

  markerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#006EDC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  markerCardUnselected: {
    borderColor: '#D8E2FF',
    opacity: 0.7,
  },

  markerIconOnly: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  markerContent: {
    flex: 1,
    paddingRight: 12,
  },

  markerTitle: {
    color: 'black',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },

  markerSubtitle: {
    color: '#5E6A7E',
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'Poppins',
  },

  markerCheckedBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0E61C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  markerUncheckedBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0E61C9',
  },
  howItWorksSection: {
    paddingTop: 22,
    paddingBottom: 8,
    marginTop: 22,
  },

  howItWorksHeading: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
    fontFamily: 'Poppins',
    marginBottom: 22,
  },

  stepsWrapper: {
    paddingBottom: 6,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 102,
  },

  stepLeft: {
    width: 62,
    alignItems: 'center',
    marginRight: 10,
  },

  stepNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0062C7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  stepContent: {
    flex: 1,
    paddingTop: 7,
    paddingBottom: 16,
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },

  stepLine: {
    width: 1.4,
    flex: 1,
    backgroundColor: '#CAD3E3',
    marginTop: 0,
  },

  stepTitle: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },

  stepSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Poppins',
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
    fontFamily: 'Poppins',
  },
  instructionsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 19,
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
    fontFamily: 'Poppins',
  },
  instructionsItemSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: 'Poppins',
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
    fontFamily: 'Poppins',
    marginBottom: 2,
  },
  priceValue: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    fontFamily: 'Poppins',
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
    fontFamily: 'Poppins',
    marginLeft: 10,
  },
});
