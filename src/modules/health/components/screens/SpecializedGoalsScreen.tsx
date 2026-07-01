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

import DiabetesIcon from '../../assets/icons/Diabetes.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import HeartIcon from '../../assets/icons/heartIcon.svg';
import MensWellnessIcon from '../../assets/icons/menswellness.svg';
import SpecializedHealthGoalsImage from '../../assets/images/SpecializedHealthGoals.svg';
import type { HealthStackParamList } from '../../navigation/types';
import WellnessIcon from '../../assets/icons/wellnessIcon.svg';

type Props = NativeStackScreenProps<HealthStackParamList, 'SpecializedGoalsScreen'>;

const targetedScreenings = [
  {
    id: 'heart',
    title: 'Heart Health',
    description:
      'Advanced lipid profile, ECG monitoring, and arterial stiffness markers.',
    price: '₹299',
    icon: 'heart-outline',
    iconColor: '#0D5FD3',
    tags: [
      { label: 'ECG', color: '#8AE8F0', textColor: '#0B7D88' },
      { label: 'Lipid+', color: '#8AE8F0', textColor: '#0B7D88' },
    ],
  },
  {
    id: 'diabetes',
    title: 'Diabetes Screening',
    description:
      'Comprehensive HbA1c, insulin resistance metrics, and glucose tolerance tests.',
    price: '₹189',
    icon: 'medical-bag',
    iconColor: '#007E95',
    tags: [
      { label: 'HbA1c', color: '#8AE8F0', textColor: '#0B7D88' },
      { label: 'Insulin', color: '#8AE8F0', textColor: '#0B7D88' },
    ],
  },
  {
    id: 'women',
    title: "Women's Wellness",
    description:
      'Hormonal balance panel, thyroid function, and specialized bone density screening.',
    price: '₹349',
    icon: 'gender-female',
    iconColor: '#6255E6',
    tags: [
      { label: 'Hormones', color: '#D1CCFF', textColor: '#6255E6' },
      { label: 'Thyroid', color: '#D1CCFF', textColor: '#6255E6' },
    ],
  },
  {
    id: 'men',
    title: "Men's Wellness",
    description:
      'Prostate health markers, testosterone levels, and metabolic efficiency testing.',
    price: '₹329',
    icon: 'gender-male',
    iconColor: '#0D5FD3',
    tags: [
      { label: 'PSA', color: '#8AE8F0', textColor: '#0B7D88' },
      { label: 'Metabolism', color: '#8AE8F0', textColor: '#0B7D88' },
    ],
  },
];

export default function SpecializedGoalsScreen({ navigation }: Props) {
  const [selectedScreeningIds, setSelectedScreeningIds] = useState<string[]>(
    [],
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleScreeningSelection = useCallback((screeningId: string) => {
    setSelectedScreeningIds(prev => {
      if (prev.includes(screeningId)) {
        return prev.filter(id => id !== screeningId);
      }

      return [...prev, screeningId];
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
          <MaterialCommunityIcons name="bell-outline" size={22} color="#075BC8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Specialized Health Goals</Text>
          <Text style={styles.heroSubtitle}>
            Tailor your health journey with targeted screenings designed by
            clinical experts. Choose the package that aligns with your specific
            wellness objectives.
          </Text>

          <View style={styles.heroImageWrap}>
            <SpecializedHealthGoalsImage
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            />
          </View>
        </View>

        <View style={styles.targetedSection}>
          <Text style={styles.targetedHeading}>Targeted Screenings</Text>
          <Text style={styles.targetedSubtitle}>
            Select one or more focus areas for your checkup
          </Text>

          <View style={styles.planPill}>
            <Text style={styles.planPillText}>4 Available Plans</Text>
          </View>

          {targetedScreenings.map(item => {
            const isSelected = selectedScreeningIds.includes(item.id);

            return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={[
                styles.screeningCard,
                isSelected && styles.screeningCardSelected,
              ]}
              onPress={() => toggleScreeningSelection(item.id)}
            >
              <View style={styles.screeningTopRow}>
                {item.id === 'heart' ? (
                  <HeartIcon width={30} height={30} />
                ) : item.id === 'diabetes' ? (
                  <DiabetesIcon width={30} height={30} />
                ) : item.id === 'women' ? (
                  <WellnessIcon width={30} height={30} />
                ) : item.id === 'men' ? (
                  <MensWellnessIcon width={30} height={30} />
                ) : (
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={30}
                    color={item.iconColor}
                  />
                )}
                <View
                  style={[
                    styles.screeningCheckbox,
                    isSelected && styles.screeningCheckboxSelected,
                  ]}
                >
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color="#FFFFFF"
                    />
                  )}
                </View>
              </View>

              <Text style={styles.screeningTitle}>{item.title}</Text>
              <Text style={styles.screeningDescription}>{item.description}</Text>

              <View style={styles.tagRow}>
                {item.tags.map(tag => (
                  <View
                    key={`${item.id}-${tag.label}`}
                    style={[styles.tagPill, { backgroundColor: tag.color }]}
                  >
                    <Text style={[styles.tagText, { color: tag.textColor }]}>
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.screeningDivider} />

              <View style={styles.screeningFooter}>
                <Text style={styles.screeningPrice}>{item.price}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#0D5FD3"
                />
              </View>
            </TouchableOpacity>
          );
          })}

          <TouchableOpacity activeOpacity={0.9} style={styles.bookNowButton}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={21}
              color="#FFFFFF"
            />
            <Text style={styles.bookNowButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
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
    backgroundColor: '#1976E6',
    borderRadius: 14,
    paddingHorizontal: 34,
    paddingTop: 36,
    paddingBottom: 28,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 18,
  },
  heroSubtitle: {
    color: 'rgba(241, 245, 249, 0.96)',
    fontSize: 17,
    lineHeight: 28,
    fontFamily: 'Poppins',
    marginBottom: 24,
  },
  heroImageWrap: {
    width: '100%',
    height: 293,
    borderRadius: 0,
    overflow: 'hidden',
  },
  targetedSection: {
    marginTop: 24,
  },
  targetedHeading: {
    color: '#0D5FD3',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  targetedSubtitle: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  planPill: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: '#DCE7FF',
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 16,
  },
  planPillText: {
    color: '#0D5FD3',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  screeningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 18,
  },
  screeningCardSelected: {
    borderColor: '#0D5FD3',
    borderWidth: 1.5,
  },
  screeningTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screeningCheckbox: {
    width: 25,
    height: 25,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screeningCheckboxSelected: {
    backgroundColor: '#0D5FD3',
    borderColor: '#0D5FD3',
  },
  screeningTitle: {
    color: '#1E293B',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  screeningDescription: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  screeningDivider: {
    height: 1,
    backgroundColor: '#D7DFEA',
    marginBottom: 12,
  },
  screeningFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screeningPrice: {
    color: '#0D5FD3',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  bookNowButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0D5FD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: 'Poppins',
    marginLeft: 10,
  },
});
