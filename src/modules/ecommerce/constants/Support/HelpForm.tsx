import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  launchImageLibrary,
  type Asset as PickerAsset,
} from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  createSupportTicket,
  fetchSupportCategories,
  fetchSupportRecentOrders,
  SupportCategory,
  SupportRecentEcommerceOrder,
  SupportRecentServiceOrder,
} from '../../api/SupportApi';
import { useAlert } from '../../components/alerts';
import type { AppStackParamList } from '../../../../navigation/RootNavigator';
import { useAppTheme } from '../../../../theme/ThemeContext';

type HelpFormProps = NativeStackScreenProps<AppStackParamList, 'HelpForm'>;

type SupportModuleOption = {
  key: string;
  label: string;
};

type SupportOrderOption = {
  id: number;
  ref: string;
  label: string;
  subtitle?: string;
  productId?: number;
  productName?: string;
};

type SupportAttachment = PickerAsset & {
  uri: string;
};

const DEFAULT_MODULE_OPTIONS: SupportModuleOption[] = [
  { key: 'other', label: 'Other' },
];

const SERVICE_PRODUCT_MODULE_OPTIONS: SupportModuleOption[] = [
  { key: 'product', label: 'Product' },
  { key: 'service', label: 'Service' },
];

const PROFILE_MODULE_OPTIONS: SupportModuleOption[] = [
  { key: 'profile', label: 'Profile' },
];

const normalizeValue = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

const getModuleOptionsForCategory = (
  category: SupportCategory | null,
): SupportModuleOption[] => {
  const categoryName = normalizeValue(category?.name);

  if (
    categoryName.includes('order') ||
    categoryName.includes('payment') ||
    categoryName.includes('refund') ||
    categoryName.includes('technical')
  ) {
    return SERVICE_PRODUCT_MODULE_OPTIONS;
  }

  if (
    categoryName.includes('account') ||
    categoryName.includes('wallet') ||
    categoryName.includes('reward') ||
    categoryName.includes('step')
  ) {
    return PROFILE_MODULE_OPTIONS;
  }

  if (categoryName.includes('other')) {
    return DEFAULT_MODULE_OPTIONS;
  }

  return DEFAULT_MODULE_OPTIONS;
};

const buildTicketSubject = ({
  category,
  moduleOption,
  order,
}: {
  category: SupportCategory;
  moduleOption: SupportModuleOption;
  order: SupportOrderOption | null;
}) => {
  const parts = [category.name, moduleOption.label];

  if (order?.ref) {
    parts.push(order.ref);
  } else if (order?.id) {
    parts.push(`Order #${order.id}`);
  }

  return parts.join(' - ');
};

const moduleRequiresOrder = (moduleOption: SupportModuleOption | null) =>
  moduleOption?.key === 'product' || moduleOption?.key === 'service';

const mapEcommerceOrdersToOptions = (
  orders: SupportRecentEcommerceOrder[],
): SupportOrderOption[] =>
  orders
    .flatMap(order => {
      const orderRef = String(order.order_ref || `Order #${order.order_id}`).trim();

      if (!order.items.length) {
        return [
          {
            id: order.order_id,
            ref: orderRef,
            label: orderRef,
            subtitle: orderRef,
          },
        ];
      }

      return order.items.map(item => ({
        id: order.order_id,
        ref: orderRef,
        label:
          String(item.product_name || item.brand_name || orderRef).trim() ||
          orderRef,
        subtitle: orderRef,
        productId: item.product_id,
        productName: item.product_name
          ? String(item.product_name).trim()
          : undefined,
      }));
    })
    .slice(0, 5);

const mapServiceOrdersToOptions = (
  orders: SupportRecentServiceOrder[],
): SupportOrderOption[] =>
  orders.map(order => ({
    id: order.id,
    ref: String(order.order_ref || `Service #${order.id}`).trim(),
    label:
      [order.service_name, order.variant_name].filter(Boolean).join(' - ') ||
      `Service #${order.id}`,
    subtitle: String(order.order_ref || `Service #${order.id}`).trim(),
  }));

