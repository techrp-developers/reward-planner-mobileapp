import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginHead from "../constants/heading/LoginHead";
import { fetchSearchSuggestions, getProductImageUrl, saveSearchHistory, getSearchHistory, clearSearchHistory } from "../api/ProductApi";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type SearchSuggestion = {
    id: number;
    title: string;
    image?: string;
    type?: "product" | "category" | string;
};

type SearchHistoryItem = string | { keyword?: string; title?: string; q?: string };

function SearchScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [loadingSuggest, setLoadingSuggest] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showSuggest, setShowSuggest] = useState(false);
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
                Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [pulse]);

    const normalizeHistoryItem = useCallback((item: SearchHistoryItem): string => {
        if (typeof item === "string") return item.trim();
        return (item?.keyword || item?.title || item?.q || "").trim();
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            setLoadingHistory(true);
            const res = await getSearchHistory();
            if (res?.success) {
                const normalized = (res.history || [])
                    .map((item: SearchHistoryItem) => normalizeHistoryItem(item))
                    .filter(Boolean);
                setHistory(Array.from(new Set(normalized)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    }, [normalizeHistoryItem]);

    // Load History on Mount
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleSelectSuggestion = async (item: SearchSuggestion) => {
        setShowSuggest(false);
        setSearch(item.title);
        const normalizedType = String(item?.type || "product").trim().toLowerCase();

        if (normalizedType === "category") {
            navigation.navigate("Category", {
                categoryId: Number(item.id),
                title: item.title,
            });
        } else {
            navigation.navigate("ProductDescription", { productId: item.id });
        }

        try {
            await saveSearchHistory(item.title.trim());
            loadHistory();
        } catch (error) {
            console.error("Failed to save search history", error);
        }
    };

    const handleHistoryPress = (value: string) => {
        setSearch(value);
        if (value.trim().length >= 2) {
            setShowSuggest(true);
        }
    };

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (search.trim().length < 2) {
                setSuggestions([]);
                setShowSuggest(false);
                return;
            }
            try {
                setLoadingSuggest(true);
                const res = await fetchSearchSuggestions(search);
                if (res?.success) {
                    setSuggestions(res.suggestions || []);
                    setShowSuggest(true);
                } else {
                    setSuggestions([]);
                    setShowSuggest(true);
                }
            } catch (e) {
                console.error(e);
                setSuggestions([]);
                setShowSuggest(true);
            } finally {
                setLoadingSuggest(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <LoginHead
                showSearch
                search={search}
                onChangeSearch={setSearch}
                onFocusSearch={() => search.length >= 2 && setShowSuggest(true)}
            />

            {showSuggest ? (
                <View style={styles.suggestionWrapper}>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {loadingSuggest ? (
                            <View style={styles.loaderContainer}>
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <View key={`suggest-skeleton-${index}`} style={styles.searchSkeletonItem}>
                                        <SkeletonBox pulse={pulse} width={42} height={42} borderRadius={8} />
                                        <View style={styles.searchSkeletonTextWrap}>
                                            <SkeletonBox pulse={pulse} width="82%" height={12} borderRadius={999} />
                                            <SkeletonBox pulse={pulse} width="42%" height={10} borderRadius={999} style={styles.searchSkeletonTag} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : suggestions.length === 0 ? (
                            <Text style={styles.noResultText}>No product found</Text>
                        ) : (
                            suggestions.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    style={styles.item}
                                    onPress={() => handleSelectSuggestion(item)}
                                >
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: getProductImageUrl(item.image) }}
                                            style={styles.img}
                                        />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
                                        <Text style={styles.categoryTag}>
                                            {String(item?.type || "product").trim().toLowerCase() === "category" ? "Category" : "Product"}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="arrow-top-left" size={20} color="#bbb" />
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Past Searches</Text>
                        <View style={styles.historyActions}>
                          <TouchableOpacity onPress={loadHistory} style={styles.actionButton}>
                            <MaterialCommunityIcons name="refresh" size={18} color="#2874f0" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                const res = await clearSearchHistory();
                                if (res?.success) {
                                  await loadHistory();
                                  Alert.alert("Success", "Search history cleared.");
                                } else {
                                  throw new Error("Failed to clear history");
                                }
                              } catch (error) {
                                console.error("clearSearchHistory", error);
                                Alert.alert("Error", "Unable to clear search history. Please try again.");
                              }
                            }}
                            style={styles.actionButton}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EB5757" />
                          </TouchableOpacity>
                        </View>
                    </View>

                    {loadingHistory ? (
                        <View style={styles.historySkeletonWrap}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonBox
                                    key={`history-skeleton-${index}`}
                                    pulse={pulse}
                                    width={index % 2 === 0 ? 110 : 150}
                                    height={34}
                                    borderRadius={17}
                                    style={styles.historySkeletonChip}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.chipWrap}>
                            {history.length > 0 ? history.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.chip}
                                    onPress={() => handleHistoryPress(item)}
                                >
                                    <MaterialCommunityIcons name="magnify" size={14} color="#555" />
                                    <Text style={styles.chipText}>{item}</Text>
                                </TouchableOpacity>
                            )) : (
                                <Text style={styles.emptyText}>No recent searches</Text>
                            )}
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 0,
    },
    suggestionWrapper: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 0,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
    },
    imageContainer: {
        width: 42,
        height: 42,
        borderRadius: 8,
        backgroundColor: "#f7f7f7",
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: "#eee"
    },
    img: {
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        color: "#1a1a1a",
        fontWeight: "400",
    },
    categoryTag: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },
    historyHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        letterSpacing: -0.5,
    },
    historyActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: "#F4F7FE",
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f3f6",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        marginRight: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    chipText: {
        marginLeft: 6,
        fontSize: 13,
        color: "#444",
        fontWeight: "500",
    },
    loaderContainer: {
        padding: 30,
        alignItems: 'stretch',
    },
    msg: {
        marginTop: 10,
        color: "#888",
    },
    historyLoader: {
        marginTop: 20,
    },
    searchSkeletonItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    searchSkeletonTextWrap: {
        flex: 1,
        marginLeft: 15,
    },
    searchSkeletonTag: {
        marginTop: 8,
    },
    historySkeletonWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    historySkeletonChip: {
        marginRight: 8,
        marginBottom: 10,
    },
    noResultText: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: "#7A7A7A",
        fontSize: 14,
    },
    emptyText: {
        color: "#bbb",
        fontSize: 14,
    }
});

export default SearchScreen;