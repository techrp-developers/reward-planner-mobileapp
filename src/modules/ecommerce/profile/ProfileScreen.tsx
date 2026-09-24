// ProfileScreen.tsx
// Route:  Profile (HomeStackParamList)
// API:    GET /v1/auth/user-info  (via getAuthHeaders)
// Deps:   useAuth, useAppTheme, LogoutConfirmationModal, rs, fs

import React, { useCallback, useEffect, useState } from 'react';
import { Svg, Path } from 'react-native-svg';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert, Platform, Linking, Switch,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import { getStoredUserName, deleteCustomer, getAuthHeaders, updateProfile } from '../../common/auth/api/AuthAPI';
import { LogoutConfirmationModal } from '../../common/auth/screens/LogoutConfirmationModal';
import { rs, fs } from '../../../utils/responsive';
import axios from 'axios';
import Reward from '../../../assets/product/rewards.svg';

const API_BASE_URL = 'https://rewardplanners.com/api/crm';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export type ProfileContext = 'dashboard' | 'ecommerce' | 'services' | 'bbps';

const findRootNavigation = (navigation: any): NativeStackNavigationProp<RootStackParamList> => {
  let current = navigation;
  let parent = current?.getParent?.();

  while (parent) {
    current = parent;
    parent = current.getParent?.();
  }

  return current;
};

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

