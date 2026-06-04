// ProfileScreen.tsx
// Route:  Profile (HomeStackParamList)
// API:    GET /v1/auth/user-info  (via getAuthHeaders)
// Deps:   useAuth, useAppTheme, LogoutConfirmationModal, rs, fs

import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import { getStoredUserName, deleteCustomer, getAuthHeaders, updateProfile } from '../api/AuthAPI';
import { fetchHistory } from '../api/OrderApi';
import { LogoutConfirmationModal } from '../components/LogoutConfirmationModal';
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
  const [orders, setOrders]             = useState<any[]>([]);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading]           = useState(false);

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
        <ActivityIndicator size="large" color="#7C5CFC" />
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
    <View style={[styles.root, { backgroundColor: isDark ? theme.background : '#F4F2FF' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rs(56) }}
        bounces
      >
        {/* ════════════════════════════════════
            HERO — gradient with decorative orbs
        ════════════════════════════════════ */}
        <LinearGradient
          colors={isDark ? ['#2D1F6E', '#1A1040'] : ['#7C5CFC', '#9B7FFF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topPadding }]}
        >
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* Top bar */}
          <View style={styles.heroBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>My Profile</Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate('EditProfile' as any)}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} disabled={imageUploading}>
              <View style={styles.avatarRing}>
                <View style={[styles.avatarInner, { backgroundColor: isDark ? '#2D1F6E' : '#E9E4FF' }]}>
                  {(avatarUri || userInfo?.userImage)
                    ? <Image
                        source={{ uri: (avatarUri || userInfo?.userImage)! }}
                        style={styles.avatarImg}
                      />
                    : <MaterialCommunityIcons name="account-circle" size={62} color="#7C5CFC" />}

                  {imageUploading && (
                    <View style={styles.avatarUploadOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.camBadge}>
                <MaterialCommunityIcons name="camera" size={11} color="#7C5CFC" />
              </View>
            </TouchableOpacity>

            <Text style={styles.heroName}>{displayName}</Text>
            {showRole && <Text style={styles.heroRole}>{emp!.role}</Text>}
          </View>
        </LinearGradient>

        {/* ════════════════════════════════════
            STATS ROW — Reward pts (big) + company logo
        ════════════════════════════════════ */}
        <View style={[styles.statsRow, {
          backgroundColor: isDark ? theme.card : '#fff',
          shadowColor: isDark ? '#000' : '#7C5CFC',
        }]}>
          {/* Reward points — takes 60% */}
          <View style={styles.statRewardCell}>
            <View style={[styles.statIcon, ]}>
              <Reward width={20} height={20} />
            </View>
            <View>
              <Text style={[styles.statRewardVal, { color: isDark ? '#fff' : '#1A1A2E' }]}>
                {userInfo?.rewardPoints?.toLocaleString() ?? '0'}
              </Text>
              <Text style={[styles.statLbl, { color: '#9CA3AF' }]}>Reward Points</Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: isDark ? theme.border : '#F0EDFF' }]} />

          {/* Company logo cell — takes 40% */}
          <View style={styles.statCompanyCell}>
            {userInfo?.company?.logo ? (
              <Image
                source={{ uri: userInfo.company.logo }}
                style={styles.statCompanyLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#374151' : '#F0EDFF' }]}>
                <MaterialCommunityIcons name="office-building-outline" size={15} color="#7C5CFC" />
              </View>
            )}
            <Text style={[styles.statLbl, { color: '#9CA3AF' }]} numberOfLines={1}>
              {userInfo?.company?.name ?? 'Company'}
            </Text>
          </View>
        </View>

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
            />
            <InfoRow
              icon="email-outline"
              label="Email"
              value={userInfo?.email ?? ''}
              isDark={isDark} theme={theme}
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
                    <MaterialCommunityIcons name="home-outline" size={15} color="#7C5CFC" />
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
            <AccountRow icon="shopping-outline"     label="My Orders"      isDark={isDark} theme={theme} onPress={() => navigation.navigate('MyOrder' as any)} />
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

            {/* Divider before danger actions */}
            <View style={[styles.sectionDivider, { backgroundColor: isDark ? theme.border : '#F5F3FF' }]} />

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
    </View>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHead = ({ title, isDark, action, onAction }: {
  title: string; isDark: boolean; action?: string; onAction?: () => void;
}) => (
  <View style={styles.secHead}>
    <Text style={[styles.secTitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
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
    borderBottomColor: isDark ? '#374151' : '#F5F3FF',
  }]}>
    <View style={[styles.micon, { backgroundColor: isDark ? '#374151' : '#F0EDFF' }]}>
      <MaterialCommunityIcons name={icon} size={17} color="#7C5CFC" />
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
      <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#4B5563' : '#DDD8F5'} />
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
      borderBottomColor: isDark ? '#374151' : '#F5F3FF',
    }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.micon, {
      backgroundColor: danger
        ? (isDark ? '#3B1A1A' : '#FFF0F0')
        : (isDark ? '#374151' : '#F0EDFF'),
    }]}>
      <MaterialCommunityIcons name={icon} size={17} color={danger ? '#EF4444' : '#7C5CFC'} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowVal, { color: danger ? '#EF4444' : theme.text }]}>{label}</Text>
      {sub ? <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>{sub}</Text> : null}
    </View>
    {!danger && (
      <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#4B5563' : '#DDD8F5'} />
    )}
  </TouchableOpacity>
);

