import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BBPSHead from '../constatnt/BBPSHead';
import {
  fetchBill,
  fetchOperatorDetails,
  OperatorDetails,
  OperatorField,
} from '../api/BillsAPI';
import { useAlert } from '../../ecommerce/components/alerts';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { useAuth } from '../../common/auth/context/AuthContext';

type BillDetailsRouteParams = {
  operatorData?: {
    id?: string;
    name?: string;
  };
  operatorId?: string | number;
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

type FormValues = Record<string, string>;

const getFieldMaxLength = (regex?: string) => {
  const match = regex?.match(/\{(\d+)\}/);
  return match ? Number(match[1]) : undefined;
};

const isNumericField = (field: OperatorField) =>
  field.param_type?.toLowerCase() === 'numeric';

const sanitizeFieldValue = (value: string, field: OperatorField) => {
  if (isNumericField(field)) {
    return value.replace(/[^0-9]/g, '');
  }

  return value;
};

const isUserInputField = (field: OperatorField) =>
  Boolean(field?.param_name && field?.param_label) &&
  field.param_name !== 'recharge_plan_id';

const BillDetailsScreen = ({ route, navigation }: BillDetailsScreenProps) => {
  const alert = useAlert();
  const alertRef = useRef(alert);
  const { user } = useAuth();
  const routeParams = route?.params || {};
  const pulse = useRef(new Animated.Value(0)).current;

  const operatorData = routeParams.operatorData || {
    id: String(routeParams.operatorId || ''),
    name: routeParams.operatorName || 'Biller',
  };
  const operatorId = Number(operatorData.id || routeParams.operatorId);
  const categoryName = routeParams?.categoryName || 'Electricity Bill';

  const [operatorDetails, setOperatorDetails] = useState<OperatorDetails | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const [isLoading, setIsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const categories = ['Home', 'Office', 'Other', 'Shop', 'Farm', 'Clinic'];
  const fields = useMemo(
    () => (operatorDetails?.data || []).filter(isUserInputField),
    [operatorDetails?.data]
  );
  const providerName =
    operatorDetails?.operator_name || operatorData?.name || routeParams.operatorName || 'Biller';
  const loggedInUserName = user?.name || 'Customer';
  const isBillFetchSupported = operatorDetails?.fetchBill === 1;
  const isContinueDisabled =
    detailsLoading ||
    isLoading ||
    fields.length === 0 ||
    fields.some((field) => !formValues[field.param_name]?.trim());

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

    const loadOperatorDetails = async () => {
      if (!Number.isFinite(operatorId) || operatorId <= 0) {
        setDetailsLoading(false);
        alertRef.current.warning('Invalid Biller', 'Biller details are missing. Please select a biller again.');
        return;
      }

      try {
        setDetailsLoading(true);
        const details = await fetchOperatorDetails(operatorId);

        if (!mounted) {
          return;
        }

        setOperatorDetails(details);
        console.log('Operator Details:', details);
        const initialValues = (details.data || []).filter(isUserInputField).reduce<FormValues>((values, field) => {
          if (field?.param_name) {
            values[field.param_name] = '';
          }
          return values;
        }, {});
        setFormValues(initialValues);
      } catch (error: any) {
        if (!mounted) {
          return;
        }

        setOperatorDetails(null);
        setFormValues({});
        alertRef.current.error(
          'Error',
          error?.message || 'Could not load biller details. Please try again.'
        );
      } finally {
        if (mounted) {
          setDetailsLoading(false);
        }
      }
    };

    loadOperatorDetails();

    return () => {
      mounted = false;
    };
  }, [operatorId]);

  const updateFieldValue = (field: OperatorField, value: string) => {
    setFormValues((current) => ({
      ...current,
      [field.param_name]: sanitizeFieldValue(value, field),
    }));
  };

  const validateInputs = () => {
    if (fields.length === 0) {
      alert.warning('Details Missing', 'No biller fields are available. Please try again.');
      return false;
    }

    for (const field of fields) {
      const value = formValues[field.param_name]?.trim() || '';

      if (!value) {
        alert.warning('Invalid Input', field.error_message || `Please enter ${field.param_label}.`);
        return false;
      }

      try {
        const regex = new RegExp(field.regex);
        if (!regex.test(value)) {
          alert.warning('Invalid Input', field.error_message || `Please enter valid ${field.param_label}.`);
          return false;
        }
      } catch {
        console.warn('Invalid operator field regex:', field.regex);
      }
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateInputs()) {
      return;
    }

    console.log('Operator Details:', operatorDetails);
    console.log('Form Values:', formValues);

    setIsLoading(true);
    try {
      const payload = {
        sender_name: loggedInUserName,
        operator_id: String(operatorId),
        ...formValues,
        ...(!formValues.confirmation_mobile_no && user?.phone
          ? { confirmation_mobile_no: user.phone }
          : {}),
      };

      if (!isBillFetchSupported) {
        navigation.navigate('RechargePlanScreen', {
          operatorId,
          operatorName: providerName,
          categoryName,
          formValues,
        });
        return;
      }

      console.log('Fetch Bill Payload:', payload);
      const response = await fetchBill(payload);
      console.log('Fetch Bill Response:', response);

      if (!response?.success) {
        alert.warning(
          'Bill Fetch Failed',
          response?.message || 'Unable to fetch bill details'
        );
        return;
      }

      navigation.navigate('PaymentConfirmationScreen', {
        operatorName: providerName,
        categoryName,
        nickname: selectedCategory,
        formValues,
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
          <View style={styles.providerSection}>
            {detailsLoading ? (
              <>
                <SkeletonBox pulse={pulse} width={45} height={45} borderRadius={25} />
                <View style={styles.providerSkeletonText}>
                  <SkeletonBox pulse={pulse} width="85%" height={15} borderRadius={8} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.logoCircle}>
                  <Icon name="flash" size={24} color="#E31E24" />
                </View>
                <Text style={styles.providerName}>{providerName}</Text>
              </>
            )}
          </View>

          <View style={styles.inputWrapper}>
            {detailsLoading ? (
              <>
                {[0, 1].map((item) => (
                  <View key={`field-skeleton-${item}`} style={item > 0 && styles.mobileLabel}>
                    <SkeletonBox pulse={pulse} width={120} height={13} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="100%" height={50} borderRadius={8} style={styles.skeletonInputGap} />
                    <SkeletonBox pulse={pulse} width="70%" height={11} borderRadius={8} style={styles.skeletonInputGap} />
                  </View>
                ))}
              </>
            ) : (
              fields.map((field, index) => {
                const maxLength = getFieldMaxLength(field.regex);

                return (
                  <View key={field.param_id || field.param_name} style={index > 0 && styles.mobileLabel}>
                    <Text style={styles.label}>{field.param_label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter ${field.param_label}`}
                      placeholderTextColor="#AAA"
                      keyboardType={isNumericField(field) ? 'numeric' : 'default'}
                      maxLength={maxLength}
                      value={formValues[field.param_name] || ''}
                      onChangeText={(value) => updateFieldValue(field, value)}
                    />
                    <Text style={styles.helperText}>
                      {field.error_message || `Enter ${field.param_label}`}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.nicknameWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollPadding}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    selectedCategory === item && styles.selectedChip,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === item && styles.selectedChipText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addNicknameBtn}>
                <Icon name="plus" size={16} color="#555" />
                <Text style={styles.addNicknameText}>Add Nickname</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

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
    overflow: 'hidden',
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
  providerSkeletonText: { flex: 1, marginLeft: 12 },
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
  skeletonInputGap: { marginTop: 8 },
  nicknameWrapper: {
    backgroundColor: '#EEF0FF',
    paddingVertical: 15,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedChip: {
    borderColor: '#8665FF',
    backgroundColor: '#FFF',
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
