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
import AddToCartButton from "./AddToCartButton";
import { checkWishlist, isWishlistPresent, setWishlistState } from "../../api/WishlistApi";
import OptimizedImage from "../../components/common/OptimizedImage";
import { normalizeProduct } from "../../utils/normalizeProduct";
import { fetchProductDetailsByID } from "../../api/ProductApi";
import { useAppTheme } from "../../../../theme/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

const PADDING = screenWidth * 0.03;
const GAP = screenWidth * 0.02;
const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;
const RP_PRICE_COLOR = "#F2811D";
type Nav = NativeStackNavigationProp<HomeStackParamList>;

type Props = {
  item: any;
  cardWidth?: number;
  shouldLoadImage?: boolean;
  onProductPress?: (productId: string | number, item: any) => void;
  onAddToCart?: (productId: string | number, item: any) => void;
};

const getProductId = (item: any) => item?.id ?? item?.product_id ?? item?.productId;
const getVariantId = (item: any) =>
  item?.variant_id ??
  item?.variantId ??
  item?.default_variant_id ??
  item?.variants?.[0]?.variant_id ??
  item?.variants?.[0]?.id;
const getProductImage = (item: any) =>
  item?.image ??
  item?.image_url ??
  item?.thumbnail ??
  (Array.isArray(item?.images) ? item.images[0] : undefined);

const hasWishlistFlag = (item: any) =>
  item?.is_wishlist !== undefined || item?.is_wishlisted !== undefined;

const getWishlistFlag = (item: any) => {
  const value = item?.is_wishlisted ?? item?.is_wishlist;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
};

const StarRating = React.memo(function StarRating({
  starCount,
}: {
  starCount: number;
}) {
  const filledStars = "★".repeat(starCount);
  const emptyStars = "★".repeat(Math.max(0, 5 - starCount));

  return (
    <Text style={styles.starText} numberOfLines={1}>
      <Text style={styles.starTextFilled}>{filledStars}</Text>
      <Text style={styles.starTextEmpty}>{emptyStars}</Text>
    </Text>
  );
});