const DarkModeRow: React.FC<{ isDark: boolean; theme: any; onToggle: () => void }> = ({
  isDark, theme, onToggle,
}) => (
  <View style={styles.mrow}>
    <View style={[styles.micon, { backgroundColor: isDark ? '#1E1B4B' : '#F0EDFF' }]}>
      <MaterialCommunityIcons
        name={isDark ? 'weather-night' : 'white-balance-sunny'}
        size={18}
        color="#7C5CFC"
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
      trackColor={{ false: '#D0CCE8', true: '#7C5CFC' }}
      ios_backgroundColor="#D0CCE8"
    />
  </View>
);

// ── Style helpers ─────────────────────────────────────────────────────────────
const cardColor = (isDark: boolean, theme: any) => ({
  backgroundColor: theme.card,
  borderColor: isDark ? theme.border : 'rgba(124,92,252,0.1)',
  shadowColor: isDark ? '#000' : '#8B5CF6',
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Hero ──
  hero: { paddingHorizontal: rs(20), paddingBottom: rs(24), overflow: 'hidden' },
  orb1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -50 },
  orb2: { position: 'absolute', width: 130, height: 130, borderRadius: 65,  backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 10 },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(22), zIndex: 2 },
  heroTitle: { fontSize: fs(16), fontWeight: '600', color: '#fff' },
  heroBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  avatarWrap: { alignItems: 'center', zIndex: 2 },
  avatarRing:  { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', padding: 3 },
  avatarInner: { width: '100%', height: '100%', borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff', overflow: 'hidden' },
  avatarImg:   { width: '100%', height: '100%' },
  avatarUploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  camBadge:    { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#7C5CFC' },
  heroName:    { fontSize: fs(20), fontWeight: '700', color: '#fff', marginTop: rs(12) },
  heroRole:    { fontSize: fs(12), color: 'rgba(255,255,255,0.75)', marginTop: 3, fontWeight: '400' },

  // Company bar inside hero
  companyBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: rs(14), backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: rs(14), paddingVertical: rs(7), alignSelf: 'center' },
  companyLogo: { width: 64, height: 22, borderRadius: 4 },
  companyLogoPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center' },
  companyName: { fontSize: fs(13), fontWeight: '600', color: '#fff' },

  // ── Stats row — reward pts + company ──
  statsRow: { flexDirection: 'row', marginHorizontal: rs(20), marginTop: rs(-20), borderRadius: 18, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(124,92,252,0.12)', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, zIndex: 10 },
  statRewardCell:  { flex: 3, flexDirection: 'row', alignItems: 'center', paddingVertical: rs(16), paddingHorizontal: rs(14), gap: 10 },
  statCompanyCell: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: rs(16), paddingHorizontal: rs(10), gap: 4 },
  statRewardVal:   { fontSize: fs(22), fontWeight: '800', lineHeight: fs(26) },
  statCompanyLogo: { width: 80, height: 28, borderRadius: 4 },
  statIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 0.5, marginVertical: rs(12) },
  statLbl:  { fontSize: fs(10), fontWeight: '400' },

  // ── Body ──
  body:    { paddingHorizontal: rs(16), marginTop: rs(16) },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(20), marginBottom: rs(10), marginLeft: 2 },
  secTitle: { fontSize: fs(11), fontWeight: '500', letterSpacing: 0.8 },
  secAction: { fontSize: fs(12), color: '#7C5CFC', fontWeight: '500' },

  card: { borderRadius: 18, borderWidth: 0.5, overflow: 'hidden', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  mrow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), paddingVertical: rs(13), gap: 12 },
  micon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLbl: { fontSize: fs(11), marginBottom: 1 },
  rowVal: { fontSize: fs(13), fontWeight: '500' },

  // Badges
  badgePurple:     { backgroundColor: '#F0EDFF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgePurpleText: { fontSize: fs(10), fontWeight: '600', color: '#534AB7' },
  badgeGreen:      { backgroundColor: '#EDFAF4', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeGreenText:  { fontSize: fs(10), fontWeight: '600', color: '#0F6E56' },

  // Address
  addrTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(10) },
  addrText:     { fontSize: fs(13), lineHeight: 21 },
  addrLandmark: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: rs(6) },
  landmarkText: { fontSize: fs(11) },

  // Divider inside card
  sectionDivider: { height: 0.5, marginHorizontal: rs(14) },

  // Footer
  footer:       { alignItems: 'center', paddingVertical: rs(28), gap: rs(5) },
  footerCopy:   { fontSize: fs(11), fontWeight: '400', textAlign: 'center' },
  footerMember: { fontSize: fs(11), fontWeight: '500', textAlign: 'center' },
});

export default ProfileScreen;