import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import WalletSvg from '../../../../../assets/homepage/navwallet.svg';
import ServiceTop from '../../../../../assets/homepage/service_top_nav.png';
import type { HomeStackParamList } from '../../../navigation/type';
import { useCart } from "../../../../ecommerce/context/CartContext";
import { fetchUserInfo } from "../../../../ecommerce/api/AuthAPI";
import { useAuth } from "../../../../ecommerce/auth/context/AuthContext";
type CartHeadProps = {
  onBackPress?: () => void;
};

function CartHead({ onBackPress }: CartHeadProps) {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const authRewardPoints = (user as { rewardPoints?: number } | null)?.rewardPoints;
  const [rewardPoints, setRewardPoints] = useState(0);
  const placeholder = "Search “ITR Filing”";
const { totalQuantity } = useCart();
const handleCartPress = () => {
  navigation.navigate("CartScreen");
};
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
    <View style={styles.headerWrapper}>
      {/* Background SVG for the Top Gradient */}
      <View style={styles.svgWrapper}>
        <Image source={ServiceTop} style={styles.topBackgroundImage} resizeMode="cover" />
      </View>

      <View style={styles.searchRow}>
        {/* Search Input Container */}
        <View style={styles.searchContainer}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={handleBackPress}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#6B7280" />
          </TouchableOpacity>
          
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            showSoftInputOnFocus={false}
            onFocus={() => navigation.navigate('ServiceSearch')}
          />
        </View>

        {/* Wallet Container */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.walletBox}
          onPress={handleWalletPress}
        >
          <WalletSvg width={26} height={26} />
          <View style={styles.walletTag}>
            <Text style={styles.walletTagText}>{"\u20B9"}{rewardPoints}</Text>
          </View>
        </TouchableOpacity>

        {/* Cart Icon */}
<TouchableOpacity
  style={styles.iconCircle}
  activeOpacity={0.8}
  onPress={handleCartPress}
>
  <View>
    <MaterialCommunityIcons name="cart-outline" size={24} color="#111827" />

    {totalQuantity > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {totalQuantity}
        </Text>
      </View>
    )}
  </View>
</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 54 : 30,
    height: 110,
    zIndex: 10,
  },
  svgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  topBackgroundImage: {
    width: '100%',
    height: 100,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
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
    width: 54,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  walletTag: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#5F341A', // Dark brown tag from image
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  walletTagText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  badge: {
  position: 'absolute',
  top: -6,
  right: -10,
  backgroundColor: '#EF4444',
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: '#fff',
},

badgeText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold',
},
});

export default CartHead;
