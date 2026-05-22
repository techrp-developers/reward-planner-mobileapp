import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  GestureResponderEvent,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { HomeStackParamList } from "../../navigation/types";
import PointsButton from "./PointsButton";
import { setWishlistState } from "../../api/WishlistApi";
import OptimizedImage from "../../components/common/OptimizedImage";
import RPpriceBadge from "./RPpriceBadge";

const { width: screenWidth } = Dimensions.get("window");

const PADDING = screenWidth * 0.03;
const GAP = screenWidth * 0.02;
const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;
const STAR_ARRAY = [1, 2, 3, 4, 5];

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type Props = {
  item: any;
  cardWidth?: number;
  shouldLoadImage?: boolean;
};

const ProductCardComponent = ({ item, cardWidth, shouldLoadImage = true }: Props) => {
  const navigation = useNavigation<Nav>();
  const [wishLoading, setWishLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(Boolean(item?.is_wishlisted));

  const usedCardWidth = cardWidth ?? CARD_WIDTH;

  const productId = item?.id ?? item?.product_id ?? item?.productId;
  const variantId =
    item?.variant_id ??
    item?.variantId ??
    item?.default_variant_id ??
    item?.variants?.[0]?.variant_id;

  // Responsive size calculations based on actual card width
  const calculations = useMemo(() => ({
    imageDynamicSize: Math.round(Math.min(Math.max(usedCardWidth * 0.88, 56), 104)),
    borderRadius: Math.round(usedCardWidth * 0.06),
    imageWrapHeight: Math.round(Math.min(Math.max(usedCardWidth * 1.02, 104), 132)),
    cardMinHeight: Math.round(Math.min(Math.max(usedCardWidth * 2.18, 238), 286)),
    fontSizeLabel: Math.max(11, Math.round(usedCardWidth * 0.098)),
    fontSizeReview: Math.max(9, Math.round(usedCardWidth * 0.066)),
    fontSizePrice: Math.max(12, Math.round(usedCardWidth * 0.096)),
    fontSizeOriginal: Math.max(9, Math.round(usedCardWidth * 0.065)),
    fontSizeDiscount: Math.max(9, Math.round(usedCardWidth * 0.07)), // 👈 discount text size
  }), [usedCardWidth]);

  const goToDetails = useCallback(() => {
    if (!productId) return;
    navigation.navigate("ProductDescription", { productId });
  }, [productId, navigation]);

  const firstImage = useMemo(() => {
    const candidates = [
      ...(Array.isArray(item?.images) ? item.images : []),
      item?.image,
      item?.image_url,
      item?.thumbnail,
    ];
    return candidates.find((candidate) => String(candidate || "").trim()) || "";
  }, [item?.image, item?.image_url, item?.images, item?.thumbnail]);

  useEffect(() => {
    setWishlisted(Boolean(item?.is_wishlisted));
  }, [item?.is_wishlisted, productId, variantId]);

  const handleWishlist = useCallback(async () => {
    if (wishLoading) return;

    const parsedProductId = Number(productId);
    const parsedVariantId = Number(variantId ?? parsedProductId);

    if (!parsedProductId || Number.isNaN(parsedProductId)) {
      Alert.alert("Wishlist", "Invalid product");
      return;
    }

    try {
      setWishLoading(true);
      const result = await setWishlistState(parsedProductId, parsedVariantId, !wishlisted);
      setWishlisted(result.wishlisted);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update wishlist";
      Alert.alert("Wishlist", String(message));
    } finally {
      setWishLoading(false);
    }
  }, [productId, variantId, wishLoading, wishlisted]);

  const handleWishlistPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      handleWishlist();
    },
    [handleWishlist]
  );

  const {
    starCount,
    reviewText,
    productTitle,
    priceText,
    originalPriceText,
    discount,
    rewardCoins,
    redeemCoins,
    rp_price
  } = useMemo(() => {
    const ratingValue = Number(item?.rating ?? 4.5);
    const safeRating = Number.isFinite(ratingValue)
      ? Math.max(0, Math.min(5, ratingValue))
      : 4.5;

    const coins = Number(item?.rewardCoins ?? 0);
    const redeemValue = Number(item?.redeem_coins ?? 0);

    return {
      starCount: Math.round(safeRating),
      reviewText: item?.reviews ? `(${item.reviews})` : "",
      productTitle: [item?.product_name || item?.title, item?.brand || item?.brand_name]
        .filter(Boolean)
        .join(" "),
      priceText: String(item?.price ?? ""),
      originalPriceText: String(item?.originalPrice ?? ""),
      rewardCoins: Number.isFinite(coins) ? coins : 0,
      redeemCoins: Number.isFinite(redeemValue) ? redeemValue : 0,
      rp_price: item?.rp_price ?? "",
      discount: item?.discount ?? item?.off_percent ?? "",  
    };
  }, [item]);

  return (
    <View
      style={[
        styles.card,
        {
          width: usedCardWidth,
          minHeight: calculations.cardMinHeight,
          borderRadius: calculations.borderRadius,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={goToDetails}>
        <View style={[styles.imageWrap, { height: calculations.imageWrapHeight, borderRadius: calculations.borderRadius, paddingTop: Math.round(usedCardWidth * 0.1) }]}>
          {!!rp_price && (
            <View style={styles.discountWrap}>
              <RPpriceBadge value={rp_price} />
            </View>
          )}

          <TouchableOpacity
            style={styles.heartIcon}
            activeOpacity={0.85}
            onPress={handleWishlistPress}
            disabled={wishLoading}
          >
            <FontAwesome
              name={wishlisted ? "heart" : "heart-o"}
              size={14}
              color={wishlisted ? "#E53935" : "#4A4A4A"}
            />
          </TouchableOpacity>

          <OptimizedImage
            path={firstImage}
            width={calculations.imageDynamicSize}
            height={calculations.imageDynamicSize}
            resizeMode="contain"
            sizePreset="thumbnail"
            priority="high"
            quality={40}
            loadEnabled={shouldLoadImage}
            style={styles.productImage}
            fallbackBackgroundColor="transparent"
          />
        </View>
      </TouchableOpacity>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.productTitle,
              { fontSize: calculations.fontSizeLabel },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {productTitle}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          {STAR_ARRAY.map((star) => (
            <FontAwesome
              key={star}
              name="star"
              size={10}
              color={star <= starCount ? "#FFC514" : "#E5E7EB"}
              style={styles.starIcon}
            />
          ))}
          <Text style={[styles.reviews, { fontSize: calculations.fontSizeReview }]}>
            {reviewText}
          </Text>
        </View>

        {/* ========== RESPONSIVE PRICE ROW ========== */}
        <View style={styles.priceRow}>
          {/* Discount indicator (arrow + text) */}
          {!!discount && (
            <View style={styles.discountInline}>
              <Text style={[styles.discountArrow, { fontSize: calculations.fontSizeDiscount }]}>
                ↓
              </Text>
              <Text 
                numberOfLines={1} 
                style={[styles.discountText, { fontSize: calculations.fontSizeDiscount }]}
              >
                {discount}
              </Text>
            </View>
          )}

          {/* Original price (strikethrough) */}
          {!!originalPriceText && (
            <Text 
              numberOfLines={1} 
              style={[styles.original, { fontSize: calculations.fontSizeOriginal }]}
            >
              {originalPriceText}
            </Text>
          )}

          {/* Final price */}
          <Text 
            numberOfLines={1} 
            style={[styles.price, { fontSize: calculations.fontSizePrice }]}
          >
            {priceText}
          </Text>
        </View>

        <View style={styles.pointsWrap}>
          <PointsButton rewardCoins={rewardCoins} redeemCoins={redeemCoins} onPress={goToDetails} />
        </View>
      </View>
    </View>
  );
};

// Memoized export
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.is_wishlisted === nextProps.item?.is_wishlisted &&
    prevProps.cardWidth === nextProps.cardWidth &&
    prevProps.item?.discount === nextProps.item?.discount &&
    prevProps.item?.rp_price === nextProps.item?.rp_price &&
    prevProps.item?.price === nextProps.item?.price &&
    prevProps.item?.originalPrice === nextProps.item?.originalPrice &&
    prevProps.item?.rewardCoins === nextProps.item?.rewardCoins &&
    prevProps.item?.redeem_coins === nextProps.item?.redeem_coins &&
    prevProps.item?.image === nextProps.item?.image &&
    prevProps.item?.product_name === nextProps.item?.product_name &&
    prevProps.shouldLoadImage === nextProps.shouldLoadImage
  );
});

export default ProductCard;

// ======================= STYLES =======================
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: 6,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  imageWrap: {
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  discountWrap: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 10,
  },
  heartIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    alignSelf: "center",
  },
  details: {
    marginTop: 8,
    flex: 1,
    justifyContent: "space-between",
  },
  titleRow: {
    marginTop: 4,
  },
  productTitle: {
    color: "#374151",
    fontWeight: "600",
    lineHeight: 16,
    minHeight: 32, // ensures two lines visible
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  starIcon: {
    marginRight: 1,
  },
  reviews: {
    color: "#9CA3AF",
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",      
    marginTop: 6,
    columnGap: 6,
    rowGap: 4,
  },
  discountInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountArrow: {
    color: "#16A34A",
    fontWeight: "900",
    marginRight: 1,
  },
  discountText: {
    color: "#16A34A",
    fontWeight: "700",
  },
  original: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  price: {
    fontWeight: "900",
    color: "#111827",
  },
  pointsWrap: {
    marginTop: 8,
    width: "100%",
  },
});
