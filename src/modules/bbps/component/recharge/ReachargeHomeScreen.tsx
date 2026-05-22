import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Material Vector Icon
import BBPSHead from '../../constatnt/BBPSHead';
// Assets
import jio from '../../assets/Sample/jio.png';
import airtel from '../../assets/Sample/airtel.png';
import vi from '../../assets/Sample/VI_Card.png';
import SkeletonBox from '../../../services/component/constant/SkeletonBox';

const RECHARGE_DATA = [
  { id: '1', name: 'Mr Dipesh Premkumar...', number: '9175334410', status: 'Recharged ₹219 on 17 Jan', icon: vi, type: 'My Number' },
  { id: '2', name: 'Mummy', number: '9175334410', status: 'Recharged ₹219 on 17 Jan', icon: jio, type: 'Recent' },
  { id: '3', name: 'Pappaji', number: '9175334410', status: 'Recharged ₹219 on 17 Jan', icon: airtel, type: 'Recent' },
  { id: '4', name: 'Shubham', number: '9175334410', status: 'Recharged ₹219 on 17 Jan', icon: vi, type: 'Recent' },
];
const CONTACTS = [
  { id: '1', name: 'Kiran', number: '9175334410', color: '#E44321' },
  { id: '2', name: 'Sneha', number: '9175334410', color: '#88B1F3' },
  { id: '3', name: 'Aftab', number: '9175334410', color: '#FCE4EC' },
];

