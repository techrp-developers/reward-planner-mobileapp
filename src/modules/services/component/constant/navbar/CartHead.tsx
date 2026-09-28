import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import WalletSvg from '../../../../../assets/homepage/navwallet.svg';
import type { HomeStackParamList } from '../../../navigation/type';
import { fetchUserInfo } from "../../../../common/auth/api/AuthAPI";
import { useAuth } from "../../../../common/auth/context/AuthContext";
import { useServicesTheme } from "../../../utils/useServicesTheme";
type CartHeadProps = {
  onBackPress?: () => void;
};

function CartHead({ onBackPress }: CartHeadProps) {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const servicesTheme = useServicesTheme();
  const { user, isAuthenticated } = useAuth();
  const authRewardPoints = (user as { rewardPoints?: number } | null)?.rewardPoints;
  const [rewardPoints, setRewardPoints] = useState(0);
  const placeholder = "Search “ITR Filing”";
const handleWalletPress = () => {
  navigation.navigate("WalletHistory");
};

  useEffect(() => {
    let isMounted = true;

    const loadRewardPoints = async () => {
      if (!isAuthenticated) {
        if (isMounted) setRewardPoints(0);
        return;
      }

      try {
        const userInfo = await fetchUserInfo();
        const nextRewardPoints =
          authRewardPoints ||
          userInfo?.data?.rewardPoints ||
          userInfo?.user?.rewardPoints ||
          0;

        if (isMounted) {
          setRewardPoints(Number(nextRewardPoints) || 0);
        }
      } catch (error) {
        console.warn("Failed to load service header reward points:", error);
        if (isMounted) setRewardPoints(0);
      }
    };

    loadRewardPoints();

    return () => {
      isMounted = false;
    };
  }, [authRewardPoints, isAuthenticated]);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Home');
  }, [navigation, onBackPress]);

  return (
    <View style={[styles.headerWrapper, { backgroundColor: servicesTheme.colors.background }]}>
      <View style={styles.searchRow}>
        {/* Search Input Container */}
        <View style={[styles.searchContainer, { backgroundColor: servicesTheme.colors.surface, shadowColor: servicesTheme.colors.shadow }]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={handleBackPress}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={servicesTheme.colors.muted} />
          </TouchableOpacity>
          
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={servicesTheme.colors.subtle}
            style={[styles.searchInput, { color: servicesTheme.colors.text }]}
            showSoftInputOnFocus={false}
            onFocus={() => navigation.navigate('ServiceSearch')}
          />
        </View>
       {/* Wallet Container */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.walletBox,
            {
              backgroundColor: servicesTheme.colors.surface,
              borderColor: servicesTheme.colors.borderSoft,
              shadowColor: servicesTheme.colors.shadow,
            },
          ]}
          onPress={handleWalletPress}
        >
          <View style={styles.walletIconTile}>
            <WalletSvg width={15} height={15} />
          </View>
          <View style={[styles.walletDivider, { backgroundColor: servicesTheme.colors.borderSoft }]} />
          <View style={styles.walletTextCol}>
            <Text style={[styles.walletLabel, { color: servicesTheme.colors.muted }]}>Wallet</Text>
            <Text style={[styles.walletAmount, { color: servicesTheme.colors.textStrong }]} numberOfLines={1}>
              {"\u20B9"}{Number(rewardPoints || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={15} color={servicesTheme.colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    height: 110,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 10,
    // Shadow for the white input box
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  walletBox: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 5,
    paddingRight: 8,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  walletIconTile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletDivider: {
    width: 1,
    height: 22,
    marginLeft: 9,
    marginRight: 8,
  },
  walletTextCol: {
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  walletAmount: {
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 1,
    marginRight: 4,
  },
});

export default CartHead;
