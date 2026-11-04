import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getServerNow } from "./splashFrequency";
import { splashLog } from "./splashLog";
import type { SplashCampaign, SplashDismissReason } from "./splashTypes";

export const FADE_MS = 280;
// The artwork was prefetched before this mounts, so it only has to decode.
export const IMAGE_LOAD_TIMEOUT_MS = 3000;
// Used when the CMS sends no usable duration.
export const FALLBACK_DISPLAY_SECONDS = 3;
// Hard ceiling so no configuration can keep a user on the launch artwork.
export const MAX_VISIBLE_MS = 30000;

type Props = {
  campaign: SplashCampaign;
  actionable: boolean;
  onShown: () => void;
  onFinish: (reason: SplashDismissReason) => void;
};

// Plain full-screen View rendered inside the Splash route, over the logo it
// fades in from. Deliberately not a Modal.
function PromotionalSplashScreen({ campaign, actionable, onShown, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const finishedRef = useRef(false);
  const loadedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { display } = campaign;

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, Math.min(Math.max(ms, 0), 2 ** 31 - 1)));
  };

  const finish = useCallback(
    (reason: SplashDismissReason) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      splashLog(reason === "skip" || reason === "back" ? "CAMPAIGN_SKIPPED" : "CAMPAIGN_CLOSED", {
        contentId: campaign.content_id,
        reason,
      });
      onFinish(reason);
    },
    [campaign.content_id, onFinish],
  );

  useEffect(() => {
    const expiresAt = campaign.expires_at ? Date.parse(campaign.expires_at) : NaN;
    if (Number.isFinite(expiresAt)) later(() => finish("expired"), expiresAt - getServerNow());
    later(() => {
      if (!loadedRef.current) finish("image_error");
    }, IMAGE_LOAD_TIMEOUT_MS);

    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (display.dismissible) finish("back");
      // Never let Back fall through to the (not yet mounted) app or exit.
      return true;
    });
    return () => {
      // Interrupted (logout, update notice): nothing may fire after unmount.
      finishedRef.current = true;
      back.remove();
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      opacity.stopAnimation();
    };
    // Runs once per mounted campaign.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = () => {
    if (loadedRef.current || finishedRef.current) return;
    loadedRef.current = true;
    splashLog("IMAGE_LOADED", { contentId: campaign.content_id });
    Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start(({ finished }) => {
      if (!finished || finishedRef.current) return;
      splashLog("FADE_COMPLETED", { contentId: campaign.content_id });
      // Shown-history and the display countdown start only now, with the
      // artwork fully on screen.
      setVisible(true);
      onShown();
      const seconds = display.display_seconds > 0 ? display.display_seconds : FALLBACK_DISPLAY_SECONDS;
      // A non-dismissible campaign always auto-closes, whatever auto_dismiss says.
      if (display.auto_dismiss || !display.dismissible) later(() => finish("auto"), Math.min(seconds * 1000, MAX_VISIBLE_MS));
      later(() => finish("safety"), MAX_VISIBLE_MS);
    });
  };

  const source = { uri: campaign.image_url };

  return (
    <Animated.View style={[styles.root, { opacity }]} testID="promo-splash">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Blurred, dimmed copy fills whatever the contained artwork leaves empty. */}
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" resizeMethod="resize" blurRadius={24} accessible={false} />
      <View style={styles.scrim} />
      <Pressable
        style={[styles.artworkArea, { top: insets.top, bottom: insets.bottom, left: insets.left, right: insets.right }]}
        disabled={!actionable}
        onPress={() => finish("cta")}
        accessibilityRole={actionable ? "button" : "image"}
        accessibilityLabel={campaign.cta_text || campaign.title || "Promotion"}
        testID="promo-splash-artwork"
      >
        <Image
          source={source}
          style={styles.artwork}
          resizeMode="contain"
          resizeMethod="resize"
          onLoad={handleLoad}
          onError={() => finish("image_error")}
          testID="promo-splash-image"
        />
      </Pressable>
      {visible && display.dismissible ? (
        <Pressable
          onPress={() => finish("skip")}
          hitSlop={12}
          style={[styles.skip, { top: insets.top + 12, right: insets.right + 16 }]}
          accessibilityRole="button"
          accessibilityLabel="Skip"
          testID="promo-splash-skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export default React.memo(PromotionalSplashScreen);

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0B0B12" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  artworkArea: { position: "absolute" },
  artwork: { width: "100%", height: "100%" },
  skip: {
    position: "absolute",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.55)",
  },
  skipText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
});
