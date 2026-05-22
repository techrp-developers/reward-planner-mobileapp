import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Pressable,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import ProductHeadColor from "../../constants/heading/Poduct_Head_Color";
import { deleteAddress, fetchAddressByID, fetchAllAddress } from "../../api/AddressApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAlert } from "../alerts";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'AddressSelect'>;

type AddressItem = {
  id: string;
  title: string;
  isDefault?: boolean;
  address: string;
};
type ApiAddress = {
  address_id: number;
  address_type: string;
  is_default: number;
  address1: string;
  address2?: string | null;
  city: string;
  zipcode: string;
};

export default function AddressSelectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const fromCart = route.params?.fromCart === true;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("1");
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchAllAddress();
      const list = Array.isArray(res.data) ? res.data : [];

      const mapped: AddressItem[] = list.map((a: ApiAddress) => ({
        id: String(a.address_id),
        title: a.address_type.toUpperCase(),
        isDefault: a.is_default === 1,
        address: `${a.address1}${a.address2 ? ", " + a.address2 : ""}, ${a.city} - ${a.zipcode}`,
      }));

      setAddresses(mapped);

      setSelectedId(prev =>
        mapped.find(x => x.id === prev)?.id ??
        mapped.find(x => x.isDefault)?.id ??
        mapped[0]?.id ??
        ""
      );
    } catch {
      alert.error("Error", "Failed to load addresses");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [alert]);

  // Load on mount, then reload on focus
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useFocusEffect(
    React.useCallback(() => {
      // Reload addresses when screen comes into focus
      loadAddresses();
    }, [loadAddresses])
  );


  const onDeleteAddress = async () => {
    if (!sheetItem) return;

    try {
      await deleteAddress(Number(sheetItem.id));
      await loadAddresses();
      closeSheet();
      alert.success("Deleted", "Address deleted successfully");
    } catch {
      alert.error("Error", "Could not delete address");
    }
  };

  const canSubmit = !!selectedId;

  const handleUseCurrentLocation = () => {
    navigation.navigate("AddAddressMap", { fromCart });
  };



  const handleSubmit = () => {
    if (selectedId) {
      if (fromCart) {
        navigation.navigate('Home');
      } else {
        navigation.navigate('WithAddress');
      }
    }
  };


  const filtered = useMemo(() => {
    if (!query.trim()) return addresses;
    const q = query.trim().toLowerCase();
    return addresses.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        x.address.toLowerCase().includes(q)
    );
  }, [addresses, query]);

  // -------------------- Bottom Sheet (Select Option) --------------------
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetForId, setSheetForId] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(260)).current;

  const openSheet = (id: string) => {
    setSheetForId(id);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: 260,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setSheetForId(null);
    });
  };

  useEffect(() => {
    if (sheetVisible) {
      translateY.setValue(260);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [sheetVisible, translateY]);

  const sheetItem = useMemo(
    () => addresses.find((a) => a.id === sheetForId) || null,
    [addresses, sheetForId]
  );


  const onEditAddress = async () => {
    if (!sheetItem) return;

    try {
      const apiAddress = await fetchAddressByID(sheetItem.id);

      const normalizedType = String(apiAddress?.address_type || "other").toLowerCase();
      const saveAs =
        normalizedType === "home"
          ? "Home"
          : normalizedType === "work"
          ? "Work"
          : "Other";

      closeSheet();
      navigation.navigate("AddressDetails", {
        mode: "edit",
        addressId: Number(sheetItem.id),
        initialData: {
          saveAs,
          flatHouseBuilding: apiAddress?.address1 || "",
          areaLocality: apiAddress?.address2 || "",
          landmark: apiAddress?.landmark || "",
          name: apiAddress?.contact_name || "",
          phone: apiAddress?.contact_phone || "",
          pincode: String(apiAddress?.zipcode || ""),
          city: apiAddress?.city || "",
          state: apiAddress?.state || "",
          state_id: Number(apiAddress?.state_id) || undefined,
          isDefault: Number(apiAddress?.is_default) === 1,
        },
      });
    } catch {
      alert.error("Error", "Could not load address details for editing");
    }
  };

  // -------------------- Header actions (UI only) --------------------

  const handleAddNewAddress = () => {
    navigation.navigate("AddressDetails");
  };
  return (
    <SafeAreaView style={styles.safe}>
      <ProductHeadColor
        title="Select Address"
        onBackPress={() => navigation.goBack()}
        onSearchPress={() => alert.info("Search", "Search functionality coming soon")}
        onBellPress={() => alert.info("Notifications", "Notifications coming soon")}
      />


      <View style={styles.screen}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#777" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for area, street name..."
            placeholderTextColor="#9A9AA5"
            style={styles.searchInput}
          />
        </View>

        {/* Top options card */}
        <View style={styles.topCard}>
          {/* Use Current Location */}
          <TouchableOpacity
            style={styles.topRow}
            activeOpacity={0.85}
            onPress={handleUseCurrentLocation}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircleSoft}>
                <MaterialCommunityIcons
                  name="target"
                  size={18}
                  color="#6D28D9"
                />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitlePurple}>Use Current Location</Text>
                <Text style={styles.rowSubText} numberOfLines={2}>
                  B-25, KPCT Mall, 16/1/1 Wanworie Road, Fatima Nagar, Wanwadi,
                  Pune, 411040
                </Text>
              </View>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Add New Address */}
          <TouchableOpacity
            style={styles.topRow}
            activeOpacity={0.85}
            onPress={handleAddNewAddress}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircleSoft}>
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color="#6D28D9"
                />
              </View>
              <Text style={styles.rowTitlePurple}>Add New Address</Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        {isInitialLoad && loading && (
          <Text style={styles.loadingText}>
            Loading addresses...
          </Text>
        )}

        {/* List */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 200 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((item) => {
            const selected = item.id === selectedId;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setSelectedId(item.id)}
                style={styles.addrCard}
              >
                <View style={styles.addrTop}>
                  <View style={styles.addrLeft}>
                    <View style={styles.pinCircle}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={18}
                        color="#7B7B86"
                      />
                    </View>

                    <View style={styles.flexOne}>
                      <View style={styles.titleRow}>
                        <Text style={styles.addrTitle}>{item.title}</Text>
                        {item.isDefault ? (
                          <View style={styles.defaultPill}>
                            <Text style={styles.defaultPillText}>Default</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.addrText}>{item.address}</Text>

                      {/* ✅ only 3 dots like screenshot */}
                      <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => openSheet(item.id)}
                        activeOpacity={0.9}
                      >
                        <MaterialCommunityIcons
                          name="dots-horizontal"
                          size={18}
                          color="#6B6B76"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Radio */}
                  <View style={styles.radioOuter}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.9}
            style={[styles.ctaWrapper, { marginBottom: insets.bottom + 14 }]}
          >
            <LinearGradient
              colors={["#8665FF", "#5B47A3"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>
                {fromCart ? "Update address" : "Continue to checkout and buy"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* -------------------- Bottom Sheet Modal -------------------- */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeSheet} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Option</Text>
            <TouchableOpacity onPress={closeSheet} style={styles.sheetCloseBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#1C1C22" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sheetRow}
            activeOpacity={0.9}
            onPress={onDeleteAddress}
          >
            <Text style={styles.sheetRowText}>Delete Address</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetRow}
            activeOpacity={0.9}
            onPress={onEditAddress}
          >
            <Text style={styles.sheetRowText}>Edit Address</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>

          <View style={styles.sheetBottomSpacer} />
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header like screenshot
  header: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9E9EA",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C22",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    position: "absolute",
    right: 10,
    top: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },

  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6C6C76",
  },
  flexOne: { flex: 1 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E8E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#1C1C22",
  },

  topCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8F0",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowTextWrap: { flex: 1, marginLeft: 10 },
  iconCircleSoft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitlePurple: {
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: "600",
  },
  rowSubText: {
    marginTop: 3,
    color: "#8A8A95",
    fontSize: 11,
    lineHeight: 15,
  },
  divider: { height: 1, backgroundColor: "#EFEFF6" },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: "#2B2B33",
    fontSize: 12,
    fontWeight: "600",
  },

  addrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8F0",
    padding: 12,
    marginBottom: 10,
  },
  addrTop: { flexDirection: "row", alignItems: "flex-start" },
  addrLeft: { flexDirection: "row", flex: 1 },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#ECECF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addrTitle: {
    color: "#1B1B22",
    fontSize: 13,
    fontWeight: "600",
  },
  defaultPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultPillText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "600",
  },

  addrText: {
    marginTop: 6,
    color: "#6C6C76",
    fontSize: 11.5,
    lineHeight: 16,
  },

  // ✅ 3-dots button (single) like screenshot
  moreBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    width: 32,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECF4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#1C1C22",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginTop: 4,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1C1C22",
  },

  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    alignItems: "center",
  },

  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', },

  ctaWrapper: { alignSelf: "center",
 },
  cta: {
    width: 338,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.5, },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },

  // -------------------- Bottom Sheet styles --------------------
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 58,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C22",
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECECF4",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  sheetRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C22",
  },
  sheetBottomSpacer: {
    height: Platform.OS === "ios" ? 18 : 10,
  },
});