function SelectField({
  label,
  value,
  placeholder,
  icon,
  isDark,
  themePrimary,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  value?: string;
  placeholder: string;
  icon: string;
  isDark: boolean;
  themePrimary: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Text style={[styles.label, isDark && darkStyles.primaryText]}>
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.inputWrap, isDark && darkStyles.inputWrap]}
        onPress={onToggle}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={isDark ? '#A1A1AA' : '#999'}
          style={styles.inputIcon}
        />

        <Text
          style={[
            styles.dropdownText,
            isDark && darkStyles.inputText,
            !value && styles.placeholderText,
            !value && isDark && darkStyles.placeholderText,
          ]}
        >
          {value || placeholder}
        </Text>

        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={themePrimary}
        />
      </TouchableOpacity>

      {isOpen ? children : null}
    </>
  );
}

export default function HelpForm({ navigation }: HelpFormProps) {
  const alert = useAlert();
  const { isDark, theme } = useAppTheme();

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(null);
  const [selectedModule, setSelectedModule] =
    useState<SupportModuleOption | null>(null);
  const [ecommerceOrders, setEcommerceOrders] = useState<SupportOrderOption[]>(
    [],
  );
  const [serviceOrders, setServiceOrders] = useState<SupportOrderOption[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SupportOrderOption | null>(
    null,
  );
  const [selectedAttachment, setSelectedAttachment] =
    useState<SupportAttachment | null>(null);
  const [description, setDescription] = useState('');
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(60)).current;
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const moduleOptions = useMemo(
    () => getModuleOptionsForCategory(selectedCategory),
    [selectedCategory],
  );
  const requiresOrderSelection = useMemo(
    () => moduleRequiresOrder(selectedModule),
    [selectedModule],
  );
  const recentOrders = useMemo(() => {
    if (selectedModule?.key === 'product') {
      return ecommerceOrders;
    }

    if (selectedModule?.key === 'service') {
      return serviceOrders;
    }

    return [];
  }, [ecommerceOrders, selectedModule, serviceOrders]);

  const handleHistoryPress = useCallback(() => {
    navigation.navigate('MyTickets');
  }, [navigation]);

  const resetDependentFields = useCallback(() => {
    setSelectedModule(null);
    setSelectedOrder(null);
    setSelectedAttachment(null);
    setShowModuleDropdown(false);
    setShowOrderDropdown(false);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);

      const res = await fetchSupportCategories();

      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      __DEV__ && console.log('Category load failed', error);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const loadRecentOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);

      const res = await fetchSupportRecentOrders();

      if (res.success) {
        setEcommerceOrders(
          mapEcommerceOrdersToOptions(res.data?.ecommerce_orders || []),
        );
        setServiceOrders(
          mapServiceOrdersToOptions(res.data?.service_orders || []),
        );
        return;
      }

      setEcommerceOrders([]);
      setServiceOrders([]);
    } catch (error) {
      __DEV__ && console.log('Recent orders load failed', error);
      setEcommerceOrders([]);
      setServiceOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadRecentOrders();
  }, [loadRecentOrders]);

  const hideSuccessCard = useCallback(() => {
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(successTranslateY, {
        toValue: 60,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSuccessVisible(false);
      navigation.goBack();
    });
  }, [navigation, successOpacity, successTranslateY]);

  const showSuccessCard = useCallback(() => {
    setIsSuccessVisible(true);
    successOpacity.setValue(0);
    successTranslateY.setValue(60);

    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(successTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        hideSuccessCard();
      }, 2600);
    });
  }, [hideSuccessCard, successOpacity, successTranslateY]);

  const handlePickAttachment = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorMessage) {
        alert.error('Upload Error', result.errorMessage);
        return;
      }

      const asset = result.assets?.find(
        (item): item is SupportAttachment => Boolean(item?.uri),
      );

      if (!asset) {
        alert.error('Upload Error', 'No image selected');
        return;
      }

      setSelectedAttachment(asset);
    } catch (error: any) {
      alert.error(
        'Upload Error',
        error?.message || 'Unable to open image picker',
      );
    }
  }, [alert]);

  const handleCreateTicket = useCallback(async () => {
    try {
      if (!selectedCategory?.category_id) {
        alert.error('Validation Error', 'Please select category');
        return;
      }

      if (!selectedModule) {
        alert.error('Validation Error', 'Please select module name');
        return;
      }

      if (requiresOrderSelection && !selectedOrder?.id) {
        alert.error('Validation Error', 'Please select your order');
        return;
      }

      if (description.trim().length < 10) {
        alert.error(
          'Validation Error',
          'Description must be minimum 10 characters',
        );
        return;
      }

      const subject = buildTicketSubject({
        category: selectedCategory,
        moduleOption: selectedModule,
        order: selectedOrder,
      });

      setLoading(true);

      const res = await createSupportTicket({
        subject,
        description: description.trim(),
        category_id: selectedCategory.category_id,
        product_id:
          selectedModule?.key === 'product' ? selectedOrder?.productId : undefined,
        product_name:
          selectedModule?.key === 'product'
            ? selectedOrder?.productName
            : undefined,
        attachment: selectedAttachment
          ? {
              uri: selectedAttachment.uri,
              type: selectedAttachment.type,
              fileName: selectedAttachment.fileName,
            }
          : null,
      });

      if (res.success) {
        alert.success(
          'Ticket Created',
          res.message || 'Support ticket created successfully',
        );

        setDescription('');
        setSelectedCategory(null);
        setSelectedModule(null);
        setSelectedOrder(null);
        setSelectedAttachment(null);
        setShowCategoryDropdown(false);
        setShowModuleDropdown(false);
        setShowOrderDropdown(false);

        showSuccessCard();
        return;
      }

      alert.error('Ticket Error', res.message);
    } catch (error: any) {
      alert.error(
        'Ticket Error',
        error?.message || 'Failed to create support ticket',
      );
    } finally {
      setLoading(false);
    }
  }, [
    alert,
    description,
    requiresOrderSelection,
    selectedAttachment,
    selectedCategory,
    selectedModule,
    selectedOrder,
    showSuccessCard,
  ]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.screen, isDark && darkStyles.screen]}
      edges={['top']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#09090B' : '#F5F0FF'}
      />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerWrap}>
            <View style={styles.headerRow}>
              <Text
                style={[styles.headerTitle, isDark && darkStyles.primaryText]}
              >
                Support Ticket
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.historyBtn, isDark && darkStyles.historyBtn]}
                onPress={handleHistoryPress}
              >
                <Text
                  style={[
                    styles.historyBtnText,
                    isDark && darkStyles.historyBtnText,
                  ]}
                >
                  History
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.headerSub, isDark && darkStyles.mutedText]}>
              Raise your issue and our team will help you.
            </Text>
          </View>

          <View style={[styles.card, isDark && darkStyles.card]}>
            <SelectField
              label="Category"
              value={selectedCategory?.name}
              placeholder="Select Category"
              icon="shape-outline"
              isDark={isDark}
              themePrimary={theme.primary}
              isOpen={showCategoryDropdown}
              onToggle={() => {
                setShowCategoryDropdown(prev => !prev);
                setShowModuleDropdown(false);
                setShowOrderDropdown(false);
              }}
            >
              <View style={[styles.dropdown, isDark && darkStyles.dropdown]}>
                {categoryLoading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  categories.map(item => (
                    <TouchableOpacity
                      key={item.category_id}
                      style={[
                        styles.dropdownItem,
                        isDark && darkStyles.dropdownItem,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedCategory(item);
                        resetDependentFields();
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDark && darkStyles.inputText,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </SelectField>

            <SelectField
              label="Issue Type"
              value={selectedModule?.label}
              placeholder="Select Module"
              icon="view-grid-outline"
              isDark={isDark}
              themePrimary={theme.primary}
              isOpen={showModuleDropdown}
              onToggle={() => {
                if (!selectedCategory) {
                  alert.error(
                    'Validation Error',
                    'Please select category first',
                  );
                  return;
                }

                setShowModuleDropdown(prev => !prev);
                setShowCategoryDropdown(false);
                setShowOrderDropdown(false);
              }}
            >
              <View style={[styles.dropdown, isDark && darkStyles.dropdown]}>
                {moduleOptions.map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isDark && darkStyles.dropdownItem,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedModule(item);
                      setSelectedOrder(null);
                      setSelectedAttachment(null);
                      setShowModuleDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isDark && darkStyles.inputText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SelectField>

            <SelectField
              label="My Order"
              value={selectedOrder?.label}
              placeholder={
                selectedModule?.key === 'service'
                  ? 'Select Service Order'
                  : selectedModule?.key === 'product'
                    ? 'Select Product Order'
                    : 'Select Order'
              }
              icon="clipboard-list-outline"
              isDark={isDark}
              themePrimary={theme.primary}
              isOpen={showOrderDropdown}
              onToggle={() => {
                if (!selectedModule) {
                  alert.error(
                    'Validation Error',
                    'Please select module name first',
                  );
                  return;
                }

                setShowOrderDropdown(prev => !prev);
                setShowCategoryDropdown(false);
                setShowModuleDropdown(false);
              }}
            >
              <View style={[styles.dropdown, isDark && darkStyles.dropdown]}>
                {ordersLoading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : recentOrders.length ? (
                  recentOrders.map((item, index) => (
                    <TouchableOpacity
                      key={`${item.id}-${item.productId || index}`}
                      style={[
                        styles.dropdownItem,
                        isDark && darkStyles.dropdownItem,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedOrder(item);
                        setShowOrderDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDark && darkStyles.inputText,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text
                          style={[
                            styles.dropdownMetaText,
                            isDark && darkStyles.mutedText,
                          ]}
                          numberOfLines={1}
                        >
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.dropdownEmptyState}>
                    <Text
                      style={[
                        styles.dropdownEmptyStateText,
                        isDark && darkStyles.mutedText,
                      ]}
                    >
                      {selectedModule?.key === 'service'
                        ? 'No recent service orders found'
                        : selectedModule?.key === 'product'
                          ? 'No recent product orders found'
                          : 'No recent orders found'}
                    </Text>
                  </View>
                )}
              </View>
            </SelectField>

            <Text style={[styles.label, isDark && darkStyles.primaryText]}>
              Order ID
            </Text>

            <View style={[styles.inputWrap, isDark && darkStyles.inputWrap]}>
              <MaterialCommunityIcons
                name="identifier"
                size={18}
                color={isDark ? '#A1A1AA' : '#999'}
                style={styles.inputIcon}
              />

              <Text
                style={[
                  styles.dropdownText,
                  isDark && darkStyles.inputText,
                  !selectedOrder?.id && styles.placeholderText,
                  !selectedOrder?.id && isDark && darkStyles.placeholderText,
                ]}
              >
                {selectedOrder?.id
                  ? String(selectedOrder.id)
                  : 'Selected order ID'}
              </Text>
            </View>

            {selectedModule?.key === 'product' ? (
              <>
                <Text style={[styles.label, isDark && darkStyles.primaryText]}>
                  Product ID
                </Text>

                <View style={[styles.inputWrap, isDark && darkStyles.inputWrap]}>
                  <MaterialCommunityIcons
                    name="barcode"
                    size={18}
                    color={isDark ? '#A1A1AA' : '#999'}
                    style={styles.inputIcon}
                  />

                  <Text
                    style={[
                      styles.dropdownText,
                      isDark && darkStyles.inputText,
                      !selectedOrder?.productId && styles.placeholderText,
                      !selectedOrder?.productId &&
                        isDark &&
                        darkStyles.placeholderText,
                    ]}
                  >
                    {selectedOrder?.productId
                      ? String(selectedOrder.productId)
                      : 'Selected product ID'}
                  </Text>
                </View>
              </>
            ) : null}

            <Text style={[styles.label, isDark && darkStyles.primaryText]}>
              Upload Image
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.inputWrap, isDark && darkStyles.inputWrap]}
              onPress={handlePickAttachment}
            >
              <MaterialCommunityIcons
                name="image-outline"
                size={18}
                color={isDark ? '#A1A1AA' : '#999'}
                style={styles.inputIcon}
              />

              <Text
                style={[
                  styles.dropdownText,
                  isDark && darkStyles.inputText,
                  !selectedAttachment && styles.placeholderText,
                  !selectedAttachment && isDark && darkStyles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedAttachment?.fileName || 'Choose image'}
              </Text>

              <MaterialCommunityIcons
                name="upload"
                size={18}
                color={theme.primary}
              />
            </TouchableOpacity>

            <Text style={[styles.label, isDark && darkStyles.primaryText]}>
              Description
            </Text>

            <View style={[styles.textAreaWrap, isDark && darkStyles.inputWrap]}>
              <TextInput
                placeholder="Describe your issue..."
                placeholderTextColor={isDark ? '#71717A' : '#999'}
                selectionColor={theme.primary}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, isDark && darkStyles.inputText]}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {selectedAttachment ? (
              <Text style={[styles.helperText, isDark && darkStyles.mutedText]}>
                Image selected: {selectedAttachment.fileName || 'attachment'}
              </Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateTicket}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FC8BAD', '#A654CD']}
                start={{x: 1, y: 0}}
                end={{x: 0, y: 0}}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Create Ticket</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isSuccessVisible ? (
          <View style={styles.successWrapper} pointerEvents="none">
            <Animated.View
              style={[
                styles.successCard,
                isDark && darkStyles.successCard,
                {
                  opacity: successOpacity,
                  transform: [{translateY: successTranslateY}],
                },
              ]}
            >
              <View style={styles.successIconWrap}>
                <LinearGradient
                  colors={['#FC8BAD', '#A654CD']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.successIconBackground}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={48}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              <Text
                style={[styles.successTitle, isDark && darkStyles.successTitle]}
              >
                Thank You
              </Text>
              <Text
                style={[
                  styles.successDescription,
                  isDark && darkStyles.mutedText,
                ]}
              >
                Our support team received your request and will get back to you
                shortly.
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F0FF',
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 30,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#852BAF',
    flex: 1,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9B7EA',
    backgroundColor: '#FFFFFF',
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#852BAF',
  },
  headerSub: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#852BAF',
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginTop: -10,
    marginBottom: 18,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownMetaText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dropdownEmptyState: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  dropdownEmptyStateText: {
    fontSize: 13,
    color: '#666',
  },
  textAreaWrap: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 10,
    minHeight: 140,
  },
  textArea: {
    fontSize: 14,
    color: '#333',
    minHeight: 120,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 18,
  },
  submitBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  successCard: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 18,
  },
  successIconWrap: {
    marginBottom: 18,
  },
  successIconBackground: {
    width: 90,
    height: 90,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F35',
    textAlign: 'center',
    marginBottom: 10,
  },
  successDescription: {
    fontSize: 15,
    color: '#4B5268',
    textAlign: 'center',
    lineHeight: 22,
  },
});

const darkStyles = StyleSheet.create({
  screen: {backgroundColor: '#09090B'},
  card: {backgroundColor: '#18181B'},
  primaryText: {color: '#C4B5FD'},
  mutedText: {color: '#A1A1AA'},
  inputWrap: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  inputText: {color: '#F4F4F5'},
  placeholderText: {color: '#71717A'},
  dropdown: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  dropdownItem: {borderBottomColor: 'rgba(255,255,255,0.12)'},
  historyBtn: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  historyBtnText: {color: '#C4B5FD'},
  successCard: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  successTitle: {color: '#FFFFFF'},
});
