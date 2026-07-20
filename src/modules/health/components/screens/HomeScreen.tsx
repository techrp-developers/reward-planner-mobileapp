import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Navbar from '../../../../navbar/Navbar';
import HealthBottomTabs, {
  HEALTH_TAB_BAR_HEIGHT,
} from '../HealthBottomTabs';

import BloodCheckupIcon from '../../assets/icons/blood_checkup_icon.svg';
import FullBodyIcon from '../../assets/icons/full_body_icon.svg';
import XrayIcon from '../../assets/icons/xray_icon.svg';
import SpecializedIcon from '../../assets/icons/specilized_icon.svg';

import HemoglobinIcon from '../../assets/icons/Hemoglobin.svg';
import ThyroidIcon from '../../assets/icons/Thyroid.svg';
import BloodGroupIcon from '../../assets/icons/BloodG.svg';
import BloodSugarIcon from '../../assets/icons/BloodS.svg';
import CholesterolIcon from '../../assets/icons/Cholesterol.svg';
import VitaminIcon from '../../assets/icons/VitaminLevels.svg';
import CBCIcon from '../../assets/icons/CBC.svg';
import LiverIcon from '../../assets/icons/LiverFunction.svg';
import KidneyIcon from '../../assets/icons/KidneyFunction.svg';
import RoutineIcon from '../../assets/icons/RoutineMarkers.svg';
import CityLabIcon from '../../assets/icons/CityLab.svg';
import HealthQuestIcon from '../../assets/icons/HealthQuest.svg';
import DiagnosticProIcon from '../../assets/icons/DiagnosticPro.svg';
import SafeTouchLabsIcon from '../../assets/icons/SafeTouchLabs.svg';

import SarahJenkinsIcon from '../../assets/icons/sarah_jenkins.svg';
import WorldBloodDonorBanner from '../../assets/banners/world-blood-donor-banner.svg';

import VenueHospitalOne from '../../assets/banners/venue-hospital-1.svg';
import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import RpLogoOne from '../../../busbooking/assets/banners/rp_logo1.svg';

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

const markerSubtitleHighlights: Record<number, string[]> = {
  1: ['oxygen levels', 'anemia markers'],
  2: ['metabolism', 'TSH'],
  3: ['blood type', 'Rh'],
  4: ['pre-diabetes', 'fasting glucose'],
  5: ['LDL', 'HDL'],
  6: ['D3', 'B12'],
  7: ['Complete Blood Count', 'immunity'],
  8: ['enzymes', 'hepatic health'],
  9: ['filtration efficiency', 'Creatinine'],
  10: ['biomarkers', 'systemic inflammation'],
};

function renderMarkerSubtitle(
  subtitle: string,
  markerId: number,
  strongStyle: object,
): React.ReactNode {
  const highlights = markerSubtitleHighlights[markerId] ?? [];
  if (highlights.length === 0) {
    return subtitle;
  }

  const orderedHighlights = [...highlights].sort((a, b) => b.length - a.length);
  const escaped = orderedHighlights.map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = subtitle.split(new RegExp(`(${escaped.join('|')})`, 'g'));

  return parts.map((part, index) => {
    const isHighlighted = orderedHighlights.some(item => item === part);
    return isHighlighted ? (
      <Text key={`${markerId}-${index}`} style={strongStyle}>
        {part}
      </Text>
    ) : (
      <React.Fragment key={`${markerId}-${index}`}>{part}</React.Fragment>
    );
  });
}

