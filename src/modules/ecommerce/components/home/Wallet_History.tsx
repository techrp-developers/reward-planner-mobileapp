import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Reward from "../../../../assets/product/rewards.svg";

import {
  fetchWalletBalance,
  fetchWalletTransactions,
} from "../../api/WalleteAPI";
import ProductHeadColor from "../../constants/heading/Poduct_Head_Color";

type Transaction = {
  id: string;
  orderNo: string;
  txnId?: string;
  title: string;
  subtitle?: string;
  date: string;
  coins: number;
  icon: string;
  iconBg: string;
};

const FILTERS = ["All Transactions", "Additions", "Deductions", "Expired"];

export default function WalletHistoryScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState("All Transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [expiringCoins, setExpiringCoins] = useState(0);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getType = (filter: string) => {
    if (filter === "Additions") return "credit";
    if (filter === "Deductions") return "debit";
    if (filter === "Expired") return "expired";
    return "all";
  };

  const loadData = async (type: any = "all") => {
    try {
      setLoading(true);

      const [balanceRes, txnRes] = await Promise.all([
        fetchWalletBalance(),
        fetchWalletTransactions(type),
      ]);

      setBalance(balanceRes?.data?.balance || 0);
      setExpiringCoins(balanceRes?.data?.expiring_coins || 0);
      setExpiryDate(balanceRes?.data?.expiry_date || null);

      const mapped = txnRes.data.map((txn: any) => ({
        id: String(txn.transaction_id),
        orderNo: txn.transaction_id,
        txnId: txn.transaction_id,
        title: txn.title,
        subtitle: txn.description,
        date: new Date(txn.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        coins:
          txn.transaction_type === "credit"
            ? txn.coins
            : -txn.coins,
        icon:
          txn.transaction_type === "credit"
            ? "file-document-outline"
            : "package-variant-closed",
        iconBg:
          txn.transaction_type === "credit"
            ? "#4F75FF"
            : "#A67B5B",
      }));

      setTransactions(mapped);
    } catch (err) {
      console.log("Wallet error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData("all");
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(getType(activeFilter));
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* WALLET CARD */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={["#714DF3", "#4D34A6"]}
          style={styles.walletTop}
        >
          <View style={styles.leftSection}>
            <Reward width={32} height={32} />
            <View style={styles.balanceBlock}>
              <Text style={styles.label}>My Balance</Text>
              <Text style={styles.balance}>{balance} Coins</Text>
            </View>
          </View>

          <View style={styles.rateBox}>
            <Text style={styles.rateText}>1 </Text>
            <Reward width={14} height={14} />
            <Text style={styles.rateText}> = ₹1</Text>
          </View>
        </LinearGradient>

        {/* EXPIRY STRIP */}
        <View style={styles.expiryStrip}>
          <View style={styles.expiryLeft}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={18}
              color="#F97316"
            />
            <Text style={styles.expiryText}>
              {expiringCoins} RP Coins Expiring
            </Text>
          </View>

          <Text style={styles.expiryDate}>
            Expiry:{" "}
            {expiryDate
              ? new Date(expiryDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "N/A"}
          </Text>
        </View>
      </View>

      {/* TITLE */}
      <Text style={styles.sectionHeading}>Transaction History</Text>

      {/* FILTERS */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setActiveFilter(item);
              loadData(getType(item));
            }}
            style={[
              styles.filterChip,
              activeFilter === item && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* ✅ HEADER */}
      <ProductHeadColor
        title="Wallet"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.screen}>
        {loading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : (
          <FlatList
            data={transactions}
            ListHeaderComponent={renderHeader}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TransactionCard item={item} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* TRANSACTION CARD */
function TransactionCard({ item }: { item: Transaction }) {
  const isPositive = item.coins > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={22}
            color="#fff"
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.orderText}>Order No. {item.orderNo}</Text>
          {item.txnId && (
            <Text style={styles.subText}>Txn Id: {item.txnId}</Text>
          )}
          <Text style={styles.categoryText}>{item.title}</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <View style={styles.coinRow}>
          <Reward width={16} height={16} />
          <Text
            style={[
              styles.coinAmount,
              isPositive ? styles.credit : styles.debit,
            ]}
          >
            {isPositive ? `+${item.coins}` : item.coins}
          </Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  screen: { flex: 1, paddingHorizontal: 16 },

  loading: { textAlign: "center", marginTop: 40 },

  headerContainer: { paddingTop: 10 },

  cardWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 20,
    elevation: 3,
  },

  walletTop: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  leftSection: { flexDirection: "row", alignItems: "center" },
  balanceBlock: { marginLeft: 12 },

  label: { color: "#DDD", fontSize: 12 },
  balance: { color: "#fff", fontSize: 20, fontWeight: "700" },

  rateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rateText: { color: "#fff" },

  expiryStrip: {
    backgroundColor: "#EDE9FE",
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  expiryLeft: { flexDirection: "row", alignItems: "center" },

  expiryText: {
    fontSize: 13,
    color: "#4B5563",
    marginLeft: 6,
    fontWeight: "500",
  },

  expiryDate: {
    fontSize: 13,
    color: "#4B5563",
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
  },

  filterList: { marginBottom: 20 },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: "#FAF5FF",
    borderColor: "#A855F7",
  },

  filterText: { fontSize: 14, color: "#6B7280" },

  filterTextActive: {
    color: "#A855F7",
    fontWeight: "600",
  },

  listContent: { paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  cardLeft: { flexDirection: "row", flex: 1 },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  textBlock: { marginLeft: 12, flex: 1 },

  orderText: { fontSize: 14, fontWeight: "500" },

  subText: { fontSize: 12, color: "#9CA3AF" },

  categoryText: { fontSize: 13, marginTop: 6 },

  cardRight: { alignItems: "flex-end" },

  coinRow: { flexDirection: "row", alignItems: "center" },

  coinAmount: { fontSize: 16, fontWeight: "700", marginLeft: 4 },

  credit: { color: "#10B981" },

  debit: { color: "#F43F5E" },

  dateText: { fontSize: 12, color: "#9CA3AF" },
});