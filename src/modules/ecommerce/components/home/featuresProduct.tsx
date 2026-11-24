import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo } from "react";
import { AppState, ImageBackground, I18nManager, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { fetchActiveFeaturedCampaign, type FeaturedCampaignProduct } from "../../api/ProductApi";
import { normalizeProduct } from "../../utils/normalizeProduct";
import { PROMO_CARD_GAP } from "../../constants/cardLayout";
import HomeSectionSkeleton from "./HomeSectionSkeleton";
import { queryClient } from "../../../../query/queryClient";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const FEATURED_CAMPAIGN_QUERY_KEY = ["ecommerce", "home", "featured-campaign"] as const;
const FEATURED_CAMPAIGN_STALE_TIME = 30 * 1000;
const FEATURED_CAMPAIGN_REFRESH_INTERVAL = 60 * 1000;

const normalizeCampaignColor = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const color = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : undefined;
};

const parseHexColor = (color: string) => {
  const hex = color.slice(1);
  const expanded = hex.length === 3
    ? hex.split("").map(channel => `${channel}${channel}`).join("")
    : hex;
  if (expanded.length !== 6) return undefined;
  return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16));
};

const getLuminance = (color: string) => {
  const rgb = parseHexColor(color);
  if (!rgb) return 0.5;
  const channels = rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (first: string, second: string) => {
  const values = [getLuminance(first), getLuminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

const getReadableTextColor = (configured: string | undefined, backgrounds: string[]) => {
  if (configured && backgrounds.every(color => contrastRatio(configured, color) >= 4.5)) {
    return configured;
  }
  const dark = "#111827";
  const light = "#FFFFFF";
  const darkContrast = Math.min(...backgrounds.map(color => contrastRatio(dark, color)));
  const lightContrast = Math.min(...backgrounds.map(color => contrastRatio(light, color)));
  return darkContrast >= lightContrast ? dark : light;
};

export default function FeaturesProduct() {
  const { t: translateUi } = useTranslation('common');
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();

  const { data: campaign, isLoading } = useQuery({
    queryKey: FEATURED_CAMPAIGN_QUERY_KEY,
    queryFn: fetchActiveFeaturedCampaign,
    staleTime: FEATURED_CAMPAIGN_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchInterval: FEATURED_CAMPAIGN_REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener("change", nextState => {
      if (previousState !== "active" && nextState === "active") {
        queryClient.invalidateQueries({ queryKey: FEATURED_CAMPAIGN_QUERY_KEY });
      }
      previousState = nextState;
    });

    return () => subscription.remove();
  }, []);

  const products = useMemo(
    () => {
      const seen = new Set<string>();
      return (Array.isArray(campaign?.products) ? campaign.products : [])
        .filter((product): product is FeaturedCampaignProduct => {
          const id = product?.product_id;
          if (id === undefined || id === null || String(id).trim() === "") return false;
          const key = String(id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 10)
        .map(product => normalizeProduct({ ...product, id: product.product_id }));
    },
    [campaign?.products]
  );

  const firstRow = useMemo(() => products.slice(0, 5), [products]);
  const secondRow = useMemo(() => products.slice(5, 10), [products]);
  const cardWidth = Math.round(Math.min(width - 32, Math.max(120, width >= 768 ? width * 0.22 : width * 0.42)));

  const handleExplore = useCallback(() => {
    if (!campaign) return;
    navigation.navigate("FeaturedCampaignProducts", {
      campaignId: campaign.campaign_id,
      title: campaign.title,
    });
  }, [campaign, navigation]);

  const handleProductPress = useCallback((productId: string | number, item: any) => {
    if (!campaign) return;
    navigation.navigate("ProductDescription", {
      productId,
      variantId: item?.variant_id ?? item?.variantId,
      campaignId: campaign.campaign_id,
    });
  }, [campaign, navigation]);

  const renderCard = React.useCallback(
    ({ item, shouldLoadImage }: { item: any; index: number; shouldLoadImage: boolean }) => (
      <ProductCard
        item={item}
        cardWidth={cardWidth}
        shouldLoadImage={shouldLoadImage}
        onProductPress={handleProductPress}
      />
    ),
    [cardWidth, handleProductPress]
  );

  if (isLoading && !campaign) {
    return <HomeSectionSkeleton height={620} backgroundColor={theme.background} />;
  }

  if (!campaign || products.length === 0) return null;

  const background = campaign.background;
  const configuredColors = Array.isArray(background?.colors)
    ? background.colors.map(normalizeCampaignColor).filter((color): color is string => Boolean(color))
    : [];
  const firstColor = configuredColors[0] ?? normalizeCampaignColor(theme.background) ?? "#FFFFFF";
  const backgroundType = background?.type;
  const gradientColors: [string, string] = [
    firstColor,
    backgroundType === "gradient" ? configuredColors[1] ?? firstColor : firstColor,
  ];
  const imageUrl = typeof background?.image_url === "string" &&
    /^https:\/\/[^/]+/i.test(background.image_url.trim())
    ? background.image_url.trim()
    : undefined;
  const useImage = backgroundType === "image" && Boolean(imageUrl);
  const useGradient = backgroundType === "gradient";
  const normalizedTextColor = normalizeCampaignColor(background?.text_color);
  const textColor = useImage
    ? normalizedTextColor ?? "#FFFFFF"
    : getReadableTextColor(normalizedTextColor, useGradient ? gradientColors : [firstColor]);
  const lightText = getLuminance(textColor) > 0.5;
  const ctaLabel = campaign.cta_text?.trim() || translateUi('common:exploreMore');
  const title = typeof campaign.title === "string" ? campaign.title.trim() : "";
  const ctaBackground = lightText ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.82)";
  const availableHeaderWidth = Math.max(width - 32, 0);
  const estimatedTitleWidth = title.length * 9.2 * fontScale;
  const estimatedCtaWidth = Math.min(
    availableHeaderWidth * 0.46,
    ctaLabel.length * 6.8 * fontScale + 46,
  );
  const stackHeader =
    availableHeaderWidth < estimatedTitleWidth + estimatedCtaWidth + 12;

  const sectionContent = (
    <View style={styles.contentWrap}>
        <View
          style={[
            styles.headerRow,
            stackHeader && styles.headerStacked,
            !stackHeader && I18nManager.isRTL && styles.headerRowRtl,
          ]}
        >
          <View style={styles.headingWrap}>
            <Text
              numberOfLines={stackHeader ? 2 : 1}
              ellipsizeMode="tail"
              style={[styles.heading, { color: textColor }, I18nManager.isRTL && styles.rtlText]}
            >
              {title}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.exploreBtn,
              stackHeader && styles.exploreBtnStacked,
              stackHeader
                ? (I18nManager.isRTL ? styles.stackedCtaRtl : styles.stackedCtaLtr)
                : I18nManager.isRTL && styles.ctaRtl,
              { backgroundColor: ctaBackground },
            ]}
            activeOpacity={0.76}
            onPress={handleExplore}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text
              numberOfLines={stackHeader ? 2 : 1}
              adjustsFontSizeToFit={!stackHeader}
              style={[styles.exploreText, { color: textColor }, I18nManager.isRTL && styles.rtlText]}
            >
              {ctaLabel}
            </Text>
            <MaterialIcons
              name="arrow-forward-ios"
              size={14}
              color={textColor}
              style={I18nManager.isRTL && styles.rtlArrow}
            />
          </TouchableOpacity>
        </View>
        <HorizontalProductList
          data={firstRow}
          itemWidth={cardWidth}
          gap={PROMO_CARD_GAP}
          estimatedItemSize={cardWidth + PROMO_CARD_GAP}
          keyExtractor={item => String(item.product_id)}
          renderCard={renderCard}
        />
        {secondRow.length > 0 ? (
          <HorizontalProductList
            data={secondRow}
            itemWidth={cardWidth}
            gap={PROMO_CARD_GAP}
            estimatedItemSize={cardWidth + PROMO_CARD_GAP}
            keyExtractor={item => String(item.product_id)}
            renderCard={renderCard}
          />
        ) : null}
      </View>
  );

  if (useImage && imageUrl) {
    return (
      <ImageBackground
        source={{ uri: imageUrl }}
        resizeMode="cover"
        style={styles.background}
      >
        <LinearGradient
          colors={lightText
            ? ["rgba(0,0,0,0.18)", "rgba(0,0,0,0.34)"]
            : ["rgba(255,255,255,0.26)", "rgba(255,255,255,0.42)"]}
          style={styles.imageOverlay}
        >
          {sectionContent}
        </LinearGradient>
      </ImageBackground>
    );
  }

  return useGradient
    ? <LinearGradient colors={gradientColors} style={styles.background}>{sectionContent}</LinearGradient>
    : <View style={[styles.background, { backgroundColor: firstColor }]}>{sectionContent}</View>;
}

export const prefetchFeaturesProductSection = () =>
  queryClient.prefetchQuery({
    queryKey: FEATURED_CAMPAIGN_QUERY_KEY,
    queryFn: fetchActiveFeaturedCampaign,
    staleTime: FEATURED_CAMPAIGN_STALE_TIME,
  });

// ================== RESPONSIVE STYLES ==================
const styles = StyleSheet.create({
  background: {
    width: "100%",
    marginTop: 12,
  },
  imageOverlay: {
    width: "100%",
  },
  contentWrap: { paddingBottom: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 14,
    gap: 12,
  },
  headerStacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  headerRowRtl: {
    flexDirection: "row-reverse",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  rtlText: {
    textAlign: "right",
  },
  headingWrap: {
    flex: 1,
    minWidth: 0,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 16,
    maxWidth: "46%",
    flexShrink: 0,
    gap: 4,
  },
  exploreBtnStacked: {
    maxWidth: "100%",
  },
  stackedCtaLtr: {
    alignSelf: "flex-end",
  },
  stackedCtaRtl: {
    alignSelf: "flex-start",
  },
  ctaRtl: {
    flexDirection: "row-reverse",
  },
  rtlArrow: {
    transform: [{ rotate: "180deg" }],
  },
  exploreText: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
});
