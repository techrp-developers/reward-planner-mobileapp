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

import XrayCardBg from '../../assets/banners/xraycard.svg';
import BonIcon from '../../assets/icons/bonicon.svg';
import DentalIcon from '../../assets/icons/dentalicon.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import InstructionsIcon from '../../assets/icons/Instructions.svg';
import NewXrayIcon from '../../assets/icons/newxray.svg';
import Xp1Icon from '../../assets/icons/xp1.svg';
import Xp2Icon from '../../assets/icons/xp2.svg';
import Xp3Icon from '../../assets/icons/xp3.svg';
import XrayIcon from '../../assets/icons/xray_icon.svg';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HealthStackParamList, 'XRAYScreen'>;

const iconDimensions = {
  chest: { width: 20, height: 22 },
  'bone-density': { width: 18, height: 22 },
  dental: { width: 20, height: 21 },
} as const;

const xrayTypes = [
  {
    id: 'chest',
    title: 'Chest X-Ray',
    subtitle: 'Standard heart & lungs exam',
  },
  {
    id: 'bone-density',
    title: 'Bone Density Scan',
    subtitle: 'DEXA scan for strength',
  },
  {
    id: 'dental',
    title: 'Dental X-Ray',
    subtitle: 'Full oral panoramic imaging',
  },
] as const;

const howItWorksSteps = [
  {
    id: 1,
    title: 'Book Appointment',
    subtitle: 'Select a convenient slot from the\navailable calendar.',
  },
  {
    id: 2,
    title: 'Visit Lab',
    subtitle: 'Quick screening performed by experts\nin <20 mins.',
  },
  {
    id: 3,
    title: 'Digital Report',
    subtitle: 'View analysis directly in your portal.',
  },
] as const;

const BOOK_NOW_BUTTON_HEIGHT = 52;

const preparationItems = [
  {
    id: 'fasting',
    title: 'No Fasting Required',
    subtitle: 'Eat and drink as usual.',
    Icon: Xp1Icon,
  },
  {
    id: 'metal',
    title: 'Remove Metal',
    subtitle: 'Avoid jewelry or metal zippers.',
    Icon: Xp2Icon,
  },
  {
    id: 'clothing',
    title: 'Loose Clothing',
    subtitle: 'Wear comfortable, easy garments.',
    Icon: Xp3Icon,
  },
] as const;

export default function XRAYScreen({ navigation }: Props) {
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(['chest']);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenBookAppointment = useCallback(() => {
    navigation.navigate('BookAppointment');
  }, [navigation]);

  const handleToggleType = useCallback((typeId: string) => {
    setSelectedTypeIds(currentSelectedTypeIds =>
      currentSelectedTypeIds.includes(typeId)
        ? currentSelectedTypeIds.filter(id => id !== typeId)
        : [...currentSelectedTypeIds, typeId],
    );
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
            <XrayCardBg
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              style={styles.heroBackgroundImage}
            />

            <View style={styles.heroTextBlock}>
              <View style={styles.heroIconBadge}>
                <XrayIcon width={18} height={18} />
              </View>

              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>
                  INCLUDED IN YOUR FREE PLAN
                </Text>
              </View>

              <Text style={styles.heroTitle}>Annual X-Ray Screening</Text>
              <Text style={styles.heroSubtitle}>
                Precision imaging for early detection and total peace of mind.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.typesSection}>
          <View style={styles.typesHeader}>
            <Text style={styles.typesTitle}>Available Types</Text>
            <Text style={styles.typesHelper}>Select one or more</Text>
          </View>

          {xrayTypes.map(item => {
            const isSelected = selectedTypeIds.includes(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                style={[
                  styles.typeCard,
                  isSelected && styles.typeCardSelected,
                ]}
                onPress={() => handleToggleType(item.id)}
              >
                <View style={styles.typeIconWrap}>
                  {item.id === 'chest' && (
                    <NewXrayIcon
                      width={iconDimensions.chest.width}
                      height={iconDimensions.chest.height}
                      style={styles.typeIconAsset}
                    />
                  )}
                  {item.id === 'bone-density' && (
                    <BonIcon
                      width={iconDimensions['bone-density'].width}
                      height={iconDimensions['bone-density'].height}
                      style={styles.typeIconAsset}
                    />
                  )}
                  {item.id === 'dental' && (
                    <DentalIcon
                      width={iconDimensions.dental.width}
                      height={iconDimensions.dental.height}
                      style={styles.typeIconAsset}
                    />
                  )}
                </View>

                <View style={styles.typeTextWrap}>
                  <Text style={styles.typeTitle}>{item.title}</Text>
                  <Text style={styles.typeSubtitle}>{item.subtitle}</Text>
                </View>

                <View
                  style={[
                    styles.typeSelectionDot,
                    isSelected && styles.typeSelectionDotSelected,
                  ]}
                >
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
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
              <InstructionsIcon width={20} height={20} />
            </View>

            <Text style={styles.instructionsTitle}>Preparation</Text>
          </View>

          {preparationItems.map(item => {
            const PreparationIcon = item.Icon;

            return (
              <View key={item.id} style={styles.instructionsItem}>
                <PreparationIcon width={18} height={18} />

                <View style={styles.instructionsTextWrap}>
                  <Text style={styles.instructionsItemTitle}>{item.title}</Text>
                  <Text style={styles.instructionsItemSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
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
  content: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 32 },
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
    marginBottom: 18,
  },
  heroBackground: {
    height: 330,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#0A5DCA',
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTextBlock: {
    position: 'absolute',
    top: 14,
    left: 18,
    right: 18,
    bottom: 18,
  },
  heroPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FDF2C8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  heroPillText: {
    color: '#1F2937',
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.4,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginBottom: 12,
    maxWidth: 250,
  },
  heroSubtitle: {
    color: '#E4EEFF',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: 'Manrope',
    maxWidth: 290,
  },
  typesSection: {
    marginTop: 2,
  },
  typesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  typesTitle: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  typesHelper: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: 'Manrope',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3DAE9',
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  typeCardSelected: {
    borderColor: '#0A5DCA',
    borderWidth: 1.4,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF5FF',
    borderWidth: 1,
    borderColor: '#D7E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIconAsset: {
    alignSelf: 'center',
  },
  typeTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  typeTitle: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  typeSubtitle: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Manrope',
  },
  typeSelectionDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C2CEE2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeSelectionDotSelected: {
    borderColor: '#0A5DCA',
    backgroundColor: '#0A5DCA',
  },
  howItWorksSection: {
    paddingTop: 6,
    paddingBottom: 8,
    marginTop: 10,
  },
  howItWorksHeading: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
    fontFamily: 'Manrope',
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
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  stepLine: {
    width: 1.4,
    flex: 1,
    backgroundColor: '#CAD3E3',
    marginTop: 0,
  },
  stepContent: {
    flex: 1,
    paddingTop: 7,
    paddingBottom: 16,
  },
  stepTitle: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 4,
  },
  stepSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Manrope',
  },
  instructionsCard: {
    marginTop: -4,
    marginBottom: 20,
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
    marginBottom: 16,
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
    marginTop: 24,
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

