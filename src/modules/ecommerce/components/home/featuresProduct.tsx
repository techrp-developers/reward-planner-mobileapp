import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import PointsButton from "../../constants/product_cart/PointsButton";
import { fetchAllProducts } from "../../api/ProductApi";
import { setWishlistState } from "../../api/WishlistApi";
import ProductImage from "../common/ProductImage";
import HorizontalProductList from "../common/HorizontalProductList";
import {
  handleNavigateWithPrefetch,
  productDetailsQueryKey,
} from "../../navigation/navigationPerformance";
import { fetchProductDetailsByID } from "../../api/ProductApi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "ProductDescription">;

type ProductVariant = {
  variant_id?: number | string;
  variantId?: number | string;
};

type FeatureProductItem = {
  id?: number | string;
  product_id?: number | string;
  productId?: number | string;
  variant_id?: number | string;
  variantId?: number | string;
  default_variant_id?: number | string;
  variants?: ProductVariant[];
  is_wishlisted?: boolean | number;
  images?: string[];
  image?: string;
  discount?: string;
  rp_price?: string | number;
  brand?: string;
  title?: string;
  short_description?: string;
  reviews?: number | string;
  price?: string | number;
  originalPrice?: string | number;
  redeem_coins?: number;
  rewardCoins?: number;
  rewardLabel?: string | null;
  reward?: {
    enabled?: boolean;
  };
};

type FeatureProductCardProps = {
  item: FeatureProductItem;
  cardWidth: number;           // passed from parent for responsiveness
  shouldLoadImage?: boolean;
};

// ================== CHILD CARD COMPONENT ==================
const FeatureProductCard = ({ item, cardWidth, shouldLoadImage = true }: FeatureProductCardProps) => {
  const navigation = useNavigation<Nav>();
  const [wishLoading, setWishLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(Boolean(item?.is_wishlisted));

  const productId = item?.id ?? item?.product_id ?? item?.productId;
  const variantId =
    item?.variant_id ??
    item?.variantId ??
    item?.default_variant_id ??
    item?.variants?.[0]?.variant_id;

  // Responsive sizes based on card width
  const imageSize = Math.min(Math.max(cardWidth * 0.6, 50), 90);
  const fontSizeTitle = Math.floor(Math.max(10, cardWidth * 0.09));
  const fontSizePrice = Math.floor(Math.max(12, cardWidth * 0.1));
  const fontSizeOld = Math.floor(Math.max(9, cardWidth * 0.07));
  const fontSizeDiscount = Math.floor(Math.max(9, cardWidth * 0.08));
  const fontSizeReview = Math.floor(Math.max(8, cardWidth * 0.07));
  const starSize = Math.max(9, Math.min(12, cardWidth * 0.08));

  useEffect(() => {
    setWishlisted(Boolean(item?.is_wishlisted));
  }, [item?.is_wishlisted, productId, variantId]);

  const handlePress = () => {
    if (!productId) return;
    const warmup = {
      queryKey: productDetailsQueryKey(productId),
      queryFn: () => fetchProductDetailsByID(productId),
    };
    const navAny = navigation as any;
    try {
      handleNavigateWithPrefetch({
        navigate: () => navAny.navigate("ProductDescription", { productId }),
        ...warmup,
      });
    } catch {
      try {
        handleNavigateWithPrefetch({
          navigate: () => navAny.navigate("HomeTab", { screen: "ProductDescription", params: { productId } }),
          ...warmup,
        });
      } catch {
        console.warn("Navigation fallback failed");
      }
    }
  };

  const firstImage = Array.isArray(item.images) && item.images.length > 0
    ? item.images[0]
    : item.image;

  const handleWishlist = async () => {
    if (wishLoading) return;
    const parsedProductId = Number(productId);
    const parsedVariantId = Number(variantId ?? parsedProductId);
    if (!parsedProductId) return;
    try {
      setWishLoading(true);
      const result = await setWishlistState(parsedProductId, parsedVariantId, !wishlisted);
      setWishlisted(result.wishlisted);
    } catch (error: any) {
      Alert.alert("Wishlist", error?.response?.data?.message || "Failed");
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { width: cardWidth }]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.imageBox}>
        <ProductImage
          uri={firstImage}
          resizeMode="contain"
          style={{ width: imageSize, height: imageSize }}
          loadEnabled={shouldLoadImage}
        />

        {!!item.rp_price && (
          <View style={styles.RPBadge}>
            <LinearGradient
              colors={["#FEB014", "#FFE486", "#F5B924"]}
              style={styles.RPGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.RPText, { fontSize: Math.max(7, fontSizeTitle * 0.7) }]}>
                RP {item.rp_price}
              </Text>
            </LinearGradient>
          </View>
        )}

        <TouchableOpacity
          style={styles.heartIcon}
          activeOpacity={0.8}
          onPress={handleWishlist}
          disabled={wishLoading}
        >
          <FontAwesome
            name={wishlisted ? "heart" : "heart-o"}
            size={Math.max(12, starSize)}
            color={wishlisted ? "#E53935" : "#4A4A4A"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoArea}>
        <Text style={[styles.titleText, { fontSize: fontSizeTitle }]} numberOfLines={2}>
          {item.brand && <Text style={styles.brandText}>{item.brand + " "}</Text>}
          {item.title && <Text style={styles.titleBold}>{item.title + " "}</Text>}
          {item.short_description && <Text style={styles.subText}>{item.short_description}</Text>}
        </Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <FontAwesome
              key={s}
              name="star"
              size={starSize}
              color="#FFC514"
              style={styles.starIcon}
            />
          ))}
          <Text style={[styles.reviewText, { fontSize: fontSizeReview }]}>
            ({item.reviews || 0})
          </Text>
        </View>

        <View style={styles.priceRow}>
          {!!item.discount && (
            <View style={styles.discountContainer}>
              <Text style={[styles.discountArrow, { fontSize: fontSizeDiscount }]}>↓</Text>
              <Text style={[styles.discountValue, { fontSize: fontSizeDiscount }]}>{item.discount}</Text>
            </View>
          )}
          {!!item.originalPrice && (
            <Text style={[styles.oldPrice, { fontSize: fontSizeOld }]}>{item.originalPrice}</Text>
          )}
          <Text style={[styles.currentPrice, { fontSize: fontSizePrice }]}>{item.price}</Text>
        </View>

        {/* PointsButton – directly pressable */}
        <PointsButton
          rewardCoins={item.rewardCoins || 0}
          redeemCoins={item.redeem_coins || 0}
          onPress={handlePress}
        />
      </View>
    </TouchableOpacity>
  );
};

