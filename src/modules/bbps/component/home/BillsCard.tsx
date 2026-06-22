import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
// Sample assets mapping based on your imports
import bill1 from '../../assets/Sample/HDFC.png';
import bill2 from '../../assets/Sample/SBI_card.png';
import bill3 from '../../assets/Sample/VI_Card.png';

const BILL_DATA = [
  {
    id: '1',
    title: 'HDFC Life Insurance',
    subtitle: 'Insurance 74839943',
    amount: '₹0.00',
    // status: 'Overdue by 28 days',
    statusColor: '#FF5A5F',
    logo: bill1,
  },
  {
    id: '2',
    title: 'Vi Prepaid',
    subtitle: 'Mobile Recharge 9302930293',
    amount: '₹0.00',
    // status: 'Due in 3 days',
    statusColor: '#A5A500', // Olive/Gold color
    logo: bill3,
  },
  {
    id: '3',
    title: 'SBI Credit Card',
    subtitle: 'Credit Card 3829 8291 8291',
    amount: '₹0.00',
    status: 'Pay Now',
    statusColor: '#00A86B',
    logo: bill2,
  },
];

const BillItem = ({ item, isLast, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.billItemContainer, !isLast && styles.borderBottom]}
  >
    <View style={styles.leftRow}>
      <View style={styles.logoContainer}>
        <Image source={item.logo} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.details}>
        <Text style={styles.billTitle}>{item.title}</Text>
        <Text style={styles.billSubtitle}>{item.subtitle}</Text>
        <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
      </View>
    </View>
    <Text style={styles.amountText}>{item.amount}</Text>
  </TouchableOpacity>
);

const BillsCard = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Bills</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ReachargeHomeScreen')}>
          {/* MASKED VIEW FOR GRADIENT TEXT */}
          <MaskedView
            maskElement={
              <Text style={[styles.viewMoreText, { backgroundColor: 'transparent' }]}>
                View More
              </Text>
            }>
            <LinearGradient
              colors={['#8665FF', '#5B47A3']} // Gradient from 100% to 0% as per your 270deg
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.gradientBox}
            >
              <Text style={[styles.viewMoreText, { opacity: 0 }]}>View More</Text>
            </LinearGradient>
          </MaskedView>
        </TouchableOpacity>
      </View>

      {BILL_DATA.map((item, index) => (
        <BillItem 
          key={item.id} 
          item={item} 
          isLast={index === BILL_DATA.length - 1}
          onPress={() => navigation.navigate('RechargeSection')}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
 viewMoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gradientBox: {
    flexDirection: 'row',
  },
  billItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftRow: {
    flexDirection: 'row',
    flex: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: {
    width: 30,
    height: 30,
  },
  details: {
    justifyContent: 'center',
    flex: 1,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  billSubtitle: {
    fontSize: 13,
    color: '#888',
    marginVertical: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
});

export default BillsCard;