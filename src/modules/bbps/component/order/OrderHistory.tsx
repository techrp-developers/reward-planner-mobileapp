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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// Asset Imports
import jio from '../../assets/Sample/jio.png';
import airtel from '../../assets/Sample/airtel.png';
import vi from '../../assets/Sample/VI_Card.png';
import bill1 from '../../assets/Sample/HDFC.png';
import bill2 from '../../assets/Sample/SBI_card.png';
import BBPSHead from '../../constatnt/BBPSHead';
import SkeletonBox from '../../../services/component/constant/SkeletonBox';

type OrderItemProps = {
  icon: any;
  title: string;
  id: string;
  amount: string;
  status: string;
  date: string;
  isFailed?: boolean;
  showRepeat?: boolean;
};

const OrderItem = ({ icon, title, id, amount, status, date, isFailed = false, showRepeat = false }: OrderItemProps) => (
  <View style={styles.orderCard}>
    <View style={styles.orderInfoRow}>
      <Image source={icon} style={styles.operatorLogo} resizeMode="contain" />
      <View style={styles.orderTextContent}>
        <Text style={styles.orderTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.orderId}>{id}</Text>
        <Text style={[styles.orderStatus, isFailed ? styles.orderStatusFailed : styles.orderStatusSuccess]}>
          ₹{amount}, {status}
        </Text>
        <Text style={styles.orderDate}>{date}</Text>
      </View>
      
      {showRepeat && (
        <TouchableOpacity activeOpacity={0.7}>
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBorder}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.repeatText}>Repeat</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const januaryOrders: OrderItemProps[] = [
  {
    icon: vi,
    title: 'Recharge of VI Mobile',
    id: '9175334410',
    amount: '249',
    status: 'Your order is successful',
    date: '23 Jan 2026, 7:34 PM',
    showRepeat: true,
  },
  {
    icon: bill1,
    title: 'Groww',
    id: 'Payment',
    amount: '5490',
    status: 'Failed',
    date: '22 Jan 2026, 5:34 PM',
    isFailed: true,
  },
  {
    icon: bill2,
    title: 'DTH Recharge of',
    id: '736263728',
    amount: '446',
    status: 'Your order is Failed',
    date: '16 Jan 2026, 9:23 PM',
    isFailed: true,
  },
  {
    icon: jio,
    title: 'Recharge of VI Mobile',
    id: '7293334410',
    amount: '549',
    status: 'Your order is successful',
    date: '22 Jan 2026, 5:34 PM',
    showRepeat: true,
  },
];

const decemberOrders: OrderItemProps[] = [
  {
    icon: vi,
    title: 'Recharge of VI Mobile',
    id: '9175334410',
    amount: '249',
    status: 'Your order is successful',
    date: '23 Jan 2026, 7:34 PM',
    showRepeat: true,
  },
  {
    icon: jio,
    title: 'Recharge of VI Mobile',
    id: '7293334410',
    amount: '549',
    status: 'Your order is successful',
    date: '22 Jan 2026, 5:34 PM',
    showRepeat: true,
  },
  {
    icon: airtel,
    title: 'DTH Recharge of',
    id: '736263728',
    amount: '446',
    status: 'Your order is successful',
    date: '16 Jan 2026, 9:23 PM',
  },
];

function OrderHistory({ navigation }: any) {
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
    <View style={styles.container}>
      <BBPSHead
        title="My Orders"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={22} color="#6B7280" />
            <TextInput
              placeholder="Search transactions"
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>January 2026</Text>
          <Text style={styles.monthTotal}>₹1,244</Text>
        </View>

        {loading ? (
          <View>
            {[0, 1, 2].map((item) => (
              <View key={`jan-skeleton-${item}`} style={styles.orderCard}>
                <View style={styles.orderInfoRow}>
                  <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={25} />
                  <View style={styles.skeletonTextWrap}>
                    <SkeletonBox pulse={pulse} width="72%" height={14} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="48%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                    <SkeletonBox pulse={pulse} width="84%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                    <SkeletonBox pulse={pulse} width="55%" height={11} borderRadius={8} style={styles.skeletonGapSm} />
                  </View>
                  <SkeletonBox pulse={pulse} width={78} height={36} borderRadius={8} />
                </View>
              </View>
            ))}

            <View style={styles.monthHeader}>
              <Text style={styles.monthText}>December 2025</Text>
              <Text style={styles.monthTotal}>₹1,244</Text>
            </View>

            {[0, 1].map((item) => (
              <View key={`dec-skeleton-${item}`} style={styles.orderCard}>
                <View style={styles.orderInfoRow}>
                  <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={25} />
                  <View style={styles.skeletonTextWrap}>
                    <SkeletonBox pulse={pulse} width="72%" height={14} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="48%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                    <SkeletonBox pulse={pulse} width="84%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                    <SkeletonBox pulse={pulse} width="55%" height={11} borderRadius={8} style={styles.skeletonGapSm} />
                  </View>
                  <SkeletonBox pulse={pulse} width={78} height={36} borderRadius={8} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {januaryOrders.map(order => (
              <OrderItem
                key={`${order.id}-${order.date}`}
                icon={order.icon}
                title={order.title}
                id={order.id}
                amount={order.amount}
                status={order.status}
                date={order.date}
                isFailed={order.isFailed}
                showRepeat={order.showRepeat}
              />
            ))}

            <View style={styles.monthHeader}>
              <Text style={styles.monthText}>December 2025</Text>
              <Text style={styles.monthTotal}>₹1,244</Text>
            </View>

            {decemberOrders.map(order => (
              <OrderItem
                key={`${order.id}-${order.date}`}
                icon={order.icon}
                title={order.title}
                id={order.id}
                amount={order.amount}
                status={order.status}
                date={order.date}
                isFailed={order.isFailed}
                showRepeat={order.showRepeat}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF' },
  
  searchSection: { backgroundColor: '#FFFFFF', paddingBottom: 15 },
  searchBarWrapper: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginTop: 15, 
    alignItems: 'center' 
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 50,
    marginRight: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#000' },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EEF0FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  monthText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  monthTotal: { fontSize: 16, fontWeight: '700', color: '#111827' },

  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center' },
  skeletonTextWrap: { flex: 1, marginLeft: 15, marginRight: 10 },
  skeletonGapSm: { marginTop: 6 },
  operatorLogo: { width: 50, height: 50, borderRadius: 25 },
  orderTextContent: { flex: 1, marginLeft: 15 },
  orderTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  orderId: { fontSize: 14, color: '#6B7280', marginVertical: 2 },
  orderStatus: { fontSize: 13, fontWeight: '600' },
  orderStatusSuccess: { color: '#16A34A' },
  orderStatusFailed: { color: '#F97316' },
  orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  // Gradient Border Button Implementation
  gradientBorder: {
    padding: 1,
    borderRadius: 8,
    minWidth: 80,
  },
  buttonInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8665FF',
  },
  bottomSpacing: { height: 14 },
});

export default OrderHistory;