const howItWorksSteps = [
  {
    id: 1,
    title: 'Choose Your Package',
    subtitle:
      'Select the annual checkup or a\nspecialized screen from the menu\nabove.',
  },
  {
    id: 2,
    title: 'Home Sample or Lab Visit',
    subtitle:
      'Book a certified phlebotomist to visit\nyour home or visit one of 500+ labs.',
  },
  {
    id: 3,
    title: 'Digital Reports in 24h',
    subtitle:
      'View results instantly on your dashboard\nwith AI driven doctor insights.',
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Annual Blood Donation Camp',
    description:
      'Support our community health initiative. Every donation can save up to three lives.',
    dateTime: 'Nov 05 • 6:00 PM',
    location: 'Staff Lounge B',
    buttonText: 'Register Now',
    Banner: WorldBloodDonorBanner,
  },
  {
    id: 2,
    title: 'Free Health Checkup Camp',
    description:
      'Get basic health screening and expert guidance from certified professionals.',
    dateTime: 'Nov 12 • 5:00 PM',
    location: 'Main Hall',
    buttonText: 'Register Now',
    Banner: WorldBloodDonorBanner,
  },
  {
    id: 3,
    title: 'Wellness Awareness Session',
    description:
      'Join our wellness talk to understand preventive care, healthy habits, and routine screening.',
    dateTime: 'Nov 18 • 4:30 PM',
    location: 'Auditorium',
    buttonText: 'Join Event',
    Banner: WorldBloodDonorBanner,
  },
  {
    id: 4,
    title: 'Doctor Consultation Drive',
    description:
      'Meet experienced doctors for quick consultation and personalized healthcare guidance.',
    dateTime: 'Nov 25 • 11:00 AM',
    location: 'Health Desk',
    buttonText: 'Book Slot',
    Banner: WorldBloodDonorBanner,
  },
];
type UpcomingEvent = (typeof upcomingEvents)[number];

const EVENT_CARD_WIDTH = 355;
const ACTIVE_VENUE_CARD_WIDTH = EVENT_CARD_WIDTH;

type ActiveVenue = {
  id: number;
  title: string;
  distance: string;
  rating: string;
  buttonText: string;
  Banner: React.FC<SvgProps>;
};

const activeVenues: ActiveVenue[] = [
  {
    id: 1,
    title: 'St. Jude Medical',
    distance: '3.5 miles away',
    rating: '4.6',
    buttonText: 'Book Checkup',
    Banner: VenueHospitalOne,
  },
  {
    id: 2,
    title: 'Wellness Care',
    distance: '2.1 miles away',
    rating: '4.8',
    buttonText: 'Book Checkup',
    Banner: VenueHospitalOne,
  },
  {
    id: 3,
    title: 'City Health Lab',
    distance: '4.2 miles away',
    rating: '4.5',
    buttonText: 'Book Checkup',
    Banner: VenueHospitalOne,
  },
];

const certifiedLabPartners = [
  {
    id: 1,
    title: 'City Lab',
    Icon: CityLabIcon,
  },
  {
    id: 2,
    title: 'HealthQuest',
    Icon: HealthQuestIcon,
  },
  {
    id: 3,
    title: 'Diagnostic Pro',
    Icon: DiagnosticProIcon,
  },
  {
    id: 4,
    title: 'SafeTouch Labs',
    Icon: SafeTouchLabsIcon,
  },
] as const;

type HealthcareFaq = {
  id: number;
  question: string;
  answer: string;
};

const healthcareFaqs: HealthcareFaq[] = [
  {
    id: 1,
    question: 'Is it really 100% free?',
    answer:
      'Yes! Your employer-sponsored health plan covers one comprehensive screening annually. There are zero out-of-pocket costs or co-pays for this specific package.',
  },
  {
    id: 2,
    question: 'When will I get my results?',
    answer:
      'Your results will be shared after your health screening is completed and reviewed by the healthcare team.',
  },
  {
    id: 3,
    question: 'Can I book checkup for family?',
    answer:
      'Family booking depends on your employer health plan and available benefits. Please check your plan details before booking.',
  },
];


export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const eventListRef = useRef<FlatList<UpcomingEvent>>(null);
  const [selectedDiagnosticCategory, setSelectedDiagnosticCategory] =
    useState<'blood' | 'fullBody' | 'xray' | 'specialized'>('blood');
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<number[]>([]);

  const [eventCardWidth, setEventCardWidth] = useState(0);
  const bottomInset = Math.max(insets.bottom, 8);
  const selectedTestsCount = selectedMarkerIds.length;
  const isAllSelected = selectedTestsCount === essentialMarkers.length;
  const [eventSliderWidth, setEventSliderWidth] = useState(0);
