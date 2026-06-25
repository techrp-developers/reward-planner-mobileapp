import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BBPSHead from '../../constatnt/BBPSHead';
import SkeletonBox from '../../../services/component/constant/SkeletonBox';
import { useAuth } from '../../../common/auth/context/AuthContext';
import {
  BillLocation,
  fetchBillLocations,
  fetchRechargePlans,
  RechargePlan,
} from '../../api/BillsAPI';
import { useAlert } from '../../../ecommerce/components/alerts';

const getPlanId = (plan: RechargePlan) =>
  String(plan.planId || plan.plan_id || plan.id || plan.recharge_plan_id || '');

const getPlanAmount = (plan: RechargePlan) =>
  String(plan.amount || plan.price || plan.rs || plan.recharge_amount || '');

const getPlanValidity = (plan: RechargePlan) =>
  String(plan.validity || plan.validityDescription || plan.validity_desc || '-');

const getPlanData = (plan: RechargePlan) =>
  String(plan.data || plan.dataBenefit || plan.benefits || '-');

const getPlanDescription = (plan: RechargePlan) =>
  String(plan.description || plan.desc || plan.planDescription || plan.short_desc || '');

function RechargeSection({ navigation, route }: any) {
  const { user } = useAuth();
  const alert = useAlert();
  const alertRef = useRef(alert);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<BillLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<BillLocation | null>(null);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [plansLoading, setPlansLoading] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const params = route?.params || {};
  const operatorId = params.operatorId;
  const formValues = params.formValues || {};
  const primaryValue =
    formValues.utility_acc_no ||
    Object.values(formValues).find((value: any) => String(value || '').trim()) ||
    user?.phone ||
    '';
  const operatorName = params.operatorName || 'Operator';

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return plans;
    }

    return plans.filter((plan) => {
      const searchable = [
        getPlanAmount(plan),
        getPlanValidity(plan),
        getPlanData(plan),
        getPlanDescription(plan),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [plans, searchQuery]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    anim.start();

    return () => {
      anim.stop();
    };
  }, [pulse]);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    let mounted = true;

    const loadLocations = async () => {
      try {
        setLoading(true);
        const list = await fetchBillLocations();

        if (!mounted) {
          return;
        }

        setLocations(list);

        if (params.circleId) {
          const existing = list.find(
            (item) => String(item.operator_location_id) === String(params.circleId)
          );
          if (existing) {
            setSelectedLocation(existing);
          }
        }
      } catch (error: any) {
        alertRef.current.error('Error', error?.message || 'Could not load circles.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      mounted = false;
    };
  }, [params.circleId]);

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      if (!selectedLocation || !primaryValue || !operatorId) {
        setPlans([]);
        return;
      }

      try {
        setPlansLoading(true);
        const response = await fetchRechargePlans(
          String(primaryValue),
          operatorId,
          selectedLocation.operator_location_id
        );

        if (!mounted) {
          return;
        }

        setPlans(response?.data?.plans || []);
      } catch (error: any) {
        setPlans([]);
        alertRef.current.error('Error', error?.message || 'Could not load recharge plans.');
      } finally {
        if (mounted) {
          setPlansLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      mounted = false;
    };
  }, [operatorId, primaryValue, selectedLocation]);

  const handlePlanPress = (plan: RechargePlan) => {
    if (!selectedLocation) {
      alert.warning('Select Circle', 'Please select a circle first.');
      return;
    }

    navigation.navigate('RechargeConfirmationScreen', {
      operatorId,
      operatorName,
      formValues,
      circleId: selectedLocation.operator_location_id,
      circleName: selectedLocation.operator_location_name,
      plan,
    });
  };

  return (
    <ScrollView style={styles.mainContainer} stickyHeaderIndices={[0]}>
      <BBPSHead
        user={{
          name: user?.name || 'User',
          number: String(primaryValue),
          operatorLogo: require('../../assets/Sample/VI_Card.png'),
          type: operatorName,
        }}
        onBackPress={() => navigation.goBack()}
        onChangePress={() => navigation.goBack()}
      />

      <View style={styles.outerContainer}>
        {loading ? (
          <View>
            <View style={styles.headerRow}>
              <SkeletonBox pulse={pulse} width={170} height={20} borderRadius={8} />
              <SkeletonBox pulse={pulse} width={64} height={16} borderRadius={8} />
            </View>

            {[0, 1, 2].map((item) => (
              <View key={`recharge-card-skeleton-${item}`} style={styles.cardWrapper}>
                <View style={styles.cardContainer}>
                  <View style={styles.leftContent}>
                    <SkeletonBox pulse={pulse} width="80%" height={16} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="62%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                  </View>
                  <SkeletonBox pulse={pulse} width={110} height={44} borderRadius={10} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Circle</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.locationScroll}
            >
              {locations.map((item) => {
                const selected =
                  selectedLocation?.operator_location_id === item.operator_location_id;

                return (
                  <TouchableOpacity
                    key={item.operator_location_id}
                    style={[styles.locationChip, selected && styles.locationChipSelected]}
                    onPress={() => setSelectedLocation(item)}
                  >
                    <Text style={[styles.locationChipText, selected && styles.locationChipTextSelected]}>
                      {item.operator_location_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.plansSection}>
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={24} color="#9CA3AF" />
                  <TextInput
                    placeholder="Search a Plan, e.g. 299 or 28 days"
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <View style={styles.tabContainer}>
                <TouchableOpacity style={styles.activeTab}>
                  <Text style={styles.activeTabText}>Recommended Packs</Text>
                  <View style={styles.activeTabUnderline} />
                </TouchableOpacity>
              </View>

              {!selectedLocation ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Select a circle to view plans</Text>
                </View>
              ) : plansLoading ? (
                <View style={styles.loadingPlans}>
                  <ActivityIndicator color="#8665FF" />
                  <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
              ) : filteredPlans.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No recharge plans found</Text>
                </View>
              ) : (
                filteredPlans.map((plan, index) => (
                  <TouchableOpacity
                    key={`${getPlanId(plan) || getPlanAmount(plan)}-${index}`}
                    style={styles.planRow}
                    onPress={() => handlePlanPress(plan)}
                  >
                    <View style={styles.planInfoMain}>
                      <Text style={styles.planPriceText}>Rs {getPlanAmount(plan)}</Text>
                      <View style={styles.planSpecCol}>
                        <Text style={styles.specLabel}>Validity</Text>
                        <Text style={styles.specValue}>{getPlanValidity(plan)}</Text>
                      </View>
                      <View style={styles.planSpecCol}>
                        <Text style={styles.specLabel}>Data</Text>
                        <Text style={styles.specValue}>{getPlanData(plan)}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={30} color="#9CA3AF" />
                    </View>
                    <Text style={styles.planDescription}>{getPlanDescription(plan)}</Text>
                    <View style={styles.planDivider} />
                  </TouchableOpacity>
                ))
              )}
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
  sectionHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  cardWrapper: { paddingHorizontal: 16, marginBottom: 20 },
  cardContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 20, borderWidth: 1, borderColor: '#EDEDED', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  leftContent: { flex: 1 },
  plansSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  locationScroll: {
    paddingHorizontal: 16,
  },
  locationChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  locationChipSelected: {
    borderColor: '#8665FF',
    backgroundColor: '#EEF0FF',
  },
  locationChipText: { color: '#4B5563', fontWeight: '500' },
  locationChipTextSelected: { color: '#5B47A3', fontWeight: '700' },
  searchSection: { paddingHorizontal: 16, marginTop: 10, backgroundColor: '#FFFFFF', paddingTop: 18, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10,
    borderWidth: 1, borderColor: '#D8E3E7', paddingHorizontal: 16, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#000' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 25, paddingHorizontal: 16, backgroundColor: '#FFFFFF' },
  activeTab: { marginRight: 20, paddingBottom: 10 },
  activeTabText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  activeTabUnderline: { height: 3, backgroundColor: '#8665FF', position: 'absolute', bottom: 0, left: 0, right: 0 },
  planRow: { paddingHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF' },
  planInfoMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planPriceText: { fontSize: 22, fontWeight: '800', color: '#111827', width: '28%' },
  planSpecCol: { width: '25%' },
  specLabel: { fontSize: 12, color: '#9CA3AF' },
  specValue: { fontSize: 15, fontWeight: '700', color: '#374151' },
  planDescription: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  planDivider: { height: 1, backgroundColor: '#F3F4F6', marginTop: 15 },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  loadingPlans: { padding: 24, alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 8 },
  skeletonGapSm: { marginTop: 8 },
});

export default RechargeSection;
