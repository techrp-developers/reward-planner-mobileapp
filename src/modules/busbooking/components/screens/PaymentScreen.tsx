import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import type { ModuleStackParamList } from "../../../../navigation/MainLayout";

const offerCards = [
  { id: "1", code: "GET50", subtext: "₹50 Instant Discount", active: true },
  { id: "2", code: "CASHBACK20", subtext: "Win up to ₹100", active: false },
  { id: "3", code: "TRIP100", subtext: "Save more on travel", active: false },
];

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const route = useRoute<RouteProp<ModuleStackParamList, "PaymentScreen">>();
  const { bus, selectedSeats, totalAmount } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#77737B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Payment</Text>

        <TouchableOpacity activeOpacity={0.85} style={styles.alertButton}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#D31637" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.payableCard}>
          <Text style={styles.payableLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.payableValue}>₹{totalAmount.toLocaleString("en-IN")}</Text>

          <View style={styles.tripMetaRow}>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>R</Text>
            </View>
            <Text style={styles.tripMetaText}>
              {selectedSeats.length} Premium Seats • Mumbai to Pune
            </Text>
          </View>
        </View>

        <View style={styles.rewardsCard}>
          <View style={styles.rewardsIconWrap}>
            <MaterialCommunityIcons name="star-circle-outline" size={26} color="#F1B51D" />
          </View>
          <Text style={styles.rewardsTitle}>Unlock Rewards</Text>
          <Text style={styles.rewardsSubtext}>Earn 45 coins</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Offers</Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersRow}
        >
          {offerCards.map((offer) => (
            <View
              key={offer.id}
              style={[styles.offerCard, offer.active ? styles.offerCardActive : styles.offerCardMuted]}
            >
              <View style={styles.offerIconWrap}>
                <MaterialCommunityIcons
                  name="ticket-percent-outline"
                  size={18}
                  color={offer.active ? "#D31637" : "#F09DA8"}
                />
              </View>
              <View style={styles.offerTextWrap}>
                <Text style={[styles.offerCode, offer.active ? styles.offerCodeActive : null]}>
                  {offer.code}
                </Text>
                <Text style={styles.offerSubtext}>{offer.subtext}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.methodsTitle}>Payment Methods</Text>

        <View style={styles.methodCard}>
          <View style={styles.methodHeader}>
            <View style={styles.methodTitleRow}>
              <MaterialCommunityIcons name="bank-outline" size={22} color="#D31637" />
              <Text style={styles.methodTitle}>UPI Payments</Text>
            </View>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMMENDED</Text>
            </View>
          </View>

          <View style={styles.upiRow}>
            <TextInput
              placeholder="Enter UPI ID (e.g. user@okaxis)"
              placeholderTextColor="#B0A9B1"
              style={styles.upiInput}
            />
            <TouchableOpacity activeOpacity={0.9} style={styles.payNowWrap}>
              <LinearGradient
                colors={["#D31637", "#B20C28"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payNowButton}
              >
                <Text style={styles.payNowText}>Pay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.methodCard}>
          <View style={styles.methodTitleRow}>
            <MaterialCommunityIcons name="credit-card-outline" size={22} color="#D31637" />
            <Text style={styles.methodTitle}>Debit / Credit Card</Text>
          </View>

          <Text style={styles.inputLabel}>Card Number</Text>
          <TextInput
            placeholder="0000 0000 0000 0000"
            placeholderTextColor="#B0A9B1"
            style={styles.cardInput}
            keyboardType="number-pad"
          />

          <View style={styles.cardSplitRow}>
            <View style={styles.cardSplitField}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                placeholder="MM/YY"
                placeholderTextColor="#B0A9B1"
                style={styles.cardInput}
              />
            </View>

            <View style={styles.cardSplitField}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                placeholder="***"
                placeholderTextColor="#B0A9B1"
                style={styles.cardInput}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.88} style={styles.netBankingCard}>
          <View style={styles.methodTitleRow}>
            <MaterialCommunityIcons name="bank-transfer" size={22} color="#D31637" />
            <Text style={styles.methodTitle}>Net Banking</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#A49DA6" />
        </TouchableOpacity>

        <View style={styles.securityWrap}>
          <View style={styles.securityTitleRow}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#85CBE5" />
            <Text style={styles.securityTitle}>100% SECURE TRANSACTION</Text>
          </View>
          <Text style={styles.securityText}>
            Your data is encrypted using 256-bit SSL technology. Payments are
            processed via PCI-DSS compliant gateways.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity activeOpacity={0.9} style={styles.proceedButtonWrap}>
          <LinearGradient
            colors={["#D31637", "#B20C28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proceedButton}
          >
            <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          By clicking, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F5",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: "#343038",
    fontSize: 18,
    fontWeight: "700",
  },
  alertButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  payableCard: {
    marginTop: 10,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE2DD",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  payableLabel: {
    color: "#A099A6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  payableValue: {
    marginTop: 4,
    color: "#312B34",
    fontSize: 22,
    fontWeight: "800",
  },
  tripMetaRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  tripBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFEDEE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tripBadgeText: {
    color: "#D31637",
    fontSize: 12,
    fontWeight: "800",
  },
  tripMetaText: {
    color: "#C2BCC8",
    fontSize: 14,
    fontWeight: "500",
  },
  rewardsCard: {
    marginTop: 18,
    marginHorizontal: 12,
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CDE9DE",
    backgroundColor: "#E5FAF0",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardsIconWrap: {
    marginBottom: 6,
  },
  rewardsTitle: {
    color: "#00B893",
    fontSize: 17,
    fontWeight: "700",
  },
  rewardsSubtext: {
    marginTop: 4,
    color: "#32BAA0",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHeader: {
    marginTop: 22,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#403B45",
    fontSize: 16,
    fontWeight: "700",
  },
  viewAllText: {
    color: "#2F6EF3",
    fontSize: 14,
    fontWeight: "600",
  },
  offersRow: {
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 12,
  },
  offerCard: {
    width: 160,
    minHeight: 64,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  offerCardActive: {
    backgroundColor: "#C8102E",
  },
  offerCardMuted: {
    backgroundColor: "#FDE8E8",
  },
  offerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  offerTextWrap: {
    flex: 1,
  },
  offerCode: {
    color: "#7C737F",
    fontSize: 15,
    fontWeight: "700",
  },
  offerCodeActive: {
    color: "#FFFFFF",
  },
  offerSubtext: {
    marginTop: 3,
    color: "#F7C9D0",
    fontSize: 11,
    fontWeight: "500",
  },
  methodsTitle: {
    marginTop: 24,
    marginHorizontal: 12,
    color: "#403B45",
    fontSize: 17,
    fontWeight: "700",
  },
  methodCard: {
    marginTop: 14,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE2DD",
    padding: 16,
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  methodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  methodTitle: {
    marginLeft: 10,
    color: "#3E3943",
    fontSize: 15,
    fontWeight: "700",
  },
  recommendedBadge: {
    borderRadius: 10,
    backgroundColor: "#FFC444",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recommendedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  upiRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  upiInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEE7E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    color: "#3C3740",
    fontSize: 14,
    marginRight: 10,
  },
  payNowWrap: {
    width: 92,
  },
  payNowButton: {
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  payNowText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inputLabel: {
    color: "#8E8790",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 8,
  },
  cardInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEE7E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    color: "#3C3740",
    fontSize: 14,
  },
  cardSplitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
  },
  cardSplitField: {
    flex: 1,
  },
  netBankingCard: {
    marginTop: 14,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE2DD",
    paddingHorizontal: 16,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  securityWrap: {
    marginTop: 26,
    marginHorizontal: 28,
    alignItems: "center",
  },
  securityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  securityTitle: {
    marginLeft: 6,
    color: "#C5BDC7",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  securityText: {
    marginTop: 8,
    color: "#B7B0BA",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: "#FBF8F5",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  proceedButtonWrap: {
    width: "100%",
  },
  proceedButton: {
    height: 50,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  proceedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerNote: {
    marginTop: 8,
    textAlign: "center",
    color: "#ACA5AF",
    fontSize: 10,
    fontWeight: "500",
  },
});