function ReachargeHomeScreen({ navigation }: any) {
  const [mobileNumber, setMobileNumber] = useState('+91 - 91753 34410');
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

  const renderItem = (item: any) => (
    <View key={item.id} style={styles.rechargeItem}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Image source={item.icon} style={styles.providerIcon} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.contactNumber}>{item.number}</Text>
          <Text style={styles.rechargeStatus}>{item.status}</Text>
        </View>
      </View>
      
      <TouchableOpacity
  activeOpacity={0.8}
  onPress={() => navigation.navigate('RechargeSection')}
>
  <LinearGradient
    colors={['#8665FF', '#5B47A3']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.rechargeBtn}
  >
    <Text style={styles.rechargeBtnText}>Recharge</Text>
  </LinearGradient>
</TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <BBPSHead 
        title="Recharge or Pay Mobile Bill" 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View>
            <View style={styles.content}>
              <SkeletonBox pulse={pulse} width="45%" height={14} borderRadius={8} />
              <SkeletonBox pulse={pulse} width="100%" height={55} borderRadius={12} style={styles.skeletonSectionGap} />
            </View>

            <View style={styles.sectionHeader}>
              <SkeletonBox pulse={pulse} width={100} height={16} borderRadius={8} />
            </View>
            <View style={styles.listBackground}>
              <View style={styles.rechargeItem}>
                <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={25} />
                <View style={styles.skeletonTextBlock}>
                  <SkeletonBox pulse={pulse} width="72%" height={14} borderRadius={8} />
                  <SkeletonBox pulse={pulse} width="52%" height={12} borderRadius={8} style={styles.skeletonLineGap} />
                  <SkeletonBox pulse={pulse} width="66%" height={12} borderRadius={8} style={styles.skeletonLineGap} />
                </View>
                <SkeletonBox pulse={pulse} width={92} height={36} borderRadius={8} />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <SkeletonBox pulse={pulse} width={150} height={16} borderRadius={8} />
            </View>
            <View style={styles.listBackground}>
              {[0, 1, 2].map((item) => (
                <View key={`recent-skeleton-${item}`}>
                  <View style={styles.rechargeItem}>
                    <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={25} />
                    <View style={styles.skeletonTextBlock}>
                      <SkeletonBox pulse={pulse} width="72%" height={14} borderRadius={8} />
                      <SkeletonBox pulse={pulse} width="52%" height={12} borderRadius={8} style={styles.skeletonLineGap} />
                      <SkeletonBox pulse={pulse} width="66%" height={12} borderRadius={8} style={styles.skeletonLineGap} />
                    </View>
                    <SkeletonBox pulse={pulse} width={92} height={36} borderRadius={8} />
                  </View>
                  {item < 2 && <View style={styles.separator} />}
                </View>
              ))}
            </View>

            <View style={styles.contactsHeader}>
              <SkeletonBox pulse={pulse} width={90} height={16} borderRadius={8} />
              <SkeletonBox pulse={pulse} width={22} height={22} borderRadius={11} />
            </View>

            <View style={styles.sectionContainer}>
              {[0, 1, 2].map((item) => (
                <View key={`contact-skeleton-${item}`} style={styles.listItem}>
                  <SkeletonBox pulse={pulse} width={45} height={45} borderRadius={22.5} />
                  <View style={styles.itemInfo}>
                    <SkeletonBox pulse={pulse} width="50%" height={14} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="65%" height={12} borderRadius={8} style={styles.skeletonLineGap} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.buttonCenter}>
              <SkeletonBox pulse={pulse} width={180} height={45} borderRadius={10} />
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.content}>
              {/* Input Section */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Enter Mobile Number</Text>
                <View style={styles.operatorRow}>
                  <Image source={jio} style={styles.operatorIcon} />
                  <Image source={airtel} style={styles.operatorIcon} />
                  <Image source={vi} style={styles.operatorIcon} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.contactButton}>
                  <Icon name="notebook-outline" size={26} color="#7F5DF0" />
                </TouchableOpacity>
              </View>
            </View>

            {/* My Number Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Number</Text>
            </View>
            <View style={styles.listBackground}>
              {RECHARGE_DATA.filter(x => x.type === 'My Number').map(renderItem)}
            </View>

            {/* My Recharges & Bill Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Recharges & Bill</Text>
            </View>
            <View style={styles.listBackground}>
              {RECHARGE_DATA.filter(x => x.type === 'Recent').map((item, index, arr) => (
                <View key={item.id}>
                  {renderItem(item)}
                  {index < arr.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
            <View style={styles.contactsHeader}>
              <Text style={styles.contactsTitle}>Contacts</Text>
              <TouchableOpacity>
                <Icon name="magnify" size={22} color="#7F5DF0" />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionContainer}>
              {CONTACTS.map((contact) => (
                <View key={contact.id} style={styles.listItem}>
                  <View style={[styles.avatarCircle, { backgroundColor: contact.color }]} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{contact.name}</Text>
                    <Text style={styles.itemSubText}>{contact.number}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* View All Button with requested Gradient Border style logic */}
            <View style={styles.buttonCenter}>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FF', // Light lavender background
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  operatorRow: {
    flexDirection: 'row',
  },
  operatorIcon: {
    width: 20,
    height: 15,
    marginLeft: 6,
    resizeMode: 'contain',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FCFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1EAEB',
    paddingHorizontal: 15,
    height: 55,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  contactButton: {
    paddingLeft: 10,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textDecorationLine: 'underline',
  },
  listBackground: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
  },
  rechargeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  providerIcon: {
    width: 30,
    height: 30,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  contactNumber: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
  rechargeStatus: {
    fontSize: 12,
    color: '#888',
  },
  rechargeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 60,
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  contactsTitle: { fontSize: 16, fontWeight: '700', color: '#444' },
  buttonCenter: { alignItems: 'center', paddingVertical: 30 },
  viewAllButton: {
    width: 180,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    // Note: Standard RN doesn't support linear-gradient borders directly.
    // We use the primary color from your gradient for the solid border.
    borderColor: '#8665FF', 
  },
  viewAllText: {
    color: '#8665FF',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  operatorCircle: { width: 45, height: 45, borderRadius: 22.5 },
  avatarCircle: { width: 45, height: 45, borderRadius: 22.5 },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemSubText: { fontSize: 13, color: '#888', marginTop: 2 },
  skeletonSectionGap: { marginTop: 12 },
  skeletonTextBlock: { flex: 1, marginLeft: 12, marginRight: 10 },
  skeletonLineGap: { marginTop: 6 },
});

export default ReachargeHomeScreen;