// ================== MAIN COMPONENT ==================
export default function FeaturesProduct() {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const baseCardWidth = isTablet ? screenWidth * 0.22 : screenWidth * 0.4;
  const cardWidth = Math.min(Math.max(baseCardWidth, 130), 220);
  const horizontalGap = screenWidth * 0.03;
  const estimatedItemSize = cardWidth + horizontalGap;

  const { data: allProducts = [], isLoading } = useQuery<FeatureProductItem[]>({
    queryKey: ["ecommerce", "home", "features-products"],
    queryFn: async () => {
      const res = await fetchAllProducts();
      const normalizeProduct = (item: any): FeatureProductItem => ({
        ...item,
        rewardCoins:
          item?.reward?.enabled && Number(item?.rewardCoins) > 0
            ? Number(item.rewardCoins)
            : 0,
      });
      return res?.products?.map(normalizeProduct) ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const randomProducts = useMemo(() => {
    const shuffled = [...allProducts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 10);
  }, [allProducts]);

  const firstRow = randomProducts.slice(0, 5);
  const secondRow = randomProducts.slice(5, 10);

  const renderCard = React.useCallback(
    ({ item, shouldLoadImage }: { item: FeatureProductItem; index: number; shouldLoadImage: boolean }) => (
      <FeatureProductCard item={item} cardWidth={cardWidth} shouldLoadImage={shouldLoadImage} />
    ),
    [cardWidth]
  );

  if (isLoading) return <Text style={styles.loadingText}>Loading...</Text>;

  return (
    <LinearGradient colors={["#FFF4D6", "#FFECD6", "#FFDDCE"]} style={styles.fullScreen}>
      <View style={styles.contentWrap}>
        <View style={styles.headerCurve} />
        <HorizontalProductList
          data={firstRow}
          itemWidth={cardWidth}
          gap={horizontalGap}
          estimatedItemSize={estimatedItemSize}
          contentContainerStyle={styles.horizontalSliderPadding}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderCard={renderCard}
        />
        <HorizontalProductList
          data={secondRow}
          itemWidth={cardWidth}
          gap={horizontalGap}
          estimatedItemSize={estimatedItemSize}
          contentContainerStyle={styles.horizontalSliderPadding}
          keyExtractor={(item, index) => `feature-row-2-${String(item.id ?? index)}`}
          renderCard={renderCard}
        />
      </View>
    </LinearGradient>
  );
}

// ================== RESPONSIVE STYLES ==================
const { width: screenWidth } = Dimensions.get("window");
const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  contentWrap: { paddingBottom: 8 },
  headerCurve: {
    height: 40,
    backgroundColor: "#FFF4D6",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginHorizontal: 16,
    marginTop: 20,
  },
  horizontalSliderPadding: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  cardContainer: {
    marginRight: screenWidth * 0.03,
    marginBottom: 20,
  },
  imageBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    height: screenWidth * 0.35,
    maxHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    position: "relative",
  },
  RPBadge: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  RPGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  RPText: {
    color: "#1F2937",
    fontWeight: "700",
  },
  heartIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 4,
  },
  infoArea: { marginTop: 8 },
  titleText: {
    color: "#4A4A4A",
    lineHeight: 18,
  },
  brandText: { fontWeight: "800", color: "#222" },
  titleBold: { fontWeight: "bold", color: "#222" },
  subText: { color: "#777" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  reviewText: { color: "#777", marginLeft: 4 },
  starIcon: { marginRight: 2 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginVertical: 5,
    columnGap: 6,
    rowGap: 3,
  },
  currentPrice: { fontWeight: "bold", color: "#00875A" },
  oldPrice: { textDecorationLine: "line-through", color: "#777" },
  discountContainer: { flexDirection: "row", alignItems: "center" },
  discountArrow: { color: "#16A34A", fontWeight: "900" },
  discountValue: { color: "#16A34A", fontWeight: "800" },
  loadingText: { padding: 20, textAlign: "center" },
});