const [expandedFaqId, setExpandedFaqId] = useState<number | null>(1);

  const handleOpenBookAppointment = useCallback(() => {
    navigation.navigate('BookAppointment');
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

  const renderEventCard = useCallback(({ item }: { item: UpcomingEvent }) => {
    const EventBanner = item.Banner;

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventBannerWrap}>
          <EventBanner
            width={EVENT_CARD_WIDTH}
            height={130}
            preserveAspectRatio="xMidYMid slice"
          />
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.title}</Text>

          <Text style={styles.eventDescription}>{item.description}</Text>

          <View style={styles.eventMetaRow}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={15}
              color="#4B5563"
            />
            <Text style={styles.eventMetaText}>{item.dateTime}</Text>
          </View>

          <View style={styles.eventMetaRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color="#4B5563"
            />
            <Text style={styles.eventMetaText}>{item.location}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.eventButton}
            onPress={handleOpenBookAppointment}
          >
            <Text style={styles.eventButtonText}>{item.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleOpenBookAppointment]);

const renderActiveVenueCard = useCallback(({ item }: { item: ActiveVenue }) => {
  const VenueBanner = item.Banner;

  return (
    <View style={styles.activeVenueCard}>
      <View style={styles.activeVenueBannerWrap}>
<VenueBanner
  width={ACTIVE_VENUE_CARD_WIDTH}
  height={165}
  preserveAspectRatio="xMidYMid slice"
/>

        <View style={styles.activeVenueRatingPill}>
          <MaterialCommunityIcons name="star" size={13} color="#0B63CE" />
          <Text style={styles.activeVenueRatingText}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.activeVenueContent}>
        <Text numberOfLines={1} style={styles.eventTitle}>
          {item.title}
        </Text>

        <View style={styles.eventMetaRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color="#4B5563"
          />
          <Text style={styles.eventMetaText}>{item.distance}</Text>
        </View>

       <TouchableOpacity
          activeOpacity={0.85}
          style={styles.activeVenueButton}
          onPress={handleOpenBookAppointment}
        >
          <Text style={styles.eventButtonText}>{item.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, [handleOpenBookAppointment]);

const renderHealthcareFaqItem = useCallback(
  (item: HealthcareFaq) => {
    const isExpanded = expandedFaqId === item.id;

    return (
      <View key={item.id} style={styles.healthcareFaqItem}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.healthcareFaqQuestionRow,
            isExpanded && styles.healthcareFaqQuestionRowActive,
          ]}
          onPress={() =>
            setExpandedFaqId(currentId =>
              currentId === item.id ? null : item.id,
            )
          }
        >
          <MaterialCommunityIcons
            name={isExpanded ? 'minus' : 'plus'}
            size={20}
            color="#374151"
          />

          <Text style={styles.healthcareFaqQuestionText}>
            {item.question}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.healthcareFaqAnswerBox}>
            <Text style={styles.healthcareFaqAnswerText}>
              {item.answer}
            </Text>
          </View>
        )}
      </View>
    );
  },
  [expandedFaqId],
);

  const handleHealthTabPress = useCallback(
    (tab: 'Home' | 'Providers' | 'Events' | 'Profile') => {
      if (tab === 'Home') {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }

      if (tab === 'Providers') {
        navigation.navigate('ProvidersScreen');
        return;
      }

      if (tab === 'Events') {
        navigation.navigate('EventsScreen');
        return;
      }

      navigation.navigate('Profile');
    },
    [navigation],
  );

  const navigateToDiagnosticCategory = useCallback(
    (
      category: 'blood' | 'fullBody' | 'xray' | 'specialized',
      screen:
        | 'BloodTestScreen'
        | 'FullBodyScreen'
        | 'XRAYScreen'
        | 'SpecializedGoalsScreen',
    ) => {
      navigation.navigate(screen);
      InteractionManager.runAfterInteractions(() => {
        setSelectedDiagnosticCategory(category);
      });
    },
    [navigation],
  );

  const handleBloodCheckupPress = useCallback(() => {
    navigateToDiagnosticCategory('blood', 'BloodTestScreen');
  }, [navigateToDiagnosticCategory]);

  const handleFullBodyPress = useCallback(() => {
    navigateToDiagnosticCategory('fullBody', 'FullBodyScreen');
  }, [navigateToDiagnosticCategory]);

  const handleXrayPress = useCallback(() => {
    navigateToDiagnosticCategory('xray', 'XRAYScreen');
  }, [navigateToDiagnosticCategory]);

  const handleSpecializedGoalsPress = useCallback(() => {
    navigateToDiagnosticCategory('specialized', 'SpecializedGoalsScreen');
  }, [navigateToDiagnosticCategory]);

  return (
    <View style={styles.safeArea}>
      <Navbar topTabsVariant="health" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: HEALTH_TAB_BAR_HEIGHT + bottomInset + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0A63C9', '#0B4FA7', '#083C82']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroLogoWrap}>
            <RpLogoOne width={84} height={84} />
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>BENEFIT EXCLUSIVE</Text>
          </View>

          <Text style={styles.heroTitle}>
            Your 1 Free Annual{'\n'}Health Checkup
          </Text>

          <Text style={styles.heroSubtitle}>
            Premium screening valued at{'\n'}
            <Text style={styles.heroSubtitleStrong}>₹500</Text>, fully covered
            at{'\n'}
            <Text style={styles.heroSubtitleStrong}>₹0.</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.heroCta}
            onPress={handleOpenBookAppointment}
          >
            <Text style={styles.heroCtaText}>Book your free checkup now</Text>
          </TouchableOpacity>

          <View style={styles.heroFooterRow}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color="#DCEBFF"
            />
            <Text style={styles.heroFooterText}>
              No hidden charges • 100% Covered
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.appointmentSection}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTitle}>Upcoming Appointments</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.appointmentHeaderAction}
              onPress={() => navigation.navigate('UpcomingEvenetsScreen')}
            >
              <Text style={styles.appointmentAction}>See all</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color="#0B57BA"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.appointmentCardRow}>
              <View style={styles.appointmentInfo}>
                <View style={styles.appointmentDateBox}>
                  <Text style={styles.appointmentDateDay}>OCT</Text>
                  <Text style={styles.appointmentDateNumber}>24</Text>
                </View>

                <View style={styles.appointmentMeta}>
                  <Text style={styles.appointmentCardTitle}>Blood Test</Text>
                  <Text style={styles.appointmentCardSubtitle}>
                    City Lab Headquarters
                  </Text>

                  <View style={styles.appointmentTimeRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={14}
                      color="#94A3B8"
                      style={styles.appointmentTimeIcon}
                    />
                    <Text style={styles.appointmentCardTime}>09:00 AM</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.appointmentStatusPill,
                  styles.appointmentStatusConfirmed,
                ]}
              >
                <Text
                  style={[
                    styles.appointmentStatusText,
                    styles.appointmentStatusConfirmedText,
                  ]}
                >
                  CONFIRMED
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.appointmentCardRow}>
              <View style={styles.appointmentInfo}>
                <View style={styles.appointmentDateBox}>
                  <Text style={styles.appointmentDateDay}>NOV</Text>
                  <Text style={styles.appointmentDateNumber}>02</Text>
                </View>

                <View style={styles.appointmentMeta}>
                  <Text style={styles.appointmentCardTitle}>
                    Dental Screening
                  </Text>
                  <Text style={styles.appointmentCardSubtitle}>
                    HealthQuest Dental
                  </Text>

                  <View style={styles.appointmentTimeRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={14}
                      color="#94A3B8"
                      style={styles.appointmentTimeIcon}
                    />
                    <Text style={styles.appointmentCardTime}>02:30 PM</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.appointmentStatusPill,
                  styles.appointmentStatusPending,
                ]}
              >
                <Text
                  style={[
                    styles.appointmentStatusText,
                    styles.appointmentStatusPendingText,
                  ]}
                >
                  PENDING
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.diagnosticSection}>
            <View style={styles.diagnosticSectionHeader}>
              <Text style={styles.diagnosticSectionTitle}>
                Diagnostic Categories
              </Text>
              <Text style={styles.diagnosticSectionCaption}>
                Select a specific area of focus for your checkup
              </Text>
            </View>

            <View style={styles.diagnosticGrid}>
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.diagnosticCard,
                  selectedDiagnosticCategory === 'blood' &&
                    styles.diagnosticCardSelected,
                ]}
                onPress={handleBloodCheckupPress}
              >
                {selectedDiagnosticCategory === 'blood' && (
                  <View style={styles.diagnosticBadge}>
                    <Text style={styles.diagnosticBadgeText}>MOST POPULAR</Text>
                  </View>
                )}

                <BloodCheckupIcon width={48} height={48} />

                <Text
                  style={
                    selectedDiagnosticCategory === 'blood'
                      ? styles.diagnosticCardTitleSelected
                      : styles.diagnosticCardTitle
                  }
                >
                  Blood Checkup
                </Text>

                <Text
                  style={
                    selectedDiagnosticCategory === 'blood'
                      ? styles.diagnosticCardSubtitleSelected
                      : styles.diagnosticCardSubtitle
                  }
                >
                  Metabolic & vital{'\n'}monitoring
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.diagnosticCard,
                  selectedDiagnosticCategory === 'fullBody' &&
                    styles.diagnosticCardSelected,
                ]}
                onPress={handleFullBodyPress}
              >
                <FullBodyIcon width={48} height={48} />

                <Text
                  style={
                    selectedDiagnosticCategory === 'fullBody'
                      ? styles.diagnosticCardTitleSelected
                      : styles.diagnosticCardTitle
                  }
                >
                  Full Body
                </Text>

                <Text
                  style={
                    selectedDiagnosticCategory === 'fullBody'
                      ? styles.diagnosticCardSubtitleSelected
                      : styles.diagnosticCardSubtitle
                  }
                >
                  Complete systemic{'\n'}analysis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.diagnosticCard,
                  selectedDiagnosticCategory === 'xray' &&
                    styles.diagnosticCardSelected,
                ]}
                onPress={handleXrayPress}
              >
                <XrayIcon width={48} height={48} />

                <Text
                  style={
                    selectedDiagnosticCategory === 'xray'
                      ? styles.diagnosticCardTitleSelected
                      : styles.diagnosticCardTitle
                  }
                >
                  X-Ray
                </Text>

                <Text
                  style={
                    selectedDiagnosticCategory === 'xray'
                      ? styles.diagnosticCardSubtitleSelected
                      : styles.diagnosticCardSubtitle
                  }
                >
                  Bone & chest{'\n'}screening
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.diagnosticCard,
                  selectedDiagnosticCategory === 'specialized' &&
                    styles.diagnosticCardSelected,
                ]}
                onPress={handleSpecializedGoalsPress}
              >
                <SpecializedIcon width={48} height={48} />

                <Text
                  style={
                    selectedDiagnosticCategory === 'specialized'
                      ? styles.diagnosticCardTitleSelected
                      : styles.diagnosticCardTitle
                  }
                >
                  Specialized
                </Text>

                <Text
                  style={
                    selectedDiagnosticCategory === 'specialized'
                      ? styles.diagnosticCardSubtitleSelected
                      : styles.diagnosticCardSubtitle
                  }
                >
                  Targeted health{'\n'}goals
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.markersSection}>
            <Text style={styles.markersHeading}>
              10 Essential Health Markers{'\n'}Included
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
                    <MarkerIcon width={44} height={32} />
                  </View>

                  <View style={styles.markerContent}>
                    <Text style={styles.markerTitle}>{item.title}</Text>
                    <Text style={styles.markerSubtitle}>
                      {renderMarkerSubtitle(
                        item.subtitle,
                        item.id,
                        styles.markerSubtitleStrong,
                      )}
                    </Text>
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

          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialQuoteMark}>99</Text>

            <Text style={styles.testimonialText}>
              "The home collection was seamless. I didn't have to miss work, and
              my report was ready before my morning coffee the next day!"
            </Text>

            <View style={styles.testimonialFooter}>
              <View style={styles.testimonialAvatarOuter}>
                <SarahJenkinsIcon width={52} height={52} />
              </View>

              <View style={styles.testimonialInfo}>
                <Text style={styles.testimonialName}>Sarah Jenkins</Text>
                <Text style={styles.testimonialRole}>VERIFIED PATIENT</Text>
              </View>
            </View>
          </View>

          <View style={styles.upcomingEventsSection}>
            <Text style={styles.upcomingEventsHeading}>Upcoming events</Text>

            <FlatList
              data={upcomingEvents}
              keyExtractor={item => String(item.id)}
              renderItem={renderEventCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventListContent}
              snapToInterval={EVENT_CARD_WIDTH + 14}
              decelerationRate="fast"
            />
          </View>

          <View style={styles.certifiedPartnersCard}>
            <Text style={styles.certifiedPartnersEyebrow}>
              CERTIFIED LAB PARTNERS
            </Text>

            {certifiedLabPartners.map(item => {
              const PartnerIcon = item.Icon;

              return (
                <View key={item.id} style={styles.certifiedPartnerRow}>
                  <View style={styles.certifiedPartnerIconWrap}>
                    <PartnerIcon width={24} height={24} />
                  </View>
                  <Text style={styles.certifiedPartnerText}>{item.title}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.activeVenuesSection}>
            <Text style={styles.activeVenuesHeading}>
              Active venues near you
            </Text>

            <FlatList
              data={activeVenues}
              keyExtractor={item => String(item.id)}
              renderItem={renderActiveVenueCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeVenuesListContent}
              snapToInterval={ACTIVE_VENUE_CARD_WIDTH + 14}
              decelerationRate="fast"
            />
          </View>
          <View style={styles.healthcareFaqSection}>
  <View style={styles.healthcareFaqTopRow}>
    <Text style={styles.healthcareFaqSmallTitle}>Got Questions?</Text>

<View style={styles.healthcareFaqHeaderRow}>
  <TouchableOpacity activeOpacity={0.75} style={styles.healthcareBackBtn}>
    <MaterialCommunityIcons name="arrow-left" size={26} color="#075BC8" />
  </TouchableOpacity>

  <View style={styles.healthcareAvatar}>
    <HealthcareAvatar width={42} height={42} />
  </View>

  <Text style={styles.healthcareFaqTitle}>Healthcare</Text>

  <TouchableOpacity activeOpacity={0.75} style={styles.healthcareBellBtn}>
    <MaterialCommunityIcons
      name="bell-outline"
      size={24}
      color="#075BC8"
    />
  </TouchableOpacity>
</View>
  </View>

  <View style={styles.healthcareFaqList}>
    {healthcareFaqs.map(renderHealthcareFaqItem)}
  </View>
</View>
        </View>
      </ScrollView>

      <HealthBottomTabs activeTabKey="Home" onTabPress={handleHealthTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    paddingBottom: 32,
  },

  hero: {
    margin: 16,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },

  heroLogoWrap: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 26,
  },

  heroBadgeText: {
    color: '#EAF3FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.7,
    fontFamily: 'Manrope',
  },

  heroTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    lineHeight: 39,
    fontWeight: '800',
    marginBottom: 16,
    fontFamily: 'Manrope',
  },

  heroSubtitle: {
    color: 'rgba(226,238,255,0.92)',
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 28,
    fontFamily: 'Manrope',
  },

  heroSubtitleStrong: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'Manrope',
  },

  heroCta: {
    minHeight: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 22,
  },

  heroCtaText: {
    color: '#0B57BA',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },

  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroFooterText: {
    color: '#DCEBFF',
    fontSize: 13.5,
    fontWeight: '500',
    marginLeft: 10,
    fontFamily: 'Manrope',
  },

  appointmentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
  },

  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  appointmentTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },

  appointmentHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  appointmentAction: {
    color: '#0B57BA',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginRight: 6,
  },

  appointmentCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  appointmentCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  appointmentDateBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  appointmentDateDay: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Manrope',
  },

  appointmentDateNumber: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
    fontFamily: 'Manrope',
  },

  appointmentMeta: {
    flex: 1,
  },

  appointmentCardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'Manrope',
  },

  appointmentCardSubtitle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Manrope',
  },

  appointmentTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  appointmentTimeIcon: {
    marginRight: 6,
  },

  appointmentCardTime: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Manrope',
  },

  appointmentStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appointmentStatusConfirmed: {
    backgroundColor: '#CCFBF1',
  },

  appointmentStatusPending: {
    backgroundColor: '#E5E7EB',
  },

  appointmentStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'Manrope',
  },

  appointmentStatusConfirmedText: {
    color: '#0F766E',
    fontFamily: 'Manrope',
  },

  appointmentStatusPendingText: {
    color: '#475569',
    fontFamily: 'Manrope',
  },

  diagnosticSection: {
    marginHorizontal: 0,
    marginBottom: 20,
    marginTop: 10,
  },

  diagnosticSectionHeader: {
    marginBottom: 16,
  },

  diagnosticSectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginBottom: 4,
  },

  diagnosticSectionCaption: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: 'Manrope',
  },

  diagnosticGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },

  diagnosticCard: {
    width: '48%',
    height: 178,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  diagnosticCardSelected: {
    borderColor: '#006EDC',
    borderWidth: 2,
    shadowColor: '#006EDC',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  diagnosticBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 24,
    backgroundColor: '#006EDC',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 10,
    zIndex: 10,
  },

  diagnosticBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    fontFamily: 'Manrope',
    letterSpacing: 0.1,
  },

  diagnosticCardTitle: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginTop: 10,
    marginBottom: 4,
  },

  diagnosticCardTitleSelected: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginTop: 10,
    marginBottom: 4,
  },

  diagnosticCardSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Manrope',
    marginBottom: 0,
  },

  diagnosticCardSubtitleSelected: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Manrope',
    marginBottom: 0,
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
    fontFamily: 'Manrope',
    marginBottom: 2,
  },

  markersSubheading: {
    color: '#687489',
    fontSize: 13,
    lineHeight: 22,
    fontFamily: 'Manrope',
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
    fontFamily: 'Manrope',
    fontWeight: '500',
  },

  testsSelectedText: {
    color: '#0E61C9',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },

  markerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#006EDC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  markerCardUnselected: {
    borderColor: '#D8E2FF',
    opacity: 0.7,
  },

  markerIconOnly: {
    width: 44,
    height: 34,
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
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Manrope',
    marginBottom: 2,
  },

  markerSubtitle: {
    color: '#5E6A7E',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Manrope',
  },

  markerSubtitleStrong: {
    color: '#5E6A7E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },

  markerCheckedBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
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
    fontFamily: 'Manrope',
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

  testimonialCard: {
    marginTop: 10,
    marginBottom: 18,
    backgroundColor: '#E0F4F6',
    borderRadius: 30,
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 26,
  },

  testimonialQuoteMark: {
    color: '#82AEB3',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginBottom: 8,
  },

  testimonialText: {
    color: '#007487',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '500',
    fontFamily: 'Manrope',
    marginBottom: 28,
  },

  testimonialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  testimonialAvatarOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },

  testimonialInfo: {
    flex: 1,
  },

  testimonialName: {
    color: '#006E75',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },

  testimonialRole: {
    color: '#4D9FA8',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'Manrope',
  },

  upcomingEventsSection: {
    marginTop: 6,
    marginBottom: 20,
  },

  certifiedPartnersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    marginBottom: 20,
    alignItems: 'center',
  },

  certifiedPartnersEyebrow: {
    color: '#64748B',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: 'Manrope',
    letterSpacing: 2.2,
    marginBottom: 18,
  },

  certifiedPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 170,
    minHeight: 42,
    marginBottom: 12,
  },

  certifiedPartnerIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },

  certifiedPartnerText: {
    color: '#8D96A5',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Manrope',
    flexShrink: 0,
  },

  upcomingEventsHeading: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginBottom: 10,
  },

  eventSliderWrapper: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },

  eventSlide: {
    width: '100%',
  },
  eventListContent: {
    paddingRight: 20,
  },

  eventCard: {
    width: EVENT_CARD_WIDTH,
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    marginRight: 14,
  },

  eventBannerWrap: {
    width: EVENT_CARD_WIDTH,
    height: 130,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  eventContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 22,
  },

  eventTitle: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    fontFamily: 'Manrope',
    marginBottom: 8,
  },

  eventDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    fontFamily: 'Manrope',
    marginBottom: 12,
  },

  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  eventMetaText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    fontFamily: 'Manrope',
    marginLeft: 4,
  },

  eventButton: {
    height: 38,
    borderRadius: 5,
    backgroundColor: '#0B63CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  eventButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  activeVenuesSection: {
  marginTop: 4,
  marginBottom: 24,
},

