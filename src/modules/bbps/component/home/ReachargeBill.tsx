import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SvgProps } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Asset Imports
import Recharge from '../../assets/BBPS_Service/Recharge.svg';
import DTH from '../../assets/BBPS_Service/DTH.svg';
import Subscriptions from '../../assets/BBPS_Service/Subscriptions.svg';
import FASTagRecharge from '../../assets/BBPS_Service/FASTagRecharge.svg';
import Electricity from '../../assets/BBPS_Service/Electricity.svg';
import water from '../../assets/BBPS_Service/Water.svg';
import PipedGas from '../../assets/BBPS_Service/solid.svg';
import LPGCylender from '../../assets/BBPS_Service/LPG.svg';
import Landline from '../../assets/BBPS_Service/LandLine.svg';
import Broadband from '../../assets/BBPS_Service/Broadband.svg';
import MobilePostpaid from '../../assets/BBPS_Service/Recharge.svg';
import Credit from '../../assets/BBPS_Service/Creadit.svg';
import Loan from '../../assets/BBPS_Service/Loan_Emi.svg';
import Insurance from '../../assets/BBPS_Service/Insurance.svg';
import Tax from '../../assets/BBPS_Service/Tax.svg';
import Housing from '../../assets/BBPS_Service/Housing_Socity.svg';
import Municipal from '../../assets/BBPS_Service/Munsiple_taxes.svg';
import Education from '../../assets/BBPS_Service/Education.svg';
import Hospital from '../../assets/BBPS_Service/Hospital_bill.svg';
import { BillCategory, fetchBillsCategories } from '../../api/BillsAPI';

type RasterIcon = number;
type SvgIconComponent = React.FC<SvgProps>;
type VectorIconAsset = {
  type: 'vector';
  name: string;
};
type IconAsset = RasterIcon | SvgIconComponent | VectorIconAsset;
const isImageIcon = (icon: IconAsset): icon is RasterIcon => typeof icon === 'number';
const isVectorIcon = (icon: IconAsset): icon is VectorIconAsset =>
  typeof icon === 'object' && icon !== null && 'type' in icon && icon.type === 'vector';
const isSvgIcon = (icon: IconAsset): icon is SvgIconComponent =>
  typeof icon === 'function' && !isVectorIcon(icon);

const ServiceItem = ({ icon, label, onPress }: { icon: IconAsset; label: string; onPress?: () => void }) => {
  const SvgIcon = isSvgIcon(icon) ? icon : null;

  return (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.75} onPress={onPress}>
      <LinearGradient
        colors={['#8665FF', '#5B47A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.iconCircle}
      >
        {SvgIcon ? (
          <SvgIcon width={30} height={30} />
        ) : isVectorIcon(icon) ? (
          <MaterialCommunityIcons name={icon.name} size={28} color="#FFFFFF" />
        ) : isImageIcon(icon) ? (
          <Image source={icon} style={styles.iconImage} resizeMode="contain" />
        ) : null}
      </LinearGradient>
      <Text style={styles.itemLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

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

const ICON_MAP: Record<string, IconAsset> = {
  'Mobile Prepaid': Recharge,
  DTH,
  Subscription: Subscriptions,
  Subscriptions,
  FASTag: FASTagRecharge,
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
  eChallan: { type: 'vector', name: 'file-document-outline' },
  'Agent Collection': { type: 'vector', name: 'account-cash-outline' },
  'Fleet Card Recharge': { type: 'vector', name: 'card-account-details-outline' },
  'EV Recharge': { type: 'vector', name: 'ev-station' },
  'Clubs and Associations': Subscriptions,
};

const FALLBACK_ICON: IconAsset = Recharge;

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
    <View style={styles.container}>
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
    <View style={styles.container}>
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
  container: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
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
    fontSize: 14,
    
    fontWeight: '700',
    color: 'black',
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
