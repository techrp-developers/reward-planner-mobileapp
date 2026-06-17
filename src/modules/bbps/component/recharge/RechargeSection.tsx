import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
import BBPSHead from '../../constatnt/BBPSHead';
import SkeletonBox from '../../../services/component/constant/SkeletonBox';
import { useAuth } from '../../../common/auth/context/AuthContext';

// const RECHARGE_HISTORY = [
//   {
//     id: '1',
//     planType: 'Validity Plan',
//     amount: '219',
//     validity: '28 days',
//     data: '3GB/pack',
//     rechargedOn: '17 Jan',
//     badgeColor: '#E9ECF9',
//   },
//   {
//     id: '2',
//     planType: 'Data Plan',
//     amount: '33',
//     validity: '1 days',
//     data: '2GB/pack',
//     rechargedOn: '17 Jan',
//     badgeColor: '#E9ECF9',
//   },
// ];

const FILTER_CHIPS = ['2GB Data', '28 Days Validity', '2.5 GB/Data'];

const RECOMMENDED_PACKS = [
  { id: '1', price: '39', validity: '3 days', data: '3GB/pack', desc: 'Data : 3GB/day | Validity : 3 days' },
  { id: '2', price: '99', validity: '3 days', data: '3GB/pack', desc: 'Data : 3GB/day | Validity : 3 days' },
  { id: '3', price: '359', validity: '3 days', data: '3GB/pack', desc: 'Data : 3GB/day | Validity : 3 days' },
];