activeVenuesHeading: {
  color: '#0F172A',
  fontSize: 19,
  lineHeight: 22,
  fontWeight: '800',
  fontFamily: 'Manrope',
  marginBottom: 10,
},

activeVenuesListContent: {
  paddingRight: 20,
},

activeVenueCard: {
  width: ACTIVE_VENUE_CARD_WIDTH,
  backgroundColor: '#F8FAFF',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: '#CBD5E1',
  overflow: 'hidden',
  marginRight: 14,
},

activeVenueBannerWrap: {
  width: ACTIVE_VENUE_CARD_WIDTH,
  height: 165,
  backgroundColor: '#FFFFFF',
  overflow: 'hidden',
  position: 'relative',
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
},
activeVenueContent: {
  paddingHorizontal: 16,
  paddingTop: 20,
  paddingBottom: 22,
},
activeVenueButton: {
  height: 36,
  borderRadius: 10,
  backgroundColor: '#0B63CE',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 12,
},

activeVenueRatingPill: {
  position: 'absolute',
  top: 10,
  right: 10,
  minWidth: 58,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#EAF4FF',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 9,
},

activeVenueRatingText: {
  color: '#0F172A',
  fontSize: 14,
  lineHeight: 16,
  fontWeight: '700',
  fontFamily: 'Manrope',
  marginLeft: 4,
},
healthcareFaqSection: {
  marginTop: 4,
  marginBottom: 28,
  backgroundColor: '#FFFFFF',
},

