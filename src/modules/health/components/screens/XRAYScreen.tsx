import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HealthcareAvatar from '../../assets/icons/healthcare-avatar.svg';
import XrayIcon from '../../assets/icons/xray_icon.svg';
import type { HealthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HealthStackParamList, 'XRAYScreen'>;

const xrayTypes = [
  {
    id: 'chest',
    title: 'Chest X-Ray',
    subtitle: 'Standard heart & lungs exam',
    icon: 'xray',
  },
  {
    id: 'bone-density',
    title: 'Bone Density Scan',
    subtitle: 'DEXA scan for strength',
    icon: 'bone',
  },
  {
    id: 'dental',
    title: 'Dental X-Ray',
    subtitle: 'Full oral panoramic imaging',
    icon: 'tooth-outline',
  },
] as const;

export default function XRAYScreen({ navigation }: Props) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('chest');

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
          <LinearGradient
            colors={['rgba(8, 24, 42, 0.92)', 'rgba(14, 95, 201, 0.82)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroOverlay}
          >
            <View style={styles.heroBackgroundArt}>
              <View style={styles.heroScannerBase} />
              <View style={styles.heroScannerArm} />
              <View style={styles.heroMonitor} />
              <View style={styles.heroGlowRing} />
              <View style={styles.heroFloorLine} />
            </View>

            <View style={styles.heroIconBadge}>
              <XrayIcon width={18} height={18} />
            </View>

            <View style={styles.heroTextBlock}>
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
          </LinearGradient>
        </View>

        <View style={styles.typesSection}>
          <View style={styles.typesHeader}>
            <Text style={styles.typesTitle}>Available Types</Text>
            <Text style={styles.typesHelper}>Select one or more</Text>
          </View>

          {xrayTypes.map(item => {
            const isSelected = item.id === selectedTypeId;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                style={[
                  styles.typeCard,
                  isSelected && styles.typeCardSelected,
                ]}
                onPress={() => setSelectedTypeId(item.id)}
              >
                <View style={styles.typeIconWrap}>
                  {item.id === 'chest' ? (
                    <XrayIcon width={22} height={22} />
                  ) : (
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color="#0A5DCA"
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
    fontFamily: 'Poppins',
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroOverlay: {
    minHeight: 218,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  heroBackgroundArt: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.44,
  },
  heroScannerBase: {
    position: 'absolute',
    right: 44,
    top: 34,
    width: 92,
    height: 118,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
  heroScannerArm: {
    position: 'absolute',
    right: 92,
    top: 16,
    width: 14,
    height: 126,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderRadius: 10,
  },
  heroMonitor: {
    position: 'absolute',
    right: 18,
    top: 68,
    width: 44,
    height: 34,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.66)',
    borderRadius: 4,
  },
  heroGlowRing: {
    position: 'absolute',
    left: 28,
    top: 14,
    width: 132,
    height: 48,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroFloorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  heroIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    marginTop: 38,
  },
  heroPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  heroPillText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(239,246,255,0.96)',
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'Poppins',
    maxWidth: 248,
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
    fontFamily: 'Poppins',
  },
  typesHelper: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: 'Poppins',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3DAE9',
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  typeCardSelected: {
    borderColor: '#0A5DCA',
    borderWidth: 1.4,
  },
  typeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontFamily: 'Poppins',
  },
  typeSubtitle: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins',
  },
  typeSelectionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BAC4D7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeSelectionDotSelected: {
    borderColor: '#0A5DCA',
    backgroundColor: '#0A5DCA',
  },
});
