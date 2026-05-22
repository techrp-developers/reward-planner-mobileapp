import { Dimensions, Platform, StatusBar } from "react-native";

const { width, height } = Dimensions.get("screen"); // 👈 use "screen" not "window" for consistent sizing

const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844; // iPhone 13 height

const scale = (size: number) => (width / guidelineBaseWidth) * size;

const moderateScale = (size: number, factor = 0.25) => // 👈 reduced from 0.4 to 0.25 — less aggressive shrink
  size + (scale(size) - size) * factor;

const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

export const isTablet = width >= 768;

export const COLORS = {
  primaryPink: "#FF7FB1",
  primaryPurple: "#7C4DFF",
  primaryIndigo: "#714DF5",
  primary: "#714DF5",
  deepIndigo: "#422D8F",
  bgVeryLight: "#F7F3FF",
  surface: "#FFFFFF",
  surfaceSoft: "rgba(255,255,255,0.94)",
  border: "rgba(113,77,245,0.18)",
  textDark: "#111827",
  textMedium: "#4B5563",
  textMuted: "#6B7280",
  textWhite: "#FFFFFF",
  success: "#10B981",
  warning: "#F97316",
  gradientWelcome: ["#FFFFFF", "#F5F0FF", "#EEF7FF"],
  gradientCard: ["#FFFFFF", "#F7F2FF", "#EEF7FF"],
  gradientPurple: ["#714DF5", "#5B3BC7", "#422D8F"],
  gradientPink: ["#FF7FB1", "#C45BD6", "#714DF5"],
  gradientScreen: ["#BAE6FD", "#E0F2FE", "#8665FF"],
};

export const SPACING = {
  xs: moderateScale(6),
  sm: moderateScale(10),
  md: moderateScale(14),
  lg: moderateScale(18),
  xl: moderateScale(24),
  xxl: moderateScale(32),
};

export const BORDER_RADIUS = {
  medium: moderateScale(12),
  large: moderateScale(16),
  xl: moderateScale(26),
  pill: 999,
};

export const RESPONSIVE = {
  horizontalPadding: Math.max(16, Math.min(28, width * 0.05)), // 👈 slightly tighter for small screens

  cardWidth: "100%" as const,
  cardMaxWidth: 430,

  buttonHeight: Platform.select({
    ios: Math.max(48, moderateScale(52)),   // 👈 iOS: never go below 48
    android: moderateScale(52),
  }) as number,

  iconMedium: moderateScale(26),

  screenWidth: width,
  screenHeight: height,
};

export const TYPOGRAPHY = {
  h2: {
    fontSize: moderateScale(26),
    lineHeight: moderateScale(34),          // 👈 increased — iOS clips tight lineHeight
    fontWeight: "800" as const,
    includeFontPadding: false,              // 👈 fixes Android extra font spacing
  },
  h3: {
    fontSize: moderateScale(22),
    lineHeight: moderateScale(30),          
    fontWeight: "800" as const,
    includeFontPadding: false,
  },
  body: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),          
    fontWeight: "500" as const,
    includeFontPadding: false,
  },
  bodyMedium: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(23),   
    fontWeight: "700" as const,
    includeFontPadding: false,
  },
  caption: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),          // 👈 increased
    fontWeight: "600" as const,
    includeFontPadding: false,
  },
};

export const SHADOWS = {
  large: Platform.select({
    ios: {
      shadowColor: "#5B47A3",
      shadowOpacity: 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 8 },
  }),
  card: Platform.select({
    ios: {
      shadowColor: "#5B47A3",
      shadowOpacity: 0.14,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 6 },
  }),
  small: Platform.select({
    ios: {
      shadowColor: "#5B47A3",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 3 },
  }),
};

export const fitnessCardStyle = {
  width: RESPONSIVE.cardWidth,
  maxWidth: RESPONSIVE.cardMaxWidth,
  borderRadius: BORDER_RADIUS.xl,
  paddingVertical: SPACING.xl,
  paddingHorizontal: SPACING.lg,
  borderWidth: 1,
  borderColor: COLORS.border,
  ...SHADOWS.card,
};