const CardPattern: React.FC = () => {
  const lines: React.ReactNode[] = [];
  const spacing = 28;
  const height = 280;
  const strokeColor = "rgba(255, 255, 255, 0.16)";
  const strokeWidth = 0.6;

  // Diagonal 1: Down and right
  for (let i = -15; i < 25; i++) {
    lines.push(
      <Path
        key={`d1-${i}`}
        d={`M ${i * spacing} -20 L ${(i * spacing) + height} ${height}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Diagonal 2: Up and right
  for (let i = -15; i < 25; i++) {
    lines.push(
      <Path
        key={`d2-${i}`}
        d={`M ${i * spacing} ${height} L ${(i * spacing) + height} -20`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Vertical lines
  for (let i = -5; i < 30; i++) {
    lines.push(
      <Path
        key={`v-${i}`}
        d={`M ${i * (spacing / 2)} -20 L ${i * (spacing / 2)} ${height}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lines}
    </Svg>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const rootNavigation = findRootNavigation(navigation);
  const { isDark: appIsDark, theme: appTheme, toggleTheme } = useAppTheme();
  const profileContext: ProfileContext = route.params?.context ?? 'dashboard';
  const isDashboardProfile = profileContext === 'dashboard';
  const isDark = appIsDark;
  const theme = appTheme;
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [userInfo, setUserInfo]         = useState<UserInfo | null>(null);
  const [gmcDetails, setGmcDetails]     = useState<any | null>(null);
  const [displayName, setDisplayName]   = useState('User');
  const [avatarUri, setAvatarUri]         = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading]           = useState(false);
  const [deleteLoading, setDeleteLoading]           = useState(false);

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

      const [res, gmcRes] = await Promise.all([
        axios.get<{ success: boolean; data: UserInfo }>(
          `${API_BASE_URL}/v1/auth/user-info`,
          { headers }
        ),
        fetchGmcDetails().catch(() => ({ success: false, data: null }))
      ]);

      console.log('[Profile Debug] User Info API response:', res.data);
      console.log('[Profile Debug] GMC API response:', gmcRes);

      if (res.data?.success) {
        setUserInfo(res.data.data);
        setDisplayName(res.data.data.name);
      }
      if (gmcRes?.success) {
        setGmcDetails(gmcRes.data);
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
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteAccountConfirm = useCallback(async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteCustomer();
      if (res?.success) {
        const gracePeriodDays = res?.data?.gracePeriodDays ?? 30;
        const deletionDeadline = res?.data?.permanentDeletionAt
          ? `on ${new Date(res.data.permanentDeletionAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`
          : `after ${gracePeriodDays} days`;

        setDeleteModalVisible(false);
        setDeletionScheduled({
          deadline: deletionDeadline,
          gracePeriodDays,
        });
      } else {
        Alert.alert('Failed', 'Could not delete account. Please try again.');
      }
    } catch {
      Alert.alert('Failed', 'Could not delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }, []);

  const handleDeletionScheduledAcknowledge = useCallback(async () => {
    try {
      setDeletionExitLoading(true);
      await logout();
    } finally {
      setDeletionScheduled(null);
      setDeletionExitLoading(false);
      rootNavigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }
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
          {/* Swipable Carousel for Profile Card and Policybazaar Card */}
          <View style={{ width: '100%' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + rs(12)}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={{
                paddingHorizontal: rs(20),
                gap: rs(12),
              }}
              style={{ marginHorizontal: -rs(20) }}
              onScroll={(event) => {
                const scrollOffset = event.nativeEvent.contentOffset.x;
                const page = Math.round(scrollOffset / (cardWidth + rs(12)));
                setProfileCardPage(page);
              }}
              scrollEventThrottle={16}
            >
              {/* Card 1: Main Profile Info Card */}
              <LinearGradient
                colors={isDark ? ['#18181B', '#27233A', '#312E81'] : ['#111827', '#312E81', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.profilePanel, { width: cardWidth }]}
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
              {/* Card 2: GMC Digital Insurance Card (Policybazaar Theme) */}
              {gmcDetails && (
                <View style={[styles.pbCardShadowWrapper, { width: cardWidth }]}>
                  <LinearGradient
                    colors={['#009ac7', '#007ca5', '#005b7f']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.policybazaarCard, { width: cardWidth }]}
                  >
                    <CardPattern />
                    
                    {/* Upper Card Content wrapper with padding */}
                    <View style={styles.pbCardUpperContent}>
                      <View style={styles.pbCardHeader}>
                        <View style={styles.pbLogoRow}>
                          <Text style={styles.pbLogoText}>policybazaar</Text>
                          <View style={styles.pbDotComBox}>
                            <Text style={styles.pbDotComText}>.com</Text>
                          </View>
                        </View>

                        <View style={styles.pbActiveBadge}>
                          <View style={styles.pbActiveIconCircle}>
                            <MaterialCommunityIcons name="check" size={8} color="#10B981" />
                          </View>
                          <Text style={styles.pbActiveText}>Active Policy</Text>
                        </View>
                      </View>

                      <View style={styles.pbCardMiddle}>
                        <View style={styles.pbMiddleLeft}>
                          <Text style={styles.pbNameText}>{gmcDetails.name || displayName}</Text>
                          <Text style={styles.pbInsurerText}>{gmcDetails.policy_company_name || 'Care Health Insurance'}</Text>
                          <Text style={styles.pbPolicyLabel}>Policy No.</Text>
                          <Text style={styles.pbPolicyNoText}>{gmcDetails.policy_number || 'N/A'}</Text>
                        </View>

                        <View style={styles.pbMiddleRight}>
                          <View style={styles.pbOrbOuterRing}>
                            <View style={styles.pbOrbInnerRing}>
                              <View style={styles.pbShieldIconBox}>
                                <MaterialCommunityIcons name="shield" size={26} color="#FFFFFF" />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Panel spans complete width */}
                    <View style={[styles.pbBottomPanel, { width: '100%', left: 0 }]}>
                      <View style={styles.pbBottomCol}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={14} color="#005b7f" />
                        <View style={{ marginLeft: rs(4) }}>
                          <Text style={styles.pbBottomLabel}>Member ID</Text>
                          <Text style={styles.pbBottomVal}>{gmcDetails.member_id || '—'}</Text>
                        </View>
                      </View>

                      <View style={styles.pbVerticalLine} />

                      <View style={styles.pbBottomCol}>
                        <MaterialCommunityIcons name="calendar-clock" size={14} color="#005b7f" />
                        <View style={{ marginLeft: rs(4) }}>
                          <Text style={styles.pbBottomLabel}>Valid Till</Text>
                          <Text style={styles.pbBottomVal}>{gmcDetails.valid_till || '—'}</Text>
                        </View>
                      </View>

                      <View style={styles.pbVerticalLine} />

                      <View style={styles.pbBottomCol}>
                        <MaterialCommunityIcons name="shield-check-outline" size={14} color="#EA580C" />
                        <View style={{ marginLeft: rs(4) }}>
                          <Text style={styles.pbBottomLabel}>Policy Type</Text>
                          <Text style={styles.pbBottomVal} numberOfLines={1}>{gmcDetails.policy_type || 'Group Card'}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </ScrollView>

            {/* Pagination indicator dots */}
            {gmcDetails && (
              <View style={styles.paginationRow}>
                <View style={[styles.pagDot, profileCardPage === 0 ? styles.pagDotActive : styles.pagDotInactive]} />
                <View style={[styles.pagDot, profileCardPage === 1 ? styles.pagDotActive : styles.pagDotInactive]} />
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ════════════════════════════════════
            STATS ROW — Reward pts (big) + company logo
        ════════════════════════════════════ */}
        <View style={styles.body}>

          {/* ════════════════════════════════════
              CONTACT INFO
          ════════════════════════════════════ */}
          {isDashboardProfile && gmcDetails && (
            <>
              {/* Health Insurance Section */}
              <SectionHead title="Health Insurance" isDark={isDark} />
              <TouchableOpacity
                style={[styles.horizontalClaimCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
                onPress={() => navigation.navigate('InssuranceStack' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isDark ? ['#005b7f', '#002534'] : ['#e5f6fd', '#d0f0fd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.horizontalClaimGradient}
                >
                  <View style={styles.horizontalClaimLeft}>
                    <View style={[styles.claimIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#005b7f' }]}>
                      <MaterialCommunityIcons name="hand-heart" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ marginLeft: rs(10) }}>
                      <Text style={[styles.claimTitle, { color: isDark ? '#FFFFFF' : '#003950' }]}>Mediclaim</Text>
                      <Text style={[styles.claimSub, { color: isDark ? 'rgba(255,255,255,0.7)' : '#005b7f' }]}>Raise & track claims easily</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#FFFFFF' : '#005b7f'} />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {isDashboardProfile && (
            <>
              <SectionHead title="User Info" isDark={isDark} />
              <View style={[styles.userInfoCard, cardColor(isDark, theme)]}>
            <InfoGroupTitle title="Contact Info" isDark={isDark} />
            <InfoTableRow
                icon="phone-outline"
                label="Mobile"
                value={formatPhone(userInfo?.phone ?? '')}
                isDark={isDark}
                theme={theme}
              />
              <InfoTableRow
                icon="email-outline"
                label="Email"
                value={userInfo?.email ?? ''}
                isDark={isDark}
                theme={theme}
              />
              <InfoTableRow
                icon="identifier"
                label="User ID"
                value={`#RP-${String(userInfo?.userId ?? 0).padStart(5, '0')}`}
                isDark={isDark}
                theme={theme}
                badge="Active"
                last={!showRole && !showDepartment && !showJoining}
              />
              {(showRole || showDepartment || showJoining) && (
                <InfoGroupTitle title="Work Info" isDark={isDark} />
              )}
              {showRole && (
                <InfoTableRow
                  icon="briefcase-outline"
                  label="Role"
                  value={emp!.role}
                  isDark={isDark}
                  theme={theme}
                  last={!showDepartment && !showJoining}
                />
              )}
              {showDepartment && (
                <InfoTableRow
                  icon="domain"
                  label="Department"
                  value={emp!.department}
                  isDark={isDark}
                  theme={theme}
                  last={!showJoining}
                />
              )}
              {showJoining && (
                <InfoTableRow
                  icon="calendar-check-outline"
                  label="Joined"
                  value={formatDate(emp!.dateOfJoining)}
                  isDark={isDark}
                  theme={theme}
                  last
                />
              )}
              </View>
            </>
          )}

          {/* ════════════════════════════════════
              EMPLOYEE INFO
              — date_of_birth: always hidden
              — role: only if non-empty from API
              — department + dateOfJoining: shown
          ════════════════════════════════════ */}
          {/* ════════════════════════════════════
              DEFAULT ADDRESS
          ════════════════════════════════════ */}
          {(profileContext === 'ecommerce' || profileContext === 'services' || profileContext === 'bbps') && (
            <>
              <SectionHead title={profileContext === 'services' ? 'Services' : 'Shop'} isDark={isDark} />
              <View style={[styles.card, cardColor(isDark, theme)]}>
            {/* My Orders — expandable dropdown */}
            <TouchableOpacity
              style={[styles.mrow, {
                borderBottomWidth: profileContext === 'ecommerce' ? 0.5 : 0,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
              }]}
              onPress={() => navigation.navigate(
                (profileContext === 'bbps' ? 'OrderHistory' : 'MyOrder') as any
              )}
              activeOpacity={0.7}
            >
              <View style={[styles.micon, { backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : '#EEF2FF' }]}>
                <MaterialCommunityIcons name={profileContext === 'services' ? 'briefcase-check-outline' : 'shopping-outline'} size={17} color="#4F46E5" />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.rowVal, { color: theme.text }]}>My Orders</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#CBD5E1" />
            </TouchableOpacity>

                {profileContext === 'ecommerce' && <AccountRow icon="heart-outline" label="Wishlist" isDark={isDark} theme={theme} last onPress={() => navigation.navigate('WishList' as any)} />}
              </View>
            </>
          )}

          <SectionHead title="Address" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <AccountRow icon="map-marker-outline" label="Saved Addresses" isDark={isDark} theme={theme} last onPress={() => navigation.navigate('AddressSelect', { manageOnly: true } as any)} />
          </View>

          {isDashboardProfile && (
            <>
              <SectionHead title="All Orders" isDark={isDark} />
              <View style={[styles.card, cardColor(isDark, theme)]}>
                <AccountRow
                  icon="clipboard-list-outline"
                  label="All Orders"
                  sub="Products, services, BBPS, and more"
                  isDark={isDark}
                  theme={theme}
                  last
                  onPress={() => rootNavigation.navigate('App', {
                    screen: 'TrackOrders',
                  } as any)}
                />
              </View>
            </>
          )}

          {/* ════════════════════════════════════
              OTHERS / ACCOUNT
          ════════════════════════════════════ */}
          <SectionHead title="Others" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <DarkModeRow isDark={isDark} theme={theme} onToggle={toggleTheme} />
            <AccountRow icon="file-document-outline" label="Terms & Conditions" isDark={isDark} theme={theme} onPress={() => navigation.navigate('TermsAndConditions' as any)} />
            <AccountRow icon="shield-lock-outline"   label="Privacy Policy"     isDark={isDark} theme={theme} onPress={() => navigation.navigate('PrivacyPolicy' as any)} />
            <AccountRow icon="star-outline"          label="Rate Us"            isDark={isDark} theme={theme} onPress={handleRateUs} />
            <AccountRow icon="help-circle-outline"   label="Help & Support"     isDark={isDark} theme={theme} last onPress={() => navigation.navigate('HelpForm' as any, { context: profileContext })} />
          </View>

          <View style={[styles.dangerCard, cardColor(isDark, theme)]}>
            <AccountRow icon="logout"        label="Log Out"        isDark={isDark} theme={theme} danger onPress={() => setLogoutModalVisible(true)} />
            <AccountRow icon="delete-outline" label="Delete Account" sub="30-day recovery period" isDark={isDark} theme={theme} danger last onPress={handleDeleteAccount} />
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
        isDark={isDark}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />
      <LogoutConfirmationModal
        visible={deleteModalVisible}
        isLoading={deleteLoading}
        isDark={isDark}
        danger
        icon="delete-outline"
        title="Delete Account"
        description="Schedule your account for permanent deletion?"
        subText="Your account and data will be retained for 30 days. Logging in during this period will restore your account."
        confirmText="Schedule Deletion"
        loadingText="Scheduling..."
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      />
      <LogoutConfirmationModal
        visible={deletionScheduled !== null}
        isLoading={deletionExitLoading}
        isDark={isDark}
        icon="calendar-check-outline"
        title="Deletion Scheduled"
        description={`Your account will be permanently deleted ${deletionScheduled?.deadline ?? 'after 30 days'}.`}
        subText={`Changed your mind? Log in again within ${deletionScheduled?.gracePeriodDays ?? 30} days to restore your account and all retained data.`}
        confirmText="Got It"
        loadingText="Signing out..."
        showCancel={false}
        onConfirm={handleDeletionScheduledAcknowledge}
        onCancel={handleDeletionScheduledAcknowledge}
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

const InfoGroupTitle: React.FC<{ title: string; isDark: boolean }> = ({ title, isDark }) => (
  <View style={[styles.infoGroupTitleWrap, { backgroundColor: isDark ? 'rgba(129,140,248,0.08)' : '#EEF2FF' }]}>
    <Text style={[styles.infoGroupTitle, { color: isDark ? '#C4B5FD' : '#4F46E5' }]}>
      {title}
    </Text>
  </View>
);

interface InfoTableRowProps {
  icon: string;
  label: string;
  value: string;
  isDark: boolean;
  theme: any;
  badge?: string;
  last?: boolean;
}
const InfoTableRow: React.FC<InfoTableRowProps> = ({
  icon, label, value, isDark, theme, badge, last,
}) => (
  <View style={[styles.infoTableRow, !last && {
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
  }]}>
    <View style={styles.infoTableLabelCol}>
      <View style={[styles.infoTableIcon, { backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : '#EEF2FF' }]}>
        <MaterialCommunityIcons name={icon} size={15} color="#6366F1" />
      </View>
      <Text style={[styles.infoTableLabel, { color: theme.secondaryText }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
    <View style={styles.infoTableValueCol}>
      <Text style={[styles.infoTableValue, { color: theme.text }]} numberOfLines={2}>
        {value || '-'}
      </Text>
      {badge ? (
        <View style={styles.badgePurple}>
          <Text style={styles.badgePurpleText}>{badge}</Text>
        </View>
      ) : null}
    </View>
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
      borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
    }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.micon, {
      backgroundColor: danger
        ? (isDark ? 'rgba(239,68,68,0.12)' : '#FFF0F0')
        : (isDark ? 'rgba(129,140,248,0.12)' : '#EEF2FF'),
    }]}>
      <MaterialCommunityIcons name={icon} size={16} color={danger ? '#EF4444' : '#6366F1'} />
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
  <View style={[styles.mrow, {
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
  }]}>
    <View style={[styles.micon, { backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : '#EEF2FF' }]}>
      <MaterialCommunityIcons
        name={isDark ? 'weather-night' : 'white-balance-sunny'}
        size={18}
        color="#6366F1"
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
  backgroundColor: isDark ? '#111113' : 'rgba(255,255,255,0.82)',
  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
  shadowColor: isDark ? '#000' : '#94A3B8',
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
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(22), marginBottom: rs(9), marginLeft: rs(10), marginRight: rs(8) },
  secTitle: { fontSize: fs(10), fontWeight: '800', letterSpacing: 0.6 },
  secAction: { fontSize: fs(12), color: '#4F46E5', fontWeight: '800' },

  card: {
    borderRadius: rs(18),
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  userInfoCard: {
    borderRadius: rs(18),
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  infoGroupTitleWrap: {
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
  },
  infoGroupTitle: {
    fontSize: fs(10),
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: rs(58),
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
    gap: rs(12),
  },
  infoTableLabelCol: {
    width: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  infoTableIcon: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(9),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTableLabel: {
    flex: 1,
    fontSize: fs(10),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  infoTableValueCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: rs(8),
  },
  infoTableValue: {
    flexShrink: 1,
    fontSize: fs(13),
    lineHeight: fs(18),
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'right',
  },
  dangerCard: {
    marginTop: rs(14),
    borderRadius: rs(18),
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  mrow: { flexDirection: 'row', alignItems: 'center', minHeight: rs(58), paddingHorizontal: rs(14), paddingVertical: rs(10), gap: rs(12) },
  micon: { width: rs(30), height: rs(30), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLbl: { fontSize: fs(10), marginBottom: 2, fontWeight: '600' },
  rowVal: { fontSize: fs(13), fontWeight: '800', letterSpacing: 0 },

  // Badges
  badgePurple:     { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgePurpleText: { fontSize: fs(10), fontWeight: '800', color: '#4338CA' },
  badgeGreen:      { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeGreenText:  { fontSize: fs(10), fontWeight: '800', color: '#047857' },

  flex1:   { flex: 1 },
  subRow:  { paddingLeft: rs(10) },

  // Footer
  footer:       { alignItems: 'center', paddingVertical: rs(28), gap: rs(5) },
  footerCopy:   { fontSize: fs(11), fontWeight: '400', textAlign: 'center' },
  footerMember: { fontSize: fs(11), fontWeight: '500', textAlign: 'center' },

  // Health Card Paging Styles (Care Group Card format)
  healthCardContent: {
    borderRadius: rs(18),
    padding: rs(12),
    aspectRatio: 1.7, // Shorter card ratio
    justifyContent: 'space-between',
  },
  careCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  careLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(4),
  },
  careLogoBox: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(4),
    marginRight: rs(4),
  },
  careLogoText: {
    fontSize: fs(13.5),
    fontWeight: '900',
    color: '#0F172A',
  },
  careLogoSubBox: {
    justifyContent: 'center',
  },
  careLogoSubText: {
    fontSize: fs(8.5),
    fontWeight: '800',
    color: '#FBBF24',
    lineHeight: fs(9.5),
  },
  careLogoSubTextMin: {
    fontSize: fs(6.5),
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: fs(8),
  },
  carePolicyRow: {
    marginVertical: rs(2),
  },
  carePolicySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(1.5),
  },
  careMetaTextMin: {
    fontSize: fs(8),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  carePolicyType: {
    fontSize: fs(8.5),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  careOrgName: {
    fontSize: fs(9),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  careHeaderRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  careMetaText: {
    fontSize: fs(8.5),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    lineHeight: fs(11),
  },
  careMetaBold: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  careDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: rs(6),
  },
  careTable: {
    flex: 1,
    justifyContent: 'space-around',
  },
  careTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    paddingBottom: rs(2),
    marginBottom: rs(2),
  },
  careColHeader: {
    fontSize: fs(8),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  careTableRow: {
    flexDirection: 'row',
    paddingVertical: rs(1),
  },
  careColValue: {
    fontSize: fs(8.5),
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Back of card styles
  careBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(4),
  },
  careBackUrl: {
    fontSize: fs(9.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  careBackIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: rs(4),
  },
  careBackIconBox: {
    alignItems: 'center',
    flex: 1,
    gap: rs(2),
  },
  careBackIconsRowBox: {
    alignItems: 'center',
    flex: 1,
    gap: rs(2),
  },
  careBackIconText: {
    fontSize: fs(8),
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: fs(9.5),
  },
  careBackQueries: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: rs(3),
    paddingHorizontal: rs(6),
    borderRadius: rs(4),
    alignItems: 'center',
    marginVertical: rs(3),
  },
  careBackQueriesText: {
    fontSize: fs(8),
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  careDisclaimer: {
    paddingHorizontal: rs(2),
  },
  disclaimerTitle: {
    fontSize: fs(8),
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: rs(1),
  },
  disclaimerLine: {
    fontSize: fs(7),
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    lineHeight: fs(9.5),
  },
  careBackFooter: {
    alignItems: 'center',
    marginTop: rs(4),
  },
  careBackFooterText: {
    fontSize: fs(8.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // dots & claim now button
  healthDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: rs(8),
    gap: rs(6),
  },
  healthDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
  },
  healthDotActive: {
    backgroundColor: '#6366F1',
    width: rs(12),
  },
  healthDotInactive: {
    backgroundColor: '#D1D5DB',
  },
  claimNowBtn: {
    borderRadius: rs(8),
    overflow: 'hidden',
    width: rs(130),
    alignSelf: 'center',
  },
  claimNowBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(7),
  },
  claimNowBtnText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '800',
  },
  pbCardShadowWrapper: {
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  policybazaarCard: {
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    justifyContent: 'space-between',
    minHeight: rs(200),
  },
  pbCardUpperContent: {
    paddingHorizontal: rs(14),
    paddingTop: rs(14),
    flex: 1,
    justifyContent: 'center',
    marginBottom: rs(58),
  },
  pbCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  pbLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pbLogoText: {
    fontSize: fs(14),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pbDotComBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: rs(8),
    paddingHorizontal: rs(4),
    paddingVertical: rs(1),
    marginLeft: rs(3),
  },
  pbDotComText: {
    fontSize: fs(8),
    fontWeight: '900',
    color: '#005b7f',
  },
  pbActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(12),
  },
  pbActiveIconCircle: {
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(4),
  },
  pbActiveText: {
    fontSize: fs(9),
    fontWeight: '800',
    color: '#047857',
  },
  pbCardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: rs(10),
  },
  pbMiddleLeft: {
    flex: 1.5,
  },
  pbNameText: {
    fontSize: fs(18),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pbInsurerText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: rs(2),
  },
  pbPolicyLabel: {
    fontSize: fs(8),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginTop: rs(8),
    textTransform: 'uppercase',
  },
  pbPolicyNoText: {
    fontSize: fs(10.5),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: rs(1),
  },
  pbMiddleRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pbOrbOuterRing: {
    width: rs(70),
    height: rs(70),
    borderRadius: rs(35),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pbOrbInnerRing: {
    width: rs(58),
    height: rs(58),
    borderRadius: rs(29),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  pbShieldIconBox: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  pbBottomPanel: {
    position: 'absolute',
    bottom: -1,
    height: rs(58),
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: rs(20),
    borderTopRightRadius: rs(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: rs(14),
    alignItems: 'center',
  },
  pbBottomCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pbBottomLabel: {
    fontSize: fs(8),
    color: '#64748B',
    fontWeight: '600',
  },
  pbBottomVal: {
    fontSize: fs(9.5),
    color: '#1E293B',
    fontWeight: '800',
    marginTop: rs(1),
  }, 
  pbVerticalLine: {
    width: 0.5,
    height: rs(20),
    backgroundColor: '#CBD5E1',
    marginHorizontal: rs(4),
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(10),
    gap: rs(6),
  },
  pagDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: '#CBD5E1',
  },
  pagDotActive: {
    backgroundColor: '#6366F1',
    width: rs(12),
  },
  pagDotInactive: {
    backgroundColor: '#CBD5E1',
  },
  horizontalClaimCard: {
    borderRadius: rs(14),
    overflow: 'hidden',
    marginBottom: rs(16),
    marginHorizontal: rs(10),
    borderWidth: 1,
    borderColor: 'rgba(0, 91, 127, 0.08)',
  },
  horizontalClaimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: rs(12),
  },
  horizontalClaimLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimIconBox: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimTitle: {
    fontSize: fs(13),
    fontWeight: '800',
  },
  claimSub: {
    fontSize: fs(9),
    fontWeight: '500',
    marginTop: rs(2),
  },
  // Group Card & Care Logo Styles
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(6),
  },
  groupHeaderRight: {
    alignItems: 'flex-end',
  },
  groupHeaderRightText: {
    fontSize: fs(7.5),
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  groupPolicyText: {
    fontSize: fs(9),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  groupCompanyText: {
    fontSize: fs(8),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: rs(1),
  },
  groupTableContainer: {
    marginTop: rs(6),
    width: '100%',
  },
  groupTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: rs(1.5),
  },
  groupColHeader: {
    fontSize: fs(7.5),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  groupTableRow: {
    flexDirection: 'row',
    paddingVertical: rs(1.5),
  },
  groupColVal: {
    fontSize: fs(8),
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ProfileScreen;

