import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Asset Imports
import Recharge from '../../assets/BBPS_Service/Recharge.png';
import DTH from '../../assets/BBPS_Service/DTH.png';
import Subscriptions from '../../assets/BBPS_Service/Subscriptions.png';
import FASTagRecharge from '../../assets/BBPS_Service/FASTag Recharge.png';
import Electricity from '../../assets/BBPS_Service/Electricity.png';
import water from '../../assets/BBPS_Service/Water.png';
import PipedGas from '../../assets/BBPS_Service/solid.png';
import LPGCylender from '../../assets/BBPS_Service/LPG.png';
import Landline from '../../assets/BBPS_Service/LandLine.png';
import Broadband from '../../assets/BBPS_Service/Broadband.png';
import MobilePostpaid from '../../assets/BBPS_Service/Recharge.png';
import Credit from '../../assets/BBPS_Service/Creadit.png';
import Loan from '../../assets/BBPS_Service/Loan_Emi.png';
import Insurance from '../../assets/BBPS_Service/Insurance.png';
import Tax from '../../assets/BBPS_Service/Tax.png';
import Housing from '../../assets/BBPS_Service/Housing_Socity.png';
import Municipal from '../../assets/BBPS_Service/Munsiple_taxes.png';
import Education from '../../assets/BBPS_Service/Education.png';
import Hospital from '../../assets/BBPS_Service/Hospital_bill.png';
import Balance from '../../assets/BBPS_Service/Balance.png';
import { BillCategory, fetchBillsCategories } from '../../api/BillsAPI';

