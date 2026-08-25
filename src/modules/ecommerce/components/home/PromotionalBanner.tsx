import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image as RNImage,
  Linking,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { normalizeLocalCmsImageUrl } from "../../../../config/apiConfig";
import { useProductContent } from "../../hooks/useProductContent";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = width * 0.42;

// Emergency fallback only — shown when the CMS has no promotional_banner
// entry at all (network failure, nothing published yet). The CMS
// content_type: "color" default entry renders through the normal color
// branch below, not this one.
const FALLBACK_TITLE = "Big Savings. Bigger Smiles.";
const FALLBACK_GRADIENT_LIGHT = ["#A95ACD", "#FC8BAD"];
const FALLBACK_GRADIENT_DARK = ["#18181B", "#3B0764", "#BE185D"];

function PromotionalBanner() {
  const { isDark } = useAppTheme();
  const { productContent, isLoading, isError } = useProductContent();
  const banner = productContent?.promotional_banner ?? null;

  const [imageFailed, setImageFailed] = React.useState(false);

  // Reset the failure flag whenever the CMS points at a different image, so
  // a newly published campaign gets a fresh chance to load.
  const rawBannerImageUrl = banner?.content_type === "image" ? banner.image_url : null;
  const bannerImageUrl = React.useMemo(
    () => normalizeLocalCmsImageUrl(rawBannerImageUrl),
    [rawBannerImageUrl]
  );
  const prevImageUrlRef = React.useRef(bannerImageUrl);
  React.useEffect(() => {
    if (prevImageUrlRef.current !== bannerImageUrl) {
      prevImageUrlRef.current = bannerImageUrl;
      setImageFailed(false);
    }
  }, [bannerImageUrl]);

  React.useEffect(() => {
    if (!__DEV__) return;
    console.log("[CMS] Product content loaded", { isLoading, isError });
    console.log("[CMS] Promotional banner:", banner);
    console.log("[CMS] Promotional banner raw image URL:", rawBannerImageUrl);
    console.log("[CMS] Promotional banner final image URL:", bannerImageUrl);
  }, [banner, bannerImageUrl, isLoading, isError, rawBannerImageUrl]);

  const handlePress = React.useCallback(() => {
    if (banner?.redirect_link) {
      Linking.openURL(banner.redirect_link).catch(() => undefined);
    }
  }, [banner?.redirect_link]);

  const showRemoteImage = banner?.content_type === "image" && !!bannerImageUrl && !imageFailed;
  const showColor = !showRemoteImage && !!banner?.color_value;
  const title = banner?.title || (showColor || showRemoteImage ? undefined : FALLBACK_TITLE);
  const Wrapper = banner?.redirect_link ? TouchableOpacity : View;

  return (
    <View style={styles.wrapper}>
      <Wrapper
        activeOpacity={0.9}
        onPress={banner?.redirect_link ? handlePress : undefined}
        style={styles.bannerBox}
      >
        {/* Base fill always shows through — a CMS color, or the app default
            gradient — so a slow/failed image never leaves a blank box. */}
        {showColor ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: banner!.color_value! }]} />
        ) : (
          <LinearGradient
            colors={isDark ? FALLBACK_GRADIENT_DARK : FALLBACK_GRADIENT_LIGHT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {showRemoteImage ? (
          <RNImage
            source={{ uri: bannerImageUrl! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoad={() => {
              if (__DEV__) {
                console.log("[CMS] Promotional banner image loaded", {
                  url: bannerImageUrl,
                });
              }
            }}
            onError={(error) => {
              if (__DEV__) {
                console.error("[CMS] Promotional banner image failed", {
                  url: bannerImageUrl,
                  error,
                });
              }
              setImageFailed(true);
            }}
          />
        ) : null}

        {(title || banner?.cta_text) && (
          <View style={styles.textBlock}>
            {!!title && (
              <Text style={styles.bannerTitle} numberOfLines={2}>
                {title}
              </Text>
            )}

            {!!banner?.cta_text && (
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>{banner.cta_text}</Text>
              </View>
            )}
          </View>
        )}
      </Wrapper>
    </View>
  );
}

export default React.memo(PromotionalBanner);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  bannerBox: {
    height: BANNER_HEIGHT,
    justifyContent: "flex-end",
    borderRadius: 22,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  textBlock: {
    padding: 16,
  },

  bannerTitle: {
    fontSize: width * 0.05,
    fontWeight: "700",
    color: "#fff",
    lineHeight: width * 0.065,
  },

  ctaButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  ctaText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
});