function RechargeSection({ navigation }: any) {
  const { user } = useAuth();
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
    <ScrollView style={styles.mainContainer} stickyHeaderIndices={[0]}>
      <BBPSHead
        user={{
          name: user?.name || 'User',
          number: user?.phone || '',
          operatorLogo: require('../../assets/Sample/VI_Card.png'),
          type: 'Prepaid',
        }}
        onBackPress={() => navigation.goBack()}
        onChangePress={() => console.log('Change Operator')}
      />

      <View style={styles.outerContainer}>
        {loading ? (
          <View>
            <View style={styles.headerRow}>
              <SkeletonBox pulse={pulse} width={170} height={20} borderRadius={8} />
              <SkeletonBox pulse={pulse} width={64} height={16} borderRadius={8} />
            </View>

            {[0, 1].map((item) => (
              <View key={`recharge-card-skeleton-${item}`} style={styles.cardWrapper}>
                <SkeletonBox pulse={pulse} width={110} height={26} borderRadius={8} style={styles.skeletonBadge} />
                <View style={styles.cardContainer}>
                  <View style={styles.leftContent}>
                    <SkeletonBox pulse={pulse} width="80%" height={16} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="62%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                    <SkeletonBox pulse={pulse} width={90} height={12} borderRadius={8} style={styles.skeletonGapSm} />
                  </View>
                  <SkeletonBox pulse={pulse} width={110} height={44} borderRadius={10} />
                </View>
              </View>
            ))}

            <View style={styles.plansSection}>
              <View style={styles.searchSection}>
                <SkeletonBox pulse={pulse} width="100%" height={52} borderRadius={10} />
                <View style={styles.skeletonChipRow}>
                  <SkeletonBox pulse={pulse} width={40} height={36} borderRadius={18} />
                  <SkeletonBox pulse={pulse} width={110} height={36} borderRadius={18} style={styles.skeletonChipGap} />
                  <SkeletonBox pulse={pulse} width={130} height={36} borderRadius={18} style={styles.skeletonChipGap} />
                </View>
              </View>

              <View style={styles.tabContainer}>
                <SkeletonBox pulse={pulse} width={130} height={18} borderRadius={8} />
              </View>

              {[0, 1, 2].map((item) => (
                <View key={`plan-skeleton-${item}`} style={styles.planRow}>
                  <View style={styles.planInfoMain}>
                    <SkeletonBox pulse={pulse} width={55} height={24} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width={70} height={20} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width={70} height={20} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width={24} height={24} borderRadius={12} />
                  </View>
                  <SkeletonBox pulse={pulse} width="85%" height={13} borderRadius={8} style={styles.skeletonGapSm} />
                  <View style={styles.planDivider} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            {/* Previous Recharges Section */}
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Previous Recharges</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* {RECHARGE_HISTORY.map((item) => (
              <View key={item.id} style={styles.cardWrapper}>
                <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
                  <Text style={styles.badgeText}>{item.planType}</Text>
                </View>
                <View style={styles.cardContainer}>
                  <View style={styles.leftContent}>
                    <Text style={styles.planDetails}>
                      ₹{item.amount} – {item.validity} – {item.data}
                    </Text>
                    <Text style={styles.dateSubtext}>
                      Recharged ₹{item.amount} on {item.rechargedOn}
                    </Text>
                    <TouchableOpacity style={styles.viewDetailsBtn}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                  {item.planType === 'Validity Plan' ? (
                    <LinearGradient
                      colors={['#8665FF', '#5B47A3']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.repeatButtonGradientBorder}
                    >
                      <TouchableOpacity style={styles.repeatButtonInner} activeOpacity={0.85}>
                        <Text style={styles.repeatButtonText}>Repeat</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  ) : (
                    <TouchableOpacity activeOpacity={0.85}>
                      <LinearGradient
                        colors={['#8665FF', '#5B47A3']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.rechargeButton}
                      >
                        <Text style={styles.rechargeButtonText}>Recharge</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))} */}

            <View style={styles.plansSection}>
              {/* Search and Filter Section */}
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={24} color="#9CA3AF" />
                  <TextInput
                    placeholder="Search a Plan, e.g. 299 or 28 days"
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <TouchableOpacity style={styles.filterIconButton}>
                    <MaterialIcons name="tune" size={20} color="#4B5563" />
                  </TouchableOpacity>
                  {FILTER_CHIPS.map((chip, index) => (
                    <TouchableOpacity key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Recommended Packs Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity style={styles.activeTab}>
                  <Text style={styles.activeTabText}>Recommended Packs</Text>
                  <View style={styles.activeTabUnderline} />
                </TouchableOpacity>
                <Text style={styles.inactiveTabText}>Truly Unlimited</Text>
                <Text style={styles.inactiveTabText}>Data</Text>
              </View>

              {/* Plan List */}
              {RECOMMENDED_PACKS.map((plan) => (
                <TouchableOpacity key={plan.id} style={styles.planRow}>
                  <View style={styles.planInfoMain}>
                    <Text style={styles.planPriceText}>₹{plan.price}</Text>
                    <View style={styles.planSpecCol}>
                      <Text style={styles.specLabel}>Validity</Text>
                      <Text style={styles.specValue}>{plan.validity}</Text>
                    </View>
                    <View style={styles.planSpecCol}>
                      <Text style={styles.specLabel}>Data</Text>
                      <Text style={styles.specValue}>{plan.data}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={30} color="#9CA3AF" />
                  </View>
                  <Text style={styles.planDescription}>{plan.desc}</Text>
                  <View style={styles.planDivider} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  outerContainer: { paddingVertical: 15, backgroundColor: '#F3F4F8' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  viewAllText: { color: '#8665FF', fontSize: 16, fontWeight: '600' },
  cardWrapper: { paddingHorizontal: 16, marginBottom: 20 },
  badge: { position: 'absolute', left: 28, top: -12, zIndex: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  cardContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 20, borderWidth: 1, borderColor: '#EDEDED', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  leftContent: { flex: 1 },
  planDetails: { fontSize: 16, fontWeight: '700', color: '#333' },
  dateSubtext: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  viewDetailsBtn: { marginTop: 6 },
  viewDetailsText: { color: '#8665FF', fontWeight: '600' },
  plansSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 6,
    paddingTop: 8,
    paddingBottom: 8,
  },
  rechargeButton: {
    width: 110,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeButtonText: { color: '#FFF', fontWeight: '700' },
  repeatButtonGradientBorder: {
    width: 110,
    height: 44,
    borderRadius: 10,
    padding: 1,
  },
  repeatButtonInner: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatButtonText: { color: '#8665FF', fontWeight: '700' },

  /* New Sections Styles */
  searchSection: { paddingHorizontal: 16, marginTop: 10, backgroundColor: '#FFFFFF', paddingTop: 18, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10,
    borderWidth: 1, borderColor: '#D8E3E7', paddingHorizontal: 16, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#000' },
  chipScroll: { marginTop: 15, flexDirection: 'row' },
  filterIconButton: { width: 40, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#CFCFCF', justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#CFCFCF', justifyContent: 'center', marginRight: 8, backgroundColor: '#FFFFFF' },
  chipText: { color: '#4B5563', fontWeight: '500' },

  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 25, paddingHorizontal: 16, backgroundColor: '#FFFFFF' },
  activeTab: { marginRight: 20, paddingBottom: 10 },
  activeTabText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  activeTabUnderline: { height: 3, backgroundColor: '#8665FF', position: 'absolute', bottom: 0, left: 0, right: 0 },
  inactiveTabText: { fontSize: 15, fontWeight: '500', color: '#9CA3AF', marginRight: 20 },

  planRow: { paddingHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF' },
  planInfoMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planPriceText: { fontSize: 24, fontWeight: '800', color: '#111827', width: '25%' },
  planSpecCol: { width: '25%' },
  specLabel: { fontSize: 12, color: '#9CA3AF' },
  specValue: { fontSize: 15, fontWeight: '700', color: '#374151' },
  planDescription: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  planDivider: { height: 1, backgroundColor: '#F3F4F6', marginTop: 15 },
  skeletonBadge: { position: 'absolute', left: 28, top: -12, zIndex: 10 },
  skeletonGapSm: { marginTop: 8 },
  skeletonChipRow: { flexDirection: 'row', marginTop: 15 },
  skeletonChipGap: { marginLeft: 8 },
});

export default RechargeSection;