const ProductCardComponent = ({
  item,
  cardWidth,
  shouldLoadImage = true,
  onProductPress,
  onAddToCart,
}: Props) => {
  const navigation = useNavigation<Nav>();
  const { isDark, theme } = useAppTheme();
  const [wishLoading, setWishLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(() => getWishlistFlag(item));
  const [resolvedVariantId, setResolvedVariantId] = useState<any>(() => getVariantId(item));

  const usedCardWidth = cardWidth ?? CARD_WIDTH;
  const normalizedProduct = useMemo(() => normalizeProduct(item), [item]);

  const productId = getProductId(item);
  const variantId = getVariantId(item);

  // Responsive size calculations based on actual card width
  const calculations = useMemo(() => ({
    imageDynamicSize: Math.round(Math.min(Math.max(usedCardWidth * 0.88, 56), 104)),
    borderRadius: Math.round(usedCardWidth * 0.06),
    imageWrapHeight: Math.round(Math.min(Math.max(usedCardWidth * 1.02, 104), 132)),
    cardMinHeight: Math.round(Math.min(Math.max(usedCardWidth * 2.18, 238), 286)),
    fontSizeLabel: Math.max(11, Math.round(usedCardWidth * 0.07)),
    fontSizeReview: Math.max(9, Math.round(usedCardWidth * 0.066)),
    fontSizePrice: Math.max(12, Math.round(usedCardWidth * 0.096)),
    fontSizeOriginal: Math.max(9, Math.round(usedCardWidth * 0.065)),
    fontSizeDiscount: Math.max(9, Math.round(usedCardWidth * 0.07)),
  }), [usedCardWidth]);

  const goToDetails = useCallback(() => {
    if (!productId) return;
    if (onProductPress) {
      onProductPress(productId, item);
      return;
    }
    navigation.navigate("ProductDescription", { productId });
  }, [item, navigation, onProductPress, productId]);

  const handleAddToCart = useCallback(() => {
    if (!productId) return;
    if (onAddToCart) {
      onAddToCart(productId, item);
      return;
    }
    goToDetails();
  }, [goToDetails, item, onAddToCart, productId]);

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
    setWishlisted(getWishlistFlag(item));
    setResolvedVariantId(variantId);
  }, [item, productId, variantId]);

  useEffect(() => {
    const parsedProductId = Number(productId);
    const initialVariantId = Number(variantId);

    if (
      hasWishlistFlag(item) ||
      !shouldLoadImage ||
      !parsedProductId ||
      Number.isNaN(parsedProductId)
    ) {
      return;
    }

    let cancelled = false;

    const syncWishlistState = async () => {
      const candidateVariantIds: number[] = [];
      const addCandidate = (value: unknown) => {
        const parsed = Number(value);
        if (parsed && !Number.isNaN(parsed) && !candidateVariantIds.includes(parsed)) {
          candidateVariantIds.push(parsed);
        }
      };

      addCandidate(initialVariantId);

      if (candidateVariantIds.length === 0) {
        try {
          const details = await fetchProductDetailsByID(parsedProductId);
          addCandidate(details?.default_variant_id);
          addCandidate(details?.variant_id);

          const variants = Array.isArray(details?.variants) ? details.variants : [];
          variants.forEach((variant: any) => addCandidate(variant?.variant_id ?? variant?.id));
        } catch {
          return;
        }
      }

      for (const candidateVariantId of candidateVariantIds) {
        try {
          const response = await checkWishlist(parsedProductId, candidateVariantId);

          if (cancelled) return;

          if (isWishlistPresent(response)) {
            setResolvedVariantId(candidateVariantId);
            setWishlisted(true);
            return;
          }
        } catch {
          // Ignore auth/check failures and keep the list-provided flag.
        }
      }

      if (!cancelled) {
        setWishlisted(false);
      }

      if (!cancelled && candidateVariantIds[0]) {
        setResolvedVariantId(candidateVariantIds[0]);
      }
    };

    syncWishlistState();

    return () => {
      cancelled = true;
    };
  }, [item, productId, shouldLoadImage, variantId]);

  const handleWishlist = useCallback(async () => {
    if (wishLoading) return;

    const parsedProductId = Number(productId);
    const parsedVariantId = Number(resolvedVariantId ?? variantId);

    if (!parsedProductId || Number.isNaN(parsedProductId)) {
      Alert.alert("Wishlist", "Invalid product");
      return;
    }

    if (!parsedVariantId || Number.isNaN(parsedVariantId)) {
      Alert.alert("Wishlist", "Product variant is missing");
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
        error?.message ||
        "Failed to update wishlist";
      Alert.alert("Wishlist", String(message));
    } finally {
      setWishLoading(false);
    }
  }, [productId, resolvedVariantId, variantId, wishLoading, wishlisted]);

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
    brandText,
    productNameText,
    priceText,
    originalPriceText,
    rpPriceText,
    discount,
  } = useMemo(() => {
    const ratingValue = Number(normalizedProduct.rating ?? 4.5);
    const safeRating = Number.isFinite(ratingValue)
      ? Math.max(0, Math.min(5, ratingValue))
      : 4.5;

    // Backend sends null/0 when no redemption rule applies to this product —
    // treat those (and their string forms) as "no RP price" rather than "₹0".
    const rawRpPrice = String(normalizedProduct.rp_price ?? "").trim();
    const hasRpPrice = !!rawRpPrice && !["0", "0.00", "null", "undefined"].includes(rawRpPrice.toLowerCase());
    if (__DEV__ && !hasRpPrice) {
      console.log('[ProductCard] No RP price for product', getProductId(item), {
        rp_price: item?.rp_price,
        rpPrice: item?.rpPrice,
        redeem_coins: item?.redeem_coins,
      });
    }
    const formattedRpPrice = hasRpPrice
      ? (/[₹]|rs\.?/i.test(rawRpPrice) ? rawRpPrice : `₹${rawRpPrice}`)
      : "";

    return {
      starCount: Math.round(safeRating),
      reviewText: normalizedProduct.reviews ? `(${normalizedProduct.reviews})` : "",
      brandText: item?.brand || item?.brand_name || "",
      productNameText: item?.product_name || item?.title || "",
      priceText: String(normalizedProduct.price ?? ""),
      originalPriceText: String(normalizedProduct.originalPrice ?? ""),
      rpPriceText: formattedRpPrice,
      discount: normalizedProduct.discount ?? "",
    };
  }, [item, normalizedProduct]);

  return (
    <View
      style={[
        styles.card,
        {
          width: usedCardWidth,
          minHeight: calculations.cardMinHeight,
          borderRadius: calculations.borderRadius,
          backgroundColor: theme.card,
          borderWidth: isDark ? 1 : 0,
          borderColor: theme.border,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={goToDetails}>
        <View style={[
          styles.imageWrap,
          {
            height: calculations.imageWrapHeight,
            borderRadius: calculations.borderRadius,
            paddingTop: Math.round(usedCardWidth * 0.1),
            backgroundColor: isDark ? "#303038" : "#F9FAFB",
          },
        ]}>
          {/* Discount badge, top-left over the image */}
          {!!discount && (
            <View style={styles.discountBadgeWrap}>
              <View style={styles.discountBadge}>
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
            </View>
          )}

          <TouchableOpacity
            style={[styles.heartIcon, { backgroundColor: isDark ? "rgba(38,38,43,0.92)" : "rgba(255,255,255,0.9)" }]}
            activeOpacity={0.85}
            onPress={handleWishlistPress}
            disabled={wishLoading}
          >
            <FontAwesome
              name={wishlisted ? "heart" : "heart-o"}
              size={14}
              color={wishlisted ? "#E53935" : theme.secondaryText}
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
        {/* Brand name up front, with rating alongside it */}
        <View style={styles.brandRow}>
          <Text
            style={[styles.brandName, { fontSize: calculations.fontSizeLabel, color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {brandText}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating starCount={starCount} />
            {!!reviewText && (
              <Text style={[styles.reviews, { fontSize: calculations.fontSizeReview, color: theme.secondaryText }]}>
                {reviewText}
              </Text>
            )}
          </View>
        </View>

        {/* Product name under the brand name */}
        <Text
          style={[
            styles.productTitle,
            { fontSize: calculations.fontSizeLabel, color: theme.secondaryText },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {productNameText}
        </Text>

        {/* ========== RP PRICE + MRP ROW ========== */}
        <View style={styles.priceRow}>
          {/* RP price (falls back to the plain price when no RP price exists) */}
          <Text
            numberOfLines={1}
            style={[
              styles.price,
              {
                fontSize: calculations.fontSizePrice,
                color: rpPriceText ? RP_PRICE_COLOR : theme.text,
              },
            ]}
          >
            {rpPriceText ? `RP ${rpPriceText}` : priceText}
          </Text>

          {/* MRP (strikethrough) */}
          {!!originalPriceText && (
            <Text
              numberOfLines={1}
              style={[styles.original, { fontSize: calculations.fontSizeOriginal, color: theme.secondaryText }]}
            >
              {originalPriceText}
            </Text>
          )}
        </View>

        <View style={styles.pointsWrap}>
          <AddToCartButton onPress={handleAddToCart} />
        </View>
      </View>
    </View>
  );
};

// Memoized export
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  const prevItem = prevProps.item;
  const nextItem = nextProps.item;

  return (
    getProductId(prevItem) === getProductId(nextItem) &&
    prevItem?.is_wishlist === nextItem?.is_wishlist &&
    prevItem?.is_wishlisted === nextItem?.is_wishlisted &&
    prevProps.cardWidth === nextProps.cardWidth &&
    prevItem?.discount === nextItem?.discount &&
    prevItem?.discount_percent === nextItem?.discount_percent &&
    prevItem?.rp_price === nextItem?.rp_price &&
    prevItem?.rpPrice === nextItem?.rpPrice &&
    prevItem?.price === nextItem?.price &&
    prevItem?.selling_price === nextItem?.selling_price &&
    prevItem?.final_price === nextItem?.final_price &&
    prevItem?.originalPrice === nextItem?.originalPrice &&
    prevItem?.original_price === nextItem?.original_price &&
    prevItem?.mrp === nextItem?.mrp &&
    getProductImage(prevItem) === getProductImage(nextItem) &&
    prevItem?.product_name === nextItem?.product_name &&
    prevItem?.title === nextItem?.title &&
    prevItem?.brand === nextItem?.brand &&
    prevItem?.brand_name === nextItem?.brand_name &&
    prevProps.shouldLoadImage === nextProps.shouldLoadImage &&
    prevProps.onProductPress === nextProps.onProductPress &&
    prevProps.onAddToCart === nextProps.onAddToCart
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
  discountBadgeWrap: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 10,
  },
  discountBadge: {
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  brandName: {
    fontWeight: "700",
    flexShrink: 1,
  },
  productTitle: {
    color: "#374151",
    fontWeight: "400",
    lineHeight: 17,
    minHeight: 34,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },
  starText: {
    fontSize: 10,
    lineHeight: 12,
    includeFontPadding: false,
    letterSpacing: -0.5,
  },
  starTextFilled: {
    color: "#FFC514",
  },
  starTextEmpty: {
    color: "#E5E7EB",
  },
  reviews: {
    color: "#9CA3AF",
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    width: "100%",
    marginTop: 6,
    columnGap: 6,
    rowGap: 4,
  },
  original: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  price: {
    fontWeight: "700",
    color: "#111827",
  },
  pointsWrap: {
    marginTop: 8,
    width: "100%",
  },
});