const ServiceItem = ({ icon, label, onPress }: { icon: any; label: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.itemContainer} activeOpacity={0.75} onPress={onPress}>
    <LinearGradient
      colors={['#8665FF', '#5B47A3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.iconCircle}
    >
      <Image source={icon} style={styles.iconImage} resizeMode="contain" />
    </LinearGradient>
    <Text style={styles.itemLabel}>{label}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SECTION_ORDER = [
  'RECHARGES',
  'UTILITIES',
  'FINANCIAL SERVICES',
  'HOUSING, EDUCATION & HEALTH',
  'OTHER SERVICES',
] as const;

type SectionName = (typeof SECTION_ORDER)[number];

const CATEGORY_DISPLAY_ORDER: Record<SectionName, string[]> = {
  RECHARGES: ['Mobile Prepaid', 'DTH', 'Subscription', 'FASTag'],
  UTILITIES: [
    'Electricity',
    'Water',
    'Gas',
    'LPG Cylinder',
    'Landline Postpaid',
    'Broadband Postpaid',
    'Mobile Postpaid',
  ],
  'FINANCIAL SERVICES': ['Credit Card', 'Loan', 'Insurance', 'Tax'],
  'HOUSING, EDUCATION & HEALTH': ['Housing Society', 'Municipal Taxes', 'Education', 'Hospital'],
  'OTHER SERVICES': [
    'Clubs and Associations',
    'Cable TV',
    'Municipal Services',
    'Rental Payment',
    'eChallan',
    'Agent Collection',
    'Fleet Card Recharge',
    'EV Recharge',
  ],
};

const CATEGORY_GROUPS: Record<string, SectionName> = Object.entries(CATEGORY_DISPLAY_ORDER).reduce(
  (acc, [section, names]) => {
    names.forEach((name) => {
      acc[name] = section as SectionName;
    });
    return acc;
  },
  {} as Record<string, SectionName>,
);

const ICON_MAP: Record<string, any> = {
  'Mobile Prepaid': Recharge,
  DTH,
  Subscription: Subscriptions,
  Subscriptions,
  FASTag: FASTagRecharge,
  'Fleet Card Recharge': FASTagRecharge,
  'EV Recharge': FASTagRecharge,
  'Cable TV': Subscriptions,

  Electricity,
  Water: water,
  Gas: PipedGas,
  'LPG Cylinder': LPGCylender,
  'Broadband Postpaid': Broadband,
  'Landline Postpaid': Landline,
  'Mobile Postpaid': MobilePostpaid,

  'Credit Card': Credit,
  Loan,
  Insurance,
  Tax,


  'Housing Society': Housing,
  Education,
  Hospital,
  'Municipal Taxes': Municipal,
  'Municipal Services': Municipal,
  'Rental Payment': Housing,
  eChallan: Tax,
  'Agent Collection': Balance,
  'Clubs and Associations': Subscriptions,
};

const FALLBACK_ICON = Recharge;

const normalizeCategoryName = (name?: string) => String(name || '').trim();

const getCategorySection = (name: string): SectionName => {
  const knownSection = CATEGORY_GROUPS[name];
  if (knownSection) {
    return knownSection;
  }

  const lower = name.toLowerCase();

  if (
    lower.includes('mobile') ||
    lower.includes('dth') ||
    lower.includes('fastag') ||
    lower.includes('recharge') ||
    lower.includes('cable') ||
    lower.includes('subscription')
  ) {
    return 'RECHARGES';
  }

  if (
    lower.includes('electric') ||
    lower.includes('water') ||
    lower.includes('gas') ||
    lower.includes('landline') ||
    lower.includes('broadband') ||
    lower.includes('lpg')
  ) {
    return 'UTILITIES';
  }

  if (
    lower.includes('credit') ||
    lower.includes('loan') ||
    lower.includes('insurance') ||
    lower.includes('tax') ||
    lower.includes('challan')
  ) {
    return 'FINANCIAL SERVICES';
  }

  if (
    lower.includes('housing') ||
    lower.includes('municipal') ||
    lower.includes('education') ||
    lower.includes('hospital') ||
    lower.includes('rental')
  ) {
    return 'HOUSING, EDUCATION & HEALTH';
  }

  return 'OTHER SERVICES';
};

const categoryRank = (section: SectionName, name: string) => {
  const index = CATEGORY_DISPLAY_ORDER[section].indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const RechargeBillSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [shimmerAnim]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonTitle, { opacity: shimmerAnim }]} />
      <Animated.View style={[styles.skeletonSearch, { opacity: shimmerAnim }]} />

      {[0, 1].map((section) => (
        <View key={section}>
          <Animated.View style={[styles.skeletonSectionHeader, { opacity: shimmerAnim }]} />
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((item) => (
              <View style={styles.itemContainer} key={item}>
                <Animated.View style={[styles.skeletonCircle, { opacity: shimmerAnim }]} />
                <Animated.View style={[styles.skeletonLabel, { opacity: shimmerAnim }]} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

function RechargeBill() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBillsCategories();
        setCategories(data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const groupedData = useMemo(() => {
    const baseGroups: Record<SectionName, BillCategory[]> = {
      RECHARGES: [],
      UTILITIES: [],
      'FINANCIAL SERVICES': [],
      'HOUSING, EDUCATION & HEALTH': [],
      'OTHER SERVICES': [],
    };

    categories.forEach((item) => {
      if (String(item?.status) !== '1') {
        return;
      }

      const categoryName = normalizeCategoryName(item.operator_category_name);
      if (!categoryName) {
        return;
      }

      const section = getCategorySection(categoryName);
      baseGroups[section].push({
        ...item,
        operator_category_name: categoryName,
      });
    });

    SECTION_ORDER.forEach((section) => {
      baseGroups[section].sort((a, b) => {
        const rankDiff =
          categoryRank(section, a.operator_category_name) -
          categoryRank(section, b.operator_category_name);

        if (rankDiff !== 0) {
          return rankDiff;
        }

        return a.operator_category_id - b.operator_category_id;
      });
    });

    return baseGroups;
  }, [categories]);

  if (loading) {
    return <RechargeBillSkeleton />;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.mainTitle}>Recharge and Bills</Text>
      

      {SECTION_ORDER.map((section) => {
        if (groupedData[section].length === 0) {
          return null;
        }

        return (
          <View key={section}>
            <SectionHeader title={section} />
            <View style={styles.grid}>
              {groupedData[section].map((item) => (
                <ServiceItem
                  key={item.operator_category_id}
                  icon={ICON_MAP[item.operator_category_name] || FALLBACK_ICON}
                  label={item.operator_category_name}
                  onPress={() =>
                    navigation.navigate('BillerSelectScreen', {
                      categoryId: item.operator_category_id,
                      categoryName: item.operator_category_name,
                    })
                  }
                />
              ))}
            </View>
          </View>
        );
      })}

      {!SECTION_ORDER.some((section) => groupedData[section].length > 0) && (
        <Text style={styles.emptyText}>No categories found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#111827',
    marginBottom: 6,
    backgroundColor: '#FAFAFC',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 14,
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconImage: {
    width: 30,
    height: 30,
    tintColor: '#FFFFFF',
  },
  itemLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 15,
  },
  emptyText: {
    marginTop: 18,
    marginBottom: 4,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  skeletonTitle: {
    height: 22,
    width: 180,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  skeletonSearch: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  skeletonSectionHeader: {
    height: 12,
    width: 130,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginTop: 16,
    marginBottom: 14,
  },
  skeletonCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E5E7EB',
  },
  skeletonLabel: {
    width: 54,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginTop: 9,
  },
});

export default RechargeBill;