healthcareFaqTopRow: {
  backgroundColor: '#FFFFFF',
},

healthcareFaqSmallTitle: {
  color: '#111827',
  fontSize: 19,
  lineHeight: 25,
  fontWeight: '800',
  fontFamily: 'Manrope',
  marginBottom: 14,
  marginTop: 14,
  marginLeft: 14,
},

healthcareFaqHeaderRow: {
  height: 46,
  flexDirection: 'row',
  alignItems: 'center',
},

healthcareBackBtn: {
  width: 34,
  height: 34,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 10,
},


healthcareFaqTitle: {
  flex: 1,
  color: '#075BC8',
  fontSize: 25,
  lineHeight: 31,
  fontWeight: '800',
  fontFamily: 'Manrope',
},

healthcareBellBtn: {
  width: 38,
  height: 38,
  alignItems: 'center',
  justifyContent: 'center',
},

healthcareFaqList: {
  marginTop: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},

healthcareFaqItem: {
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
},

healthcareFaqQuestionRow: {
  minHeight: 65,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 14,
  backgroundColor: '#FFFFFF',
},

healthcareFaqQuestionRowActive: {
  backgroundColor: '#EFF4FF',
},

healthcareFaqQuestionText: {
  flex: 1,
  color: '#3F3F46',
  fontSize: 15,
  lineHeight: 21,
  fontWeight: '700',
  fontFamily: 'Manrope',
  marginLeft: 18,
},

healthcareFaqAnswerBox: {
  backgroundColor: '#EFF4FF',
  paddingLeft: 49,
  paddingRight: 22,
  paddingBottom: 20,
},

healthcareFaqAnswerText: {
  color: '#27272A',
  fontSize: 15,
  lineHeight: 26,
  fontWeight: '400',
  fontFamily: 'Manrope',
},
healthcareAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  marginRight: 10,
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
},
});

