import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { getServiceImageUrl } from "../utils/serviceImage";

import type { HomeStackParamList } from "../navigation/type";
import { getAllServices } from "../api/ServiceAPI";
import ServiceHead from "../component/header/ServiceHead";
import SkeletonBox from "../component/constant/SkeletonBox";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceResult = {
  id: number;
  name: string;
  description?: string;
  service_image: string;
  price: string;
  category_name: string;
  rating?: string;
  estimated_days?: number;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

function ServiceSearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;

  // Skeleton pulse loop — same pattern as ecommerce SearchScreen
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // Debounced search — 300ms
  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await getAllServices(search.trim());
        setResults(res?.success ? (res.data ?? []) : []);
        setShowResults(true);
      } catch {
        setResults([]);
        setShowResults(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = useCallback(
    (item: ServiceResult) => {
      navigation.navigate("ServiceDescription", {
        serviceId: item.id,
        title: item.name,
      });
    },
    [navigation]
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Header with background image + search input */}
      <ServiceHead
        showSearch
        search={search}
        onChangeSearch={setSearch}
        onFocusSearch={() => search.trim().length >= 2 && setShowResults(true)}
      />

      {/* Results area */}
      {showResults ? (
        <View style={styles.resultsWrapper}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              /* Skeleton rows */
              <View style={styles.skeletonContainer}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={`skel-${i}`} style={styles.skeletonRow}>
                    <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={10} />
                    <View style={styles.skeletonText}>
                      <SkeletonBox pulse={pulse} width="72%" height={13} borderRadius={999} />
                      <SkeletonBox
                        pulse={pulse}
                        width="44%"
                        height={10}
                        borderRadius={999}
                        style={styles.skeletonGap}
                      />
                      <SkeletonBox
                        pulse={pulse}
                        width="28%"
                        height={11}
                        borderRadius={999}
                        style={styles.skeletonGap}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : results.length === 0 ? (
              <Text style={styles.noResult}>No services found for "{search}"</Text>
            ) : (
              results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={styles.row}
                  onPress={() => handleSelect(item)}
                >
                  {/* Thumbnail */}
                  <View style={styles.imgWrap}>
                    <Image
                      source={{ uri: getServiceImageUrl(item.service_image) }}
                      style={styles.img}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Text block */}
                  <View style={styles.mid}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowCat} numberOfLines={1}>
                      {item.category_name}
                    </Text>
                    <Text style={styles.rowPrice}>₹{item.price}</Text>
                  </View>

                  {/* Arrow */}
                  <MaterialCommunityIcons name="arrow-top-left" size={20} color="#bbb" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        /* Hint state — shown when search < 2 chars */
        <View style={styles.hintWrap}>
          <MaterialCommunityIcons name="magnify" size={48} color="#E5D6F7" />
          <Text style={styles.hintTitle}>Search Services</Text>
          <Text style={styles.hintSub}>
            Type at least 2 characters to find services
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default ServiceSearchScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  resultsWrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Result row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  imgWrap: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  img: {
    width: 36,
    height: 36,
  },
  mid: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  rowCat: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A654CD",
    marginTop: 3,
  },
  noResult: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: "#7A7A7A",
    fontSize: 14,
  },
  // Skeleton
  skeletonContainer: {
    padding: 20,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  skeletonText: {
    flex: 1,
    marginLeft: 14,
  },
  skeletonGap: {
    marginTop: 7,
  },
  // Hint state
  hintWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    gap: 10,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#A654CD",
    marginTop: 8,
  },
  hintSub: {
    fontSize: 13,
    color: "#B89FD0",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
