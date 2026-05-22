import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// Asset Imports
import DTH from '../assets/BBPS_Service/DTH.png';
import FASTagRecharge from '../assets/BBPS_Service/FASTag Recharge.png';
import Electricity from '../assets/BBPS_Service/Electricity.png';
import water from '../assets/BBPS_Service/Water.png';
import LPGCylender from '../assets/BBPS_Service/LPG.png';
import Landline from '../assets/BBPS_Service/LandLine.png';
import Broadband from '../assets/BBPS_Service/Broadband.png';
import Insurance from '../assets/BBPS_Service/Insurance.png';
import BBPSHead from './BBPSHead';
import SkeletonBox from '../../services/component/constant/SkeletonBox';

const { width } = Dimensions.get('window');

// Reusable Service Item Component
const ServiceItem = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.itemContainer} activeOpacity={0.75} onPress={onPress}>
    <LinearGradient
      colors={['#8665FF', '#5B47A3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.iconCircle}
    >
      <Image source={icon} style={styles.iconImage} resizeMode="contain" />
    </LinearGradient>
    <Text style={styles.itemLabel} numberOfLines={2}>{label}</Text>
  </TouchableOpacity>
);

function Search({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    anim.start();

    const timer = setTimeout(() => setLoading(false), 900);

    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <BBPSHead
        title="Search"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View>
            <View style={styles.searchBarWrapper}>
              <SkeletonBox pulse={pulse} width="100%" height={55} borderRadius={12} />
            </View>

            <View style={styles.bannerContainer}>
              <SkeletonBox pulse={pulse} width="100%" height={170} borderRadius={15} />
            </View>

            <View style={styles.popularHeader}>
              <SkeletonBox pulse={pulse} width={90} height={18} borderRadius={8} />
            </View>

            <View style={styles.grid}>
              {Array.from({ length: 8 }).map((_, index) => (
                <View key={`search-skeleton-${index}`} style={styles.itemContainer}>
                  <SkeletonBox pulse={pulse} width={55} height={55} borderRadius={27.5} />
                  <SkeletonBox pulse={pulse} width={60} height={11} borderRadius={6} style={styles.skeletonLabelGap} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            {/* Search Bar */}
            <View style={styles.searchBarWrapper}>
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={24} color="#9CA3AF" />
                <TextInput
                  placeholder="Search for 'Electricity'"
                  style={styles.searchInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Limited-Time Offer Banner */}
            <View style={styles.bannerContainer}>
              <LinearGradient
                colors={['#5856D6', '#3D5AF7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerText}>
                    <Text style={styles.bannerTitle}>Limited-Time Offer</Text>
                    <Text style={styles.bannerSubtitle}>Pay your bills today and earn bonus rewards.</Text>
                    <TouchableOpacity style={styles.activateBtn}>
                      <Text style={styles.activateBtnText}>Activate now {'>'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.bannerTerms}>*Terms & Conditions apply</Text>
                  </View>
                  <View style={styles.bannerImageArea}>
                    <Text style={styles.bannerEmoji}>📄</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Popular Section */}
            <View style={styles.popularHeader}>
              <Text style={styles.popularTitle}>Popular</Text>
              <MaterialIcons name="trending-up" size={18} color="#8665FF" style={styles.trendingIcon} />
            </View>
            <View style={styles.grid}>
              <ServiceItem icon={Electricity} label="Electricity" onPress={() => navigation.navigate('BillerSelectScreen')} />
              <ServiceItem icon={water} label="Water" onPress={() => navigation.navigate('BillerSelectScreen')} />
              <ServiceItem icon={LPGCylender} label="LPG Cylinder" onPress={() => navigation.navigate('BillerSelectScreen')} />
              <ServiceItem icon={DTH} label="DTH" />
              <ServiceItem icon={Landline} label="Landline Postpaid" onPress={() => navigation.navigate('BillerSelectScreen')} />
              <ServiceItem icon={Broadband} label="Broadband Postpaid" onPress={() => navigation.navigate('BillerSelectScreen')} />
              <ServiceItem icon={FASTagRecharge} label="FASTag Recharge" />
              <ServiceItem icon={Insurance} label="Insurance Premiums" />
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40 },
  
  searchBarWrapper: { paddingHorizontal: 20, marginTop: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
    height: 55,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000' },

  // Banner Styles
  bannerContainer: { marginHorizontal: 20, marginTop: 20, borderRadius: 15, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  bannerGradient: { paddingVertical: 20, paddingHorizontal: 16 },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerText: { flex: 1, marginRight: 12 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  bannerSubtitle: { fontSize: 13, color: '#E8E8F5', marginBottom: 12 },
  activateBtn: { backgroundColor: '#00BFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  activateBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  bannerTerms: { fontSize: 11, color: '#CCCCDD', marginTop: 4 },
  bannerImageArea: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  bannerEmoji: { fontSize: 40 },

  // Popular Section
  popularHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  popularTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  trendingIcon: { marginLeft: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  itemContainer: { width: width / 4 - 5, alignItems: 'center', marginBottom: 20 },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconImage: { width: 28, height: 28, tintColor: '#FFFFFF' },
  itemLabel: { fontSize: 11, color: '#374151', textAlign: 'center', fontWeight: '500', paddingHorizontal: 4 },
  skeletonLabelGap: { marginTop: 8 },
});

export default Search;