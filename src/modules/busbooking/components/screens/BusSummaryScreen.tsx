import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import type { ModuleStackParamList } from "../../../../navigation/MainLayout";
import Selectedseat1 from "../../assets/icons/selectedseat1.svg";
import Selectedseat2 from "../../assets/icons/selectedseat2.svg";
import BusImage1 from "../../assets/banners/busimage1.svg";

const getFareValue = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;

export default function BusSummaryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const route = useRoute<RouteProp<ModuleStackParamList, "BusSummaryScreen">>();
  const { bus, selectedSeats, passengers, boardingPoint, droppingPoint } = route.params;
  const { width } = useWindowDimensions();
  const slideWidth = width - 16;
  const baseFare = getFareValue(bus.price) * selectedSeats.length;
  const taxes = 300;
  const rewardDiscount = 150;
  const totalAmount = baseFare + taxes - rewardDiscount;

  const handleProceedToPayment = React.useCallback(() => {
    navigation.navigate("PaymentScreen", {
      bus,
      selectedSeats,
      passengers,
      totalAmount,
    });
  }, [bus, navigation, passengers, selectedSeats, totalAmount]);

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

        <View style={styles.headerTextWrap}>
          <Text style={styles.routeTitle}>Mumbai - Pune</Text>
          <Text style={styles.routeMeta}>24 OCT - {selectedSeats.length} PASSENGERS</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.85} style={styles.alertButton}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="#D31637" />
          </TouchableOpacity>
          <View style={styles.profileButton}>
            <MaterialCommunityIcons name="account" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sliderRow}>
          <View style={[styles.slideCard, { width: slideWidth }]}>
            <BusImage1 width="100%" height="100%" />
          </View>
        </View>

        <View style={styles.pointsWrap}>
          <View style={styles.pointTimelineRow}>
            <View style={styles.pointIconColumn}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color="#FFC7CD" />
              <View style={styles.pointConnector} />
              <MaterialCommunityIcons name="map-marker-outline" size={22} color="#C8102E" />
            </View>

            <View style={styles.pointDetailsColumn}>
              <View style={styles.pointBlockTop}>
                <Text style={styles.pointLabel}>Boarding point</Text>
                <Text style={styles.pointTitle}>{boardingPoint}</Text>
                <Text style={styles.pointTime}>04:15 • Today</Text>
              </View>

              <View style={styles.pointBlockBottom}>
                <Text style={styles.pointLabel}>Droping point</Text>
                <Text style={styles.pointTitle}>{droppingPoint}</Text>
                <Text style={styles.pointTime}>12:35 • Tomorrow</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Selected Seats</Text>
          <View style={styles.selectedSeatsCard}>
            {selectedSeats.map((seat, index) => (
              <React.Fragment key={seat}>
                <View style={styles.selectedSeatWrap}>
                  {index % 2 === 0 ? (
                    <Selectedseat1 width={60} height={82} />
                  ) : (
                    <Selectedseat2 width={60} height={82} />
                  )}
                </View>
                {index !== selectedSeats.length - 1 ? (
                  <View style={styles.selectedSeatDivider} />
                ) : null}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Passenger List</Text>
          <View style={styles.passengerListCard}>
            {passengers.map((passenger, index) => (
              <View
                key={`${passenger.seat}-${index}`}
                style={[
                  styles.passengerRow,
                  index !== passengers.length - 1 ? styles.passengerRowBorder : null,
                ]}
              >
                <View style={styles.passengerAvatar}>
                  <MaterialCommunityIcons name="account-outline" size={19} color="#D31637" />
                </View>

                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerName}>{passenger.fullName}</Text>
                  <Text style={styles.passengerMeta}>Adult · Seat {passenger.seat}</Text>
                </View>

                <MaterialCommunityIcons name="pencil-outline" size={18} color="#9A93A0" />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.pointsCardHeader}>
            <View style={styles.pointsIcon}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color="#F0BB22"
              />
            </View>

            <View style={styles.pointsCardTextWrap}>
              <Text style={styles.pointsCardTitle}>Redeem Traveler Points</Text>
              <Text style={styles.pointsCardSubtext}>
                Use 500 coins to save $15.00 on this trip.
              </Text>
            </View>

            <View style={styles.pointsToggleTrack}>
              <View style={styles.pointsToggleThumb} />
            </View>
          </View>

          <View style={styles.pointsCardFooter}>
            <Text style={styles.pointsBalanceText}>Current Balance: 1,250{"\n"}Coins</Text>
            <Text style={styles.pointsAppliedText}>-150 Applied</Text>
          </View>
        </View>

        <View style={styles.fareCard}>
          <Text style={styles.fareCardTitle}>Fare Summary</Text>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Base Fare ({selectedSeats.length} Seats)</Text>
            <Text style={styles.fareValue}>₹{baseFare.toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Taxes & Fees</Text>
            <Text style={styles.fareValue}>₹{taxes.toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.fareRow}>
            <View style={styles.discountRow}>
              <Text style={styles.fareLabel}>Reward Discount</Text>
              <View style={styles.rpBadge}>
                <Text style={styles.rpBadgeText}>RP COINS</Text>
              </View>
            </View>
            <Text style={styles.discountValue}>-₹{rewardDiscount.toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.fareDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toLocaleString("en-IN")}</Text>
            </View>

            <View style={styles.earnedWrap}>
              <Text style={styles.earnedLabel}>EARNED</Text>
              <Text style={styles.earnedValue}>+45 RP coins</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleProceedToPayment}
          style={styles.payButtonWrap}
        >
          <LinearGradient
            colors={["#D31637", "#B20C28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButton}
          >
            <Text style={styles.payButtonText}>Proceed to Payment</Text>
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
  headerTextWrap: {
    flex: 1,
  },
  routeTitle: {
    color: "#343038",
    fontSize: 17,
    fontWeight: "700",
  },
  routeMeta: {
    marginTop: 2,
    color: "#8B8590",
    fontSize: 11,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  profileButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#5E7280",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderRow: {
    paddingHorizontal: 8,
  },
  slideCard: {
    height: 220,
    overflow: "hidden",
    marginTop: 18,
  },
  pointsWrap: {
    marginTop: 18,
    marginHorizontal: 12,
  },
  pointTimelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pointIconColumn: {
    width: 28,
    alignItems: "center",
    paddingTop: 2,
  },
  pointConnector: {
    width: 2,
    minHeight: 82,
    backgroundColor: "#8F8A93",
    marginVertical: 6,
  },
  pointDetailsColumn: {
    flex: 1,
    marginLeft: 14,
  },
  pointBlockTop: {
    paddingBottom: 16,
  },
  pointBlockBottom: {
    paddingTop: 2,
  },
  pointLabel: {
    color: "#5F5A64",
    fontSize: 12,
    fontWeight: "500",
  },
  pointTitle: {
    marginTop: 4,
    color: "#3C3841",
    fontSize: 16,
    fontWeight: "700",
  },
  pointTime: {
    marginTop: 4,
    color: "#57525C",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionBlock: {
    marginTop: 18,
    marginHorizontal: 12,
  },
  sectionTitle: {
    color: "#403B45",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  selectedSeatsCard: {
    minHeight: 108,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E84153",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedSeatWrap: {
    width: 60,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSeatDivider: {
    width: 1,
    height: 88,
    backgroundColor: "#B7AEB4",
    marginHorizontal: 18,
  },
  passengerListCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE2DD",
    overflow: "hidden",
    paddingVertical: 6,
  },
  passengerRow: {
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  passengerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8E3",
  },
  passengerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFEDEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    color: "#3D3841",
    fontSize: 15,
    fontWeight: "700",
  },
  passengerMeta: {
    marginTop: 3,
    color: "#948E99",
    fontSize: 12,
    fontWeight: "500",
  },
  pointsCard: {
    marginTop: 18,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE2DD",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  pointsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF7D8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pointsCardTextWrap: {
    flex: 1,
  },
  pointsCardTitle: {
    color: "#403B45",
    fontSize: 15,
    fontWeight: "700",
  },
  pointsCardSubtext: {
    marginTop: 2,
    color: "#99929A",
    fontSize: 12,
    fontWeight: "500",
  },
  pointsToggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1C43A",
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  pointsToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",
  },
  pointsCardFooter: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  pointsBalanceText: {
    color: "#7A747C",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  pointsAppliedText: {
    color: "#D31637",
    fontSize: 14,
    fontWeight: "700",
  },
  fareCard: {
    marginTop: 18,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE2DD",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  fareCardTitle: {
    color: "#403B45",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  fareLabel: {
    color: "#6F6A73",
    fontSize: 13,
    fontWeight: "500",
  },
  fareValue: {
    color: "#3D3841",
    fontSize: 14,
    fontWeight: "700",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rpBadge: {
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: "#FFF0D2",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rpBadgeText: {
    color: "#D69200",
    fontSize: 10,
    fontWeight: "700",
  },
  discountValue: {
    color: "#D31637",
    fontSize: 14,
    fontWeight: "700",
  },
  fareDivider: {
    height: 1,
    backgroundColor: "#F0E8E3",
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "#7A747C",
    fontSize: 11,
    fontWeight: "700",
  },
  totalValue: {
    marginTop: 4,
    color: "#2D2831",
    fontSize: 22,
    fontWeight: "800",
  },
  earnedWrap: {
    alignItems: "flex-end",
  },
  earnedLabel: {
    color: "#7A747C",
    fontSize: 11,
    fontWeight: "700",
  },
  earnedValue: {
    marginTop: 4,
    color: "#D31637",
    fontSize: 13,
    fontWeight: "700",
  },
  bottomBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EFE6E1",
  },
  payButtonWrap: {
    borderRadius: 18,
    overflow: "hidden",
  },
  payButton: {
    minHeight: 54,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  footerNote: {
    marginTop: 10,
    textAlign: "center",
    color: "#9A93A0",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
  },
});
