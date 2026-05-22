import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BBPSHead from '../constatnt/BBPSHead'; 
import { fetchBillDetails } from '../api/BillsAPI';
import { useAlert } from '../../ecommerce/components/alerts';

type BillDetailsRouteParams = {
  operatorData?: {
    id?: string;
    name?: string;
  };
  operatorId?: string;
  operatorName?: string;
  categoryName?: string;
};

type BillDetailsScreenProps = {
  route?: {
    params?: BillDetailsRouteParams;
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, any>) => void;
  };
};

const BillDetailsScreen = ({ route, navigation }: BillDetailsScreenProps) => {
  const alert = useAlert();
  const routeParams = route?.params || {};

  // Supports both { operatorData } and flat params from BillerSelectScreen.
  const operatorData = route?.params?.operatorData || { 
    id: String(routeParams.operatorId || '1'),
    name: routeParams.operatorName || 'Mahavitran- Maharashtra (MSEDCL)'
  };
  const categoryName = routeParams?.categoryName || 'Electricity Bill';

  const [consumerNumber, setConsumerNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Home', 'Office', 'Other', 'Shop', 'Farm', 'Clinic'];

  const isConsumerNumberValid = consumerNumber.length === 12;
  const isMobileNumberValid = mobileNumber.length === 10;
  const isContinueDisabled = isLoading || !isConsumerNumberValid || !isMobileNumberValid;

  const validateInputs = () => {
    if (!isConsumerNumberValid) {
      alert.warning('Invalid Input', 'Please enter a valid 12-digit consumer number.');
      return false;
    }

    if (!isMobileNumberValid) {
      alert.warning('Invalid Input', 'Please enter a valid 10-digit mobile number.');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        operator_id: operatorData.id,
        consumer_number: consumerNumber,
        mobile_number: mobileNumber,
      };
      
      const response = await fetchBillDetails(payload);
      console.log('FetchBill Raw Response:', response?.data ?? response);

      const rawMessage = response?.data?.raw?.message;

      if (response?.success !== true || rawMessage === 'No key for Response') {
        alert.warning('Bill Fetch Failed', 'Invalid consumer number or bill not found.');
        return;
      }

      navigation.navigate('PaymentConfirmationScreen', {
        operatorName: operatorData?.name,
        categoryName,
        nickname: selectedCategory,
        formValues: {
          consumer_number: consumerNumber,
          mobile_number: mobileNumber,
        },
        fetchBillData: response,
      });
      
    } catch (error: any) {
      alert.error('Error', error?.message || 'Could not fetch bill details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BBPSHead
        title="Enter Details"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <View style={styles.card}>
          {/* Provider Header */}
          <View style={styles.providerSection}>
            <View style={styles.logoCircle}>
              <Icon name="flash" size={24} color="#E31E24" />
            </View>
            {/* Added optional chaining here just in case */}
            <Text style={styles.providerName}>{operatorData?.name}</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Consumer Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 12 Digit Consumer Number"
              placeholderTextColor="#AAA"
              keyboardType="numeric"
              maxLength={12}
              value={consumerNumber}
              onChangeText={(value) => setConsumerNumber(value.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.helperText}>Enter 12 Digit Consumer Number</Text>

            <Text style={[styles.label, styles.mobileLabel]}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10 Digit Mobile Number"
              placeholderTextColor="#AAA"
              keyboardType="numeric"
              maxLength={10}
              value={mobileNumber}
              onChangeText={(value) => setMobileNumber(value.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.helperText}>Enter registered 10 digit mobile number</Text>
          </View>

          {/* DYNAMIC HORIZONTAL SLIDER */}
          <View style={styles.nicknameWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              // This is crucial for the slider spacing
              contentContainerStyle={styles.scrollPadding} 
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    selectedCategory === item && styles.selectedChip
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedCategory === item && styles.selectedChipText
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity style={styles.addNicknameBtn}>
                <Icon name="plus" size={16} color="#555" />
                <Text style={styles.addNicknameText}>Add Nickname</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Continue Button with Gradient */}
        <TouchableOpacity 
          onPress={handleContinue} 
          disabled={isContinueDisabled}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.button, isContinueDisabled && styles.disabledBtn]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 20,
    overflow: 'hidden', // Keeps the nickname slider background inside the card radius
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerName: { fontSize: 15, fontWeight: '500', color: '#333', flex: 1 },
  inputWrapper: { paddingHorizontal: 20, marginBottom: 15 },
  label: { fontSize: 13, color: '#666', marginBottom: 5 },
  mobileLabel: { marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  helperText: { fontSize: 11, color: '#999', marginTop: 5 },
  nicknameWrapper: {
    backgroundColor: '#EEF0FF', // The light purple background from the image
    paddingVertical: 15,
  },
  scrollPadding: { 
    paddingHorizontal: 20,
    alignItems: 'center' 
  },
  chip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    elevation: 1, // Slight shadow for the chips
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedChip: { 
    borderColor: '#8665FF',
    backgroundColor: '#FFF' 
  },
  chipText: { fontSize: 14, color: '#555' },
  selectedChipText: { color: '#8665FF', fontWeight: 'bold' },
  addNicknameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#AAA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  addNicknameText: { fontSize: 14, color: '#555', marginLeft: 4 },
  button: {
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});

export default BillDetailsScreen;