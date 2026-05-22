import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getWishlist, removeWishlist } from "../api/WishlistApi";
import { getProductImageUrl } from "../api/ProductApi";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../navigation/types";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type WishlistItem = any;

const WishlistScreen = () => {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await getWishlist();

      const list =
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.wishlist) && res.wishlist) ||
        (Array.isArray(res?.items) && res.items) ||
        [];

      if (res?.success) {
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const calculateDiscount = (mrp: number, sale: number) => {
    if (!mrp || !sale || mrp <= sale) return 0;
    const discount = ((mrp - sale) / mrp) * 100;
    return Math.round(discount);
  };

  const normalizeImage = (item: WishlistItem) => {
    const firstImage =
      item?.images?.[0]?.image_url ||
      item?.images?.[0] ||
      item?.image ||
      item?.product_image;

    if (!firstImage) return "";
    return String(firstImage).startsWith("http")
      ? firstImage
      : getProductImageUrl(firstImage);
  };

  const handleRemoveWishlist = async (item: WishlistItem) => {
    const wishlistId = Number(item?.wishlist_id ?? item?.wishlistId ?? item?.id);
    const productId = Number(
      item?.product_id ??
      item?.productId ??
      item?.product?.product_id ??
      item?.product?.id ??
      item?.product?.productId
    );
    const variantId = Number(
      item?.variant_id ??
      item?.variantId ??
      item?.variant?.variant_id ??
      item?.variant?.id ??
      item?.variant?.variantId ??
      item?.product?.variant_id ??
      item?.product?.default_variant_id ??
      productId
    );

    try {
      await removeWishlist({
        wishlistId: Number.isNaN(wishlistId) ? undefined : wishlistId,
        productId: Number.isNaN(productId) ? undefined : productId,
        variantId: Number.isNaN(variantId) ? undefined : variantId,
      });

      setItems((prev) =>
        prev.filter((x) => Number(x?.wishlist_id ?? x?.id) !== Number(item?.wishlist_id ?? item?.id))
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to remove from wishlist";
      console.log("Wishlist remove failed", message);
    }
  };

  const renderProduct = ({ item }: { item: WishlistItem }) => {
    const productId = item?.product_id ?? item?.id;
    const salePrice = Number(item?.sale_price ?? item?.price ?? 0);
    const mrp = Number(item?.mrp ?? item?.original_price ?? 0);
    const discount = calculateDiscount(mrp, salePrice);
    const imageUrl = normalizeImage(item);
    const brand = item?.brand_name || item?.brand || "BRAND";
    const name = item?.product_name || item?.title || "Product";
    const ratingText = item?.rating ? `${item.rating}` : "4.5";
    const reviewText = item?.reviews ? `(${item.reviews})` : "(0)";

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => productId && navigation.navigate("ProductDescription", { productId })}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
          />
          <TouchableOpacity
            style={styles.removeBtn}
            activeOpacity={0.8}
            onPress={() => handleRemoveWishlist(item)}
          >
            <MaterialCommunityIcons name="heart" size={20} color="#E53935" />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={styles.brand} numberOfLines={1}>{String(brand).toUpperCase()}</Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={12}
                color={star <= Math.round(Number(ratingText)) ? "#F5B400" : "#E5E7EB"}
              />
            ))}
            <Text style={styles.reviewText}>{reviewText}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>₹{salePrice || 0}</Text>
            <Text style={styles.mrp}>₹{mrp || 0}</Text>
            {discount > 0 && <Text style={styles.discountText}>{discount}% OFF</Text>}
          </View>

          <TouchableOpacity
            style={styles.addToCartBtn}
            activeOpacity={0.85}
            onPress={() => handleRemoveWishlist(item)}
          >
            <Text style={styles.btnText}>REMOVE WISHLIST</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProductHeadColor
        title="My Wishlist"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.countRow}>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderProduct}
        keyExtractor={(item, index) => String(item?.wishlist_id ?? item?.id ?? index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadWishlist(true)}
            tintColor="#8B5CF6"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="heart-outline" size={80} color="#ddd" />
                <Text style={styles.emptyText}>Your wishlist is empty</Text>
                <Text style={styles.emptySubText}>Save products you love to find them quickly.</Text>
            </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  itemCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEFF3",
    padding: 10,
  },

  imageWrapper: {
    width: 104,
    height: 104,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },

  brand: {
    fontSize: 12,
    fontWeight: "800",
    color: "#333",
    textTransform: "uppercase",
  },

  name: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 1,
  },

  reviewText: {
    marginLeft: 4,
    color: "#6B7280",
    fontSize: 11,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: 'wrap',
  },

  salePrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
  },

  mrp: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  discountText: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
    marginLeft: 6,
  },

  addToCartBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },

  btnText: {
    color: "#8B5CF6",
    fontWeight: "700",
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: '#94A3B8',
  },

  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: "#A0AEC0",
    textAlign: "center",
  },
});

export default WishlistScreen;