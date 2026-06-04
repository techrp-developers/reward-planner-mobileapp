import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  WalletTransaction,
} from "../../ecommerce/api/WalleteAPI";
import LinearGradient from 'react-native-linear-gradient';
import RewardIcon from '../../../assets/product/rewards.svg';
import { useAppTheme } from '../../../theme/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RewardsState {
  balance: number;
  expiringCoins: number;
  expiryDate: string | null;
  totalSpent: number;
  totalRedeemed: number;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN")}`;

const formatPts = (pts: number): string =>
  `${pts.toLocaleString("en-IN")} pts`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatColumn: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { theme } = useAppTheme();
  const t = useMemo(() => ({
    statLabel: { color: theme.secondaryText } as TextStyle,
    statValue: { color: theme.text } as TextStyle,
  }), [theme]);

  return (
    <View style={styles.statColumn}>
      <Text style={[styles.statLabel, t.statLabel]}>{label}</Text>
      <Text style={[styles.statValue, t.statValue]}>{value}</Text>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RewardsOverview: React.FC = () => {
  const { isDark, theme } = useAppTheme();
  const navigation = useNavigation();
  const [state, setState] = useState<RewardsState>({
    balance: 0,
    expiringCoins: 0,
    expiryDate: null,
    totalSpent: 0,
    totalRedeemed: 0,
    transactions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        const [balanceRes, creditRes, debitRes] = await Promise.all([
          fetchWalletBalance(),
          fetchWalletTransactions("credit"),
          fetchWalletTransactions("debit"),
        ]);

        const credits = creditRes.success ? creditRes.data : [];
        const debits  = debitRes.success  ? debitRes.data  : [];

        const totalSpent    = credits.reduce((sum, tx) => sum + tx.coins, 0);
        const totalRedeemed = debits.reduce((sum, tx) => sum + tx.coins, 0);

        const allTx = [...credits, ...debits].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setState({
          balance: balanceRes.data.balance,
          expiringCoins: Number(balanceRes.data.expiring_coins ?? 0),
          expiryDate: balanceRes.data.expiry_date ?? null,
          totalSpent,
          totalRedeemed,
          transactions: allTx,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err?.message ?? "Something went wrong",
        }));
      }
    };
    load();
  }, []);

  const t = useMemo(() => ({
    screen:        { backgroundColor: theme.background } as ViewStyle,
    centered:      { backgroundColor: theme.background } as ViewStyle,
    loadingText:   { color: theme.secondaryText } as TextStyle,
    card:          { backgroundColor: theme.card, shadowColor: isDark ? "#000000" : PURPLE } as ViewStyle,
    cardTitle:     { color: theme.text } as TextStyle,
    statsRow:      { borderBottomColor: theme.border } as ViewStyle,
    statDivider:   { backgroundColor: theme.border } as ViewStyle,
    savingsBanner: { backgroundColor: isDark ? theme.card : "#F3F1FF" } as ViewStyle,
  }), [isDark, theme]);

  // ── Loading ──
  if (state.loading) {
    return (
      <View style={[styles.centered, t.centered]}>
        <ActivityIndicator size="large" color="#8665FF" />
        <Text style={[styles.loadingText, t.loadingText]}>Loading rewards…</Text>
      </View>
    );
  }

  // ── Error ──
  if (state.error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>⚠ {state.error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, t.screen]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ══ OVERVIEW CARD ══ */}
      <View style={[styles.card, t.card]}>
        {/* Trophy emoji – top-right */}
        <View style={styles.rewardIconContainer}>
          <RewardIcon width={50} height={50} />
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, t.cardTitle]}>Your Rewards Overview</Text>

        {/* Stats row */}
        <View style={[styles.statsRow, t.statsRow]}>
          <StatColumn label="Rewards Earned" value={formatPts(state.balance)} />
          <View style={[styles.statDivider, t.statDivider]} />
          <StatColumn label="Total Spent" value={formatINR(state.totalSpent)} />
          <View style={[styles.statDivider, t.statDivider]} />
          <StatColumn label="Total Redeemed" value={formatINR(state.totalRedeemed)} />
        </View>

        {/* Savings banner */}
        <View style={[styles.savingsBanner, t.savingsBanner]}>
          <Text style={styles.savingsArrow}>↗</Text>
          <Text style={styles.savingsText}>
            {"You saved "}
            <Text style={styles.savingsAmount}>{formatINR(state.totalSpent)}</Text>
            {" this month"}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <LinearGradient
            colors={["#8665FF", "#5B47A3"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={[styles.primaryBtn, { borderRadius: 14 }]}
          >
            <TouchableOpacity
              style={styles.primaryBtnInner}
              activeOpacity={0.85}
              onPress={() => { navigation.navigate("WalletHistory" as never); }}
            >
              <Text style={styles.primaryBtnText}>View Rewards</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
};

export default RewardsOverview;

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const PURPLE      = "#8665FF";
const PURPLE_DARK = "#5B47A3";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // backgroundColor via t.screen
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    // backgroundColor via t.centered
  },
  loadingText: {
    fontSize: 14,
    // color via t.loadingText
  },
  errorBox: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    fontSize: 14,
    color: "#C0392B",
  },

  card: {
    // backgroundColor & shadowColor via t.card
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  rewardIconContainer: {
    position: "absolute",
    top: 12,
    right: 14,
    width: 50,
    height: 50,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    // color via t.cardTitle
    marginBottom: 18,
    paddingRight: 56,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    // borderBottomColor via t.statsRow
    marginBottom: 14,
  },
  statColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
    // color via StatColumn t.statLabel
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    // color via StatColumn t.statValue
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    // backgroundColor via t.statDivider
    marginHorizontal: 4,
  },

  expiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8ED",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FFE4B0",
    gap: 8,
    display: "none",
  },
  expiryIcon: { fontSize: 15 },
  expiryText: { fontSize: 13, color: "#8B5E0A", flex: 1 },
  expiryBold: { fontWeight: "700" },

  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor via t.savingsBanner
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  savingsArrow: {
    fontSize: 16,
    color: PURPLE_DARK,
    fontWeight: "700",
  },
  savingsText: {
    fontSize: 13,
    color: PURPLE_DARK,
    flex: 1,
  },
  savingsAmount: {
    fontWeight: "700",
    color: "#3D2E8A",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  primaryBtnInner: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  ghostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: PURPLE,
    textDecorationLine: "underline",
  },
  trophy: {
    position: "absolute",
    top: 12,
    right: 14,
    fontSize: 42,
  },
});
