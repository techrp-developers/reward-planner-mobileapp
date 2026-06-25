// ProfileScreen.tsx
// Route:  Profile (HomeStackParamList)
// API:    GET /v1/auth/user-info  (via getAuthHeaders)
// Deps:   useAuth, useAppTheme, LogoutConfirmationModal, rs, fs

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert, Platform, Linking, Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import { getStoredUserName, deleteCustomer, getAuthHeaders, updateProfile } from '../../common/auth/api/AuthAPI';
import { fetchHistory } from '../api/OrderApi';
import { LogoutConfirmationModal } from '../../common/auth/screens/LogoutConfirmationModal';
import { rs, fs } from '../../../utils/responsive';
import axios from 'axios';
import Reward from '../../../assets/product/rewards.svg';

const API_BASE_URL = 'https://rewardplanners.com/api/crm';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Company {
  name: string;
  logo: string;
}

interface EmployeeInfo {
  dateOfJoining: string;   // shown — formatted
  role: string;            // shown — present in response
  date_of_birth: string;   // HIDDEN — personal/sensitive
  department: string;      // shown
}

interface Address {
  addressId: number; type: string; line1: string; line2: string;
  city: string; state: string; country: string; zipcode: string; landmark: string;
}

interface StepsData {
  steps: number; goal_steps: number; progress_percent: number;
}

interface UserInfo {
  userId: number;
  name: string;
  email: string;
  phone: string;
  rewardPoints: number;
  company: Company;
  employeeInfo: EmployeeInfo;
  defaultAddress: Address;
  steps: StepsData;
  thought: string;         // HIDDEN — not rendered
    userImage: string;
created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const rootNavigation = navigation.getParent() as RootNav | undefined;
  const { isDark, theme, toggleTheme } = useAppTheme();
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [userInfo, setUserInfo]         = useState<UserInfo | null>(null);
  const [displayName, setDisplayName]   = useState('User');
  const [avatarUri, setAvatarUri]         = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [_orders, setOrders]            = useState<any[]>([]);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading]           = useState(false);
  const [showOrderMenu, setShowOrderMenu]           = useState(false);

  const om = useMemo(() => ({
    parentBorder: { borderBottomWidth: 0.5 as const, borderBottomColor: isDark ? '#27272A' : '#E5E7EB' },
    parentIconBg: { backgroundColor: isDark ? '#27272A' : '#EEF2FF' },
    subRowBg:     { borderBottomWidth: 0.5 as const, borderBottomColor: isDark ? '#27272A' : '#E5E7EB', backgroundColor: isDark ? '#18181B' : '#F8FAFC' },
    subIconBg:    { backgroundColor: isDark ? '#312E81' : '#EEF2FF' },
  }), [isDark]);

  const topPadding =
    (insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 50) + 8;

  // ── Fetch user info ──────────────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    if (!isAuthenticated) { setDisplayName('Guest'); setLoading(false); return; }
    try {
      // Seed name from cache while API loads
      if (authUser?.name) setDisplayName(String(authUser.name));
      else {
        const stored = await getStoredUserName();
        if (stored) setDisplayName(stored);
      }

      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const res = await axios.get<{ success: boolean; data: UserInfo }>(
        `${API_BASE_URL}/v1/auth/user-info`,
        { headers }
      );

      if (res.data?.success) {
        setUserInfo(res.data.data);
        setDisplayName(res.data.data.name);
      }
    } catch {
      const fallback = await getStoredUserName();
      setDisplayName(fallback || 'User');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useFocusEffect(useCallback(() => { loadUser(); }, [loadUser]));

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    if (!isAuthenticated) { setOrders([]); return; }
    try {
      const res = await fetchHistory();
      setOrders(res?.success ? (res.orders ?? []) : []);
    } catch { setOrders([]); }
  }, [isAuthenticated]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Image picker + upload ────────────────────────────────────────────────
  const handlePickImage = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async res => {
      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      setAvatarUri(asset.uri);           // optimistic preview
      setImageUploading(true);
      try {
        const formData = new FormData();
        formData.append('user_image', {
          uri: asset.uri,
          type: asset.type ?? 'image/jpeg',
          name: asset.fileName ?? 'profile.jpg',
        } as any);

        const result = await updateProfile(formData);
        if (result?.data?.user_image) {
          setUserInfo(prev =>
            prev ? { ...prev, userImage: result.data.user_image } : prev
          );
        }
      } catch {
        setAvatarUri(null);
        Alert.alert('Upload Failed', 'Could not update profile photo. Please try again.');
      } finally {
        setImageUploading(false);
      }
    });
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogoutConfirm = useCallback(async () => {
    try {
      setLogoutLoading(true);
      await logout();
    } finally {
      setLogoutModalVisible(false);
      rootNavigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }
  }, [logout, rootNavigation]);

  // ── Delete account ───────────────────────────────────────────────────────
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              const res = await deleteCustomer();
              if (res?.success || res?.status === 'ok' || res?.data) {
                await logout();
                rootNavigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
              } else {
                Alert.alert('Failed', 'Could not delete account. Please try again.');
              }
            } catch {
              Alert.alert('Failed', 'Could not delete account. Please try again.');
            } finally { setLogoutLoading(false); }
          },
        },
      ]
    );
  }, [logout, rootNavigation]);

  // ── Rate us ───────────────────────────────────────────────────────────────
  const handleRateUs = useCallback(async () => {
    try {
      await Linking.openURL('market://details?id=com.rewardsplanners');
    } catch {
      await Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.rewardsplanners'
      );
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const emp = userInfo?.employeeInfo;

  // Fields we show from employeeInfo — date_of_birth and role (if null/empty)
  // are explicitly excluded below with conditional rendering
  const showRole       = !!emp?.role && emp.role.trim().length > 0;
  const showDepartment = !!emp?.department && emp.department.trim().length > 0;
  const showJoining    = !!emp?.dateOfJoining;

  return (
    <LinearGradient
      colors={isDark ? ['#09090B', '#111827', '#151526'] : ['#F8FAFC', '#EEF2FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rs(56) }}
        bounces
      >
        {/* ════════════════════════════════════
            HERO
        ════════════════════════════════════ */}
        <LinearGradient
          colors={isDark ? ['#09090B', '#111827', '#151526'] : ['#F8FAFC', '#EEF2FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topPadding }]}
        >
          {/* Top bar */}
          <View style={styles.heroBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>My Profile</Text>
            <View style={styles.heroBtnGhost} />
          </View>

          <LinearGradient
            colors={isDark ? ['#18181B', '#27233A', '#312E81'] : ['#111827', '#312E81', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profilePanel}
          >
            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} disabled={imageUploading}>
                <View style={styles.avatarRing}>
                  <View style={[styles.avatarInner, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
                    {(avatarUri || userInfo?.userImage)
                      ? <Image
                          source={{ uri: (avatarUri || userInfo?.userImage)! }}
                          style={styles.avatarImg}
                        />
                      : <MaterialCommunityIcons name="account-circle" size={76} color="#6366F1" />}

                    {imageUploading && (
                      <View style={styles.avatarUploadOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.camBadge}>
                  <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>
                {displayName}
              </Text>
              {showRole && (
                <Text style={styles.heroRole} numberOfLines={1}>
                  {emp!.role}
                </Text>
              )}

              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricCard}>
                  <View style={styles.heroMetricIcon}>
                    <Reward width={18} height={18} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.heroMetricValue} numberOfLines={1}>
                      {userInfo?.rewardPoints?.toLocaleString() ?? '0'}
                    </Text>
                    <Text style={styles.heroMetricLabel}>Points</Text>
                  </View>
                </View>

                <View style={styles.heroMetricCard}>
                  {userInfo?.company?.logo ? (
                    <Image source={{ uri: userInfo.company.logo }} style={styles.heroCompanyLogo} resizeMode="contain" />
                  ) : (
                    <View style={styles.heroMetricIcon}>
                      <MaterialCommunityIcons name="office-building-outline" size={16} color="#4F46E5" />
                    </View>
                  )}
                  <View style={styles.flex1}>
                    <Text style={styles.heroMetricValue} numberOfLines={1}>
                      {userInfo?.company?.name ?? 'Company'}
                    </Text>
                    <Text style={styles.heroMetricLabel}>Company</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>

        {/* ════════════════════════════════════
            STATS ROW — Reward pts (big) + company logo
        ════════════════════════════════════ */}
        <View style={styles.body}>

          {/* ════════════════════════════════════
              CONTACT INFO
          ════════════════════════════════════ */}
          <SectionHead title="Contact Info" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <InfoRow
              icon="phone-outline"
              label="Mobile"
              value={formatPhone(userInfo?.phone ?? '')}
              isDark={isDark} theme={theme}
              noChevron
            />
            <InfoRow
              icon="email-outline"
              label="Email"
              value={userInfo?.email ?? ''}
              isDark={isDark} theme={theme}
              noChevron
            />
            <InfoRow
              icon="identifier"
              label="User ID"
              value={`#RP-${String(userInfo?.userId ?? 0).padStart(5, '0')}`}
              isDark={isDark} theme={theme}
              last noChevron
              badge={{ label: 'Active', color: 'purple' }}
            />
          </View>

          {/* ════════════════════════════════════
              EMPLOYEE INFO
              — date_of_birth: always hidden
              — role: only if non-empty from API
              — department + dateOfJoining: shown
          ════════════════════════════════════ */}
          {(showDepartment || showJoining || showRole) && (
            <>
              <SectionHead title="Work Info" isDark={isDark} />
              <View style={[styles.card, cardColor(isDark, theme)]}>
                {showRole && (
                  <InfoRow
                    icon="briefcase-outline"
                    label="Role"
                    value={emp!.role}
                    isDark={isDark} theme={theme}
                    last={!showDepartment && !showJoining}
                    noChevron
                  />
                )}
                {showDepartment && (
                  <InfoRow
                    icon="domain"
                    label="Department"
                    value={emp!.department}
                    isDark={isDark} theme={theme}
                    last={!showJoining}
                    noChevron
                  />
                )}
                {showJoining && (
                  <InfoRow
                    icon="calendar-check-outline"
                    label="Date of Joining"
                    value={formatDate(emp!.dateOfJoining)}
                    isDark={isDark} theme={theme}
                    last noChevron
                  />
                )}
              </View>
            </>
          )}

          {/* ════════════════════════════════════
              DEFAULT ADDRESS
          ════════════════════════════════════ */}
          {userInfo?.defaultAddress && (
            <>
              <SectionHead
                title="Default Address"
                isDark={isDark}
                action="Change"
                onAction={() => navigation.navigate('AddressSelect' as any)}
              />
              <View style={[styles.card, cardColor(isDark, theme), { padding: rs(14) }]}>
                <View style={styles.addrTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="home-outline" size={15} color="#4F46E5" />
                    <View style={styles.badgePurple}>
                      <Text style={styles.badgePurpleText}>
                        {userInfo.defaultAddress.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.badgeGreen}>
                    <Text style={styles.badgeGreenText}>Default</Text>
                  </View>
                </View>
                <Text style={[styles.addrText, { color: theme.text }]}>
                  {userInfo.defaultAddress.line1}, {userInfo.defaultAddress.line2},{'\n'}
                  {userInfo.defaultAddress.city}, {userInfo.defaultAddress.state} – {userInfo.defaultAddress.zipcode},{'\n'}
                  {userInfo.defaultAddress.country}
                </Text>
                <View style={styles.addrLandmark}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={theme.secondaryText} />
                  <Text style={[styles.landmarkText, { color: theme.secondaryText }]}>
                    {userInfo.defaultAddress.landmark}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* ════════════════════════════════════
              PREFERENCES
          ════════════════════════════════════ */}
          <SectionHead title="Preferences" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <DarkModeRow isDark={isDark} theme={theme} onToggle={toggleTheme} />
          </View>

          {/* ════════════════════════════════════
              SHOP SECTION
          ════════════════════════════════════ */}
          <SectionHead title="Shop" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            {/* My Orders — expandable dropdown */}
            <TouchableOpacity
              style={[styles.mrow, om.parentBorder]}
              onPress={() => setShowOrderMenu(p => !p)}
              activeOpacity={0.7}
            >
              <View style={[styles.micon, om.parentIconBg]}>
                <MaterialCommunityIcons name="shopping-outline" size={17} color="#4F46E5" />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.rowVal, { color: theme.text }]}>My Orders</Text>
              </View>
              <MaterialCommunityIcons
                name={showOrderMenu ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isDark ? '#52525B' : '#CBD5E1'}
              />
            </TouchableOpacity>

            {showOrderMenu && (
              <>
                <TouchableOpacity
                  style={[styles.mrow, styles.subRow, om.subRowBg]}
                  onPress={() => { setShowOrderMenu(false); navigation.navigate('MyOrder' as any); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.micon, om.subIconBg]}>
                    <MaterialCommunityIcons name="cart-outline" size={16} color="#4F46E5" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowVal, { color: theme.text }]}>Ecommerce Orders</Text>
                    <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>Products & shopping</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#52525B' : '#CBD5E1'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mrow, styles.subRow, om.subRowBg]}
                  onPress={() => {
                    setShowOrderMenu(false);
                    (navigation as any).navigate('ServiceStack', { screen: 'MyOrder' });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.micon, om.subIconBg]}>
                    <MaterialCommunityIcons name="briefcase-check-outline" size={16} color="#4F46E5" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowVal, { color: theme.text }]}>Service Orders</Text>
                    <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>Insurance, docs & more</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#52525B' : '#CBD5E1'} />
                </TouchableOpacity>
              </>
            )}

            <AccountRow icon="heart-outline"         label="Wishlist"       isDark={isDark} theme={theme} onPress={() => navigation.navigate('WishList' as any)} />
            <AccountRow icon="map-marker-outline"    label="Saved Addresses" isDark={isDark} theme={theme} last onPress={() => navigation.navigate('AddressSelect' as any)} />
          </View>

          {/* ════════════════════════════════════
              OTHERS / ACCOUNT
          ════════════════════════════════════ */}
          <SectionHead title="Others" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <AccountRow icon="file-document-outline" label="Terms & Conditions" isDark={isDark} theme={theme} onPress={() => navigation.navigate('TermsAndConditions' as any)} />
            <AccountRow icon="shield-lock-outline"   label="Privacy Policy"     isDark={isDark} theme={theme} onPress={() => navigation.navigate('PrivacyPolicy' as any)} />
            <AccountRow icon="star-outline"          label="Rate Us"            isDark={isDark} theme={theme} onPress={handleRateUs} />
            <AccountRow icon="help-circle-outline"   label="Help & Support"     isDark={isDark} theme={theme} onPress={() => navigation.navigate('HelpForm' as any)} />
            <AccountRow icon="lock-reset"             label="Change Password"    isDark={isDark} theme={theme} onPress={() => navigation.navigate('ChangePassword')} />

            {/* Divider before danger actions */}
            <View style={[styles.sectionDivider, { backgroundColor: isDark ? '#27272A' : '#E5E7EB' }]} />

            <AccountRow icon="logout"        label="Log Out"        isDark={isDark} theme={theme} danger onPress={() => setLogoutModalVisible(true)} />
            <AccountRow icon="delete-outline" label="Delete Account" sub="This action cannot be undone" isDark={isDark} theme={theme} danger last onPress={handleDeleteAccount} />
          </View>

          {/* ════════════════════════════════════
              FOOTER — copyright + member since
          ════════════════════════════════════ */}
          <View style={styles.footer}>
            
            {userInfo?.created_at ? (
              <Text style={[styles.footerMember, { color: theme.secondaryText }]}>
                Member since {formatDate(userInfo.created_at)}
              </Text>
            ) : null}
          </View>

        </View>
      </ScrollView>

      <LogoutConfirmationModal
        visible={logoutModalVisible}
        isLoading={logoutLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </LinearGradient>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHead = ({ title, isDark, action, onAction }: {
  title: string; isDark: boolean; action?: string; onAction?: () => void;
}) => (
  <View style={styles.secHead}>
    <Text style={[styles.secTitle, { color: isDark ? '#A1A1AA' : '#475569' }]}>
      {title.toUpperCase()}
    </Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.secAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface InfoRowProps {
  icon: string; label: string; value: string;
  isDark: boolean; theme: any;
  last?: boolean; noChevron?: boolean;
  badge?: { label: string; color: 'purple' | 'green' };
}
const InfoRow: React.FC<InfoRowProps> = ({
  icon, label, value, isDark, theme, last, noChevron, badge,
}) => (
  <View style={[styles.mrow, !last && {
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? '#27272A' : '#E5E7EB',
  }]}>
    <View style={[styles.micon, { backgroundColor: isDark ? '#27272A' : '#EEF2FF' }]}>
      <MaterialCommunityIcons name={icon} size={17} color="#4F46E5" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>{label}</Text>
      <Text style={[styles.rowVal, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
    {badge?.color === 'purple' && (
      <View style={styles.badgePurple}><Text style={styles.badgePurpleText}>{badge.label}</Text></View>
    )}
    {badge?.color === 'green' && (
      <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>{badge.label}</Text></View>
    )}
    {!noChevron && !badge && (
      <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#52525B' : '#CBD5E1'} />
    )}
  </View>
);

interface AccountRowProps {
  icon: string; label: string; sub?: string;
  isDark: boolean; theme: any;
  danger?: boolean; last?: boolean; onPress?: () => void;
}
const AccountRow: React.FC<AccountRowProps> = ({
  icon, label, sub, isDark, theme, danger, last, onPress,
}) => (
  <TouchableOpacity
    style={[styles.mrow, !last && {
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? '#27272A' : '#E5E7EB',
    }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.micon, {
      backgroundColor: danger
        ? (isDark ? '#3B1A1A' : '#FFF0F0')
        : (isDark ? '#27272A' : '#EEF2FF'),
    }]}>
      <MaterialCommunityIcons name={icon} size={17} color={danger ? '#EF4444' : '#4F46E5'} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowVal, { color: danger ? '#EF4444' : theme.text }]}>{label}</Text>
      {sub ? <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>{sub}</Text> : null}
    </View>
    {!danger && (
      <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#52525B' : '#CBD5E1'} />
    )}
  </TouchableOpacity>
);

const DarkModeRow: React.FC<{ isDark: boolean; theme: any; onToggle: () => void }> = ({
  isDark, theme, onToggle,
}) => (
  <View style={styles.mrow}>
    <View style={[styles.micon, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
      <MaterialCommunityIcons
        name={isDark ? 'weather-night' : 'white-balance-sunny'}
        size={18}
        color="#4F46E5"
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowVal, { color: theme.text }]}>Dark Mode</Text>
      <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>
        {isDark ? 'Dark theme active' : 'Light theme active'}
      </Text>
    </View>
    <Switch
      value={isDark}
      onValueChange={onToggle}
      thumbColor="#FFFFFF"
      trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
      ios_backgroundColor="#CBD5E1"
    />
  </View>
);

// ── Style helpers ─────────────────────────────────────────────────────────────
const cardColor = (isDark: boolean, _theme: any) => ({
  backgroundColor: isDark ? '#18181B' : '#FFFFFF',
  borderColor: isDark ? '#27272A' : '#E5E7EB',
  shadowColor: isDark ? '#000' : '#64748B',
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Hero ──
  hero: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(18),
    overflow: 'hidden',
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.16)',
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(16), zIndex: 2 },
  heroTitle: { fontSize: fs(16), fontWeight: '800', letterSpacing: 0 },
  heroBtn:  {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.20)',
  },
  heroBtnGhost: {
    width: 38,
    height: 38,
  },

  profilePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(16),
    zIndex: 2,
    borderRadius: rs(24),
    paddingHorizontal: rs(14),
    paddingVertical: rs(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: rs(12) },
    shadowOpacity: 0.22,
    shadowRadius: rs(18),
    elevation: 8,
  },
  avatarWrap: { alignItems: 'center', zIndex: 2 },
  avatarRing:  {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#FFFFFF',
    padding: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarInner: { width: '100%', height: '100%', borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  avatarImg:   { width: '100%', height: '100%' },
  avatarUploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  camBadge:    { position: 'absolute', bottom: 5, right: 5, width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroName:    { fontSize: fs(20), fontWeight: '800', letterSpacing: 0, color: '#FFFFFF' },
  heroRole:    { fontSize: fs(12), marginTop: 4, fontWeight: '600', color: 'rgba(255,255,255,0.72)' },
  heroMetrics: {
    marginTop: rs(12),
    gap: rs(8),
  },
  heroMetricCard: {
    minHeight: rs(42),
    borderRadius: rs(14),
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroMetricIcon: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(9),
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetricValue: {
    fontSize: fs(13),
    fontWeight: '800',
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  heroMetricLabel: {
    fontSize: fs(10),
    marginTop: 1,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  heroCompanyLogo: {
    width: rs(36),
    height: rs(24),
    borderRadius: rs(6),
    backgroundColor: '#FFFFFF',
  },

  // Company bar inside hero

  // ── Stats row — reward pts + company ──

  // ── Body ──
  body:    { paddingHorizontal: rs(16), marginTop: rs(16) },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(20), marginBottom: rs(10), marginLeft: 2 },
  secTitle: { fontSize: fs(11), fontWeight: '800', letterSpacing: 0.7 },
  secAction: { fontSize: fs(12), color: '#4F46E5', fontWeight: '700' },

  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  mrow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), paddingVertical: rs(13), gap: 12 },
  micon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLbl: { fontSize: fs(11), marginBottom: 1 },
  rowVal: { fontSize: fs(13), fontWeight: '500' },

  // Badges
  badgePurple:     { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgePurpleText: { fontSize: fs(10), fontWeight: '800', color: '#4338CA' },
  badgeGreen:      { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeGreenText:  { fontSize: fs(10), fontWeight: '800', color: '#047857' },

  // Address
  addrTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  addrText:     { fontSize: fs(13), lineHeight: 21 },
  addrLandmark: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: rs(6) },
  landmarkText: { fontSize: fs(11) },

  // Divider inside card
  sectionDivider: { height: 0.5, marginHorizontal: rs(14) },

  flex1:   { flex: 1 },
  subRow:  { paddingLeft: rs(10) },

  // Footer
  footer:       { alignItems: 'center', paddingVertical: rs(28), gap: rs(5) },
  footerCopy:   { fontSize: fs(11), fontWeight: '400', textAlign: 'center' },
  footerMember: { fontSize: fs(11), fontWeight: '500', textAlign: 'center' },
});

export default ProfileScreen;
