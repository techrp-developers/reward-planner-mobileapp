import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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
import ButtonAseat from "../../assets/icons/ButtonAseat.svg";
import ButtonBseat from "../../assets/icons/ButtonBseat.svg";
import Aformale from "../../assets/icons/Aformale.svg";
import Aforfemale from "../../assets/icons/Aforfemale.svg";
import Bookmseat from "../../assets/icons/bookmseat.svg";
import Bookfseat from "../../assets/icons/bookfseat.svg";
import Seatavailable from "../../assets/icons/seatavailable.svg";
import Seatselected from "../../assets/icons/seatselected.svg";
import Bookmale from "../../assets/icons/bookmale.svg";
import Bookfemale from "../../assets/icons/bookfemale.svg";
import AformaleSeater from "../../assets/icons/aformale (2).svg";
import AforfemaleSeater from "../../assets/icons/aforfemale (2).svg";

type DeckKey = "lower" | "upper";
type SeatStatus =
  | "available"
  | "selected"
  | "male"
  | "female"
  | "maleBooked"
  | "femaleBooked";

type SeatItem = {
  id: string;
  label: string;
  status?: SeatStatus;
  spacer?: boolean;
};

const lowerDeckSeats: SeatItem[][] = [
  [
    { id: "L1", label: "1A", status: "available" },
    { id: "L2", label: "1B", status: "available" },
    { id: "lower-gap-1", label: "", spacer: true },
    { id: "L3", label: "1C", status: "male" },
    { id: "L4", label: "1D", status: "femaleBooked" },
  ],
  [
    { id: "L5", label: "2A", status: "available" },
    { id: "L6", label: "2B", status: "available" },
    { id: "lower-gap-2", label: "", spacer: true },
    { id: "L7", label: "2C", status: "maleBooked" },
    { id: "L8", label: "2D", status: "available" },
  ],
  [
    { id: "L9", label: "3A", status: "available" },
    { id: "L10", label: "3B", status: "available" },
    { id: "lower-gap-3", label: "", spacer: true },
    { id: "L11", label: "3C", status: "available" },
    { id: "L12", label: "3D", status: "available" },
  ],
  [
    { id: "L13", label: "4A", status: "available" },
    { id: "L14", label: "4B", status: "available" },
    { id: "lower-gap-4", label: "", spacer: true },
    { id: "L15", label: "4C", status: "available" },
    { id: "L16", label: "4D", status: "available" },
  ],
  [
    { id: "L17", label: "5A", status: "available" },
    { id: "L18", label: "5B", status: "available" },
    { id: "lower-gap-5", label: "", spacer: true },
    { id: "L19", label: "5C", status: "available" },
    { id: "L20", label: "5D", status: "available" },
  ],
];

const upperDeckSeats: SeatItem[][] = [
  [
    { id: "U1", label: "11A", status: "available" },
    { id: "U2", label: "11B", status: "available" },
    { id: "upper-gap-1", label: "", spacer: true },
    { id: "U3", label: "11C", status: "male" },
    { id: "U4", label: "11D", status: "femaleBooked" },
  ],
  [
    { id: "U5", label: "12A", status: "available" },
    { id: "U6", label: "12B", status: "available" },
    { id: "upper-gap-2", label: "", spacer: true },
    { id: "U7", label: "12C", status: "female" },
    { id: "U8", label: "12D", status: "available" },
  ],
  [
    { id: "U9", label: "13A", status: "available" },
    { id: "U10", label: "13B", status: "available" },
    { id: "upper-gap-3", label: "", spacer: true },
    { id: "U11", label: "13C", status: "maleBooked" },
    { id: "U12", label: "13D", status: "available" },
  ],
  [
    { id: "U13", label: "14A", status: "available" },
    { id: "U14", label: "14B", status: "available" },
    { id: "upper-gap-4", label: "", spacer: true },
    { id: "U15", label: "14C", status: "available" },
    { id: "U16", label: "14D", status: "maleBooked" },
  ],
];

const seaterSeats: SeatItem[][] = [
  [
    { id: "S1", label: "1A", status: "available" },
    { id: "S2", label: "1B", status: "available" },
    { id: "seater-gap-1", label: "", spacer: true },
    { id: "S3", label: "1C", status: "female" },
    { id: "S4", label: "1D", status: "femaleBooked" },
  ],
  [
    { id: "S5", label: "2A", status: "available" },
    { id: "S6", label: "2B", status: "available" },
    { id: "seater-gap-2", label: "", spacer: true },
    { id: "S7", label: "2C", status: "male" },
    { id: "S8", label: "2D", status: "maleBooked" },
  ],
  [
    { id: "S9", label: "3A", status: "maleBooked" },
    { id: "S10", label: "3B", status: "available" },
    { id: "seater-gap-3", label: "", spacer: true },
    { id: "S11", label: "3C", status: "maleBooked" },
    { id: "S12", label: "3D", status: "available" },
  ],
  [
    { id: "S13", label: "4A", status: "available" },
    { id: "S14", label: "4B", status: "available" },
    { id: "seater-gap-4", label: "", spacer: true },
    { id: "S15", label: "4C", status: "available" },
    { id: "S16", label: "4D", status: "available" },
  ],
];

const getFareValue = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;

export default function SeatSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const route = useRoute<RouteProp<ModuleStackParamList, "SeatSelectionScreen">>();
  const [selectedDeck, setSelectedDeck] = React.useState<DeckKey>("lower");
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([]);
  const bus = route.params.bus;
  const isSeaterBus = /seater/i.test(bus.subtitle);
  const seatRows = isSeaterBus
    ? seaterSeats
    : selectedDeck === "lower"
      ? lowerDeckSeats
      : upperDeckSeats;
  const farePerSeat = getFareValue(bus.price);
  const totalFare = farePerSeat * selectedSeats.length;

  const handleToggleSeat = React.useCallback((seat: SeatItem) => {
    if (
      seat.spacer
      || seat.status === "maleBooked"
      || seat.status === "femaleBooked"
    ) {
      return;
    }

    setSelectedSeats((current) =>
      current.includes(seat.label)
        ? current.filter((item) => item !== seat.label)
        : [...current, seat.label]
    );
  }, []);

  const handleContinue = React.useCallback(() => {
    if (selectedSeats.length === 0) {
      return;
    }

    navigation.navigate("PassengerDetailsScreen", {
      bus,
      selectedSeats,
    });
  }, [bus, navigation, selectedSeats]);

  const renderSeatIcon = React.useCallback((seat: SeatItem, isSelected: boolean) => {
    if (isSeaterBus) {
      if (isSelected) {
        return <Seatselected width={29} height={38} />;
      }

      switch (seat.status) {
        case "male":
          return <AformaleSeater width={29} height={38} />;
        case "female":
          return <AforfemaleSeater width={29} height={38} />;
        case "maleBooked":
          return <Bookmale width={29} height={38} />;
        case "femaleBooked":
          return <Bookfemale width={29} height={38} />;
        case "available":
        default:
          return <Seatavailable width={29} height={38} />;
      }
    }

    if (isSelected) {
      return <ButtonBseat width={48} height={88} />;
    }

    switch (seat.status) {
      case "male":
        return <Aformale width={48} height={88} />;
      case "female":
        return <Aforfemale width={48} height={88} />;
      case "maleBooked":
        return <Bookmseat width={48} height={88} />;
      case "femaleBooked":
        return <Bookfseat width={48} height={88} />;
      case "selected":
        return <ButtonBseat width={48} height={88} />;
      case "available":
      default:
        return <ButtonAseat width={48} height={88} />;
    }
  }, [isSeaterBus]);

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
          <Text style={styles.operatorText}>{bus.operator}</Text>
          <Text style={styles.subtitleText}>{bus.subtitle}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.85} style={styles.signalButton}>
            <MaterialCommunityIcons name="wifi" size={15} color="#E6465E" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={styles.signalButton}>
            <MaterialCommunityIcons name="asterisk" size={15} color="#E6465E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeCard}>
          <Text style={styles.routeLabel}>Route</Text>
          <View style={styles.routeRow}>
            <Text style={styles.routePointText}>{bus.from}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#D31637" />
            <Text style={styles.routePointText}>{bus.to}</Text>
          </View>
        </View>

        {isSeaterBus ? null : (
          <View style={styles.deckTabsWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedDeck("lower")}
              style={styles.deckTab}
            >
              {selectedDeck === "lower" ? (
                <LinearGradient
                  colors={["#D31637", "#B20C28"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deckTabActive}
                >
                  <Text style={styles.deckTabTextActive}>Lower Deck</Text>
                </LinearGradient>
              ) : (
                <View style={styles.deckTabInactive}>
                  <Text style={styles.deckTabTextInactive}>Lower Deck</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedDeck("upper")}
              style={styles.deckTab}
            >
              {selectedDeck === "upper" ? (
                <LinearGradient
                  colors={["#D31637", "#B20C28"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deckTabActive}
                >
                  <Text style={styles.deckTabTextActive}>Upper Deck</Text>
                </LinearGradient>
              ) : (
                <View style={styles.deckTabInactive}>
                  <Text style={styles.deckTabTextInactive}>Upper Deck</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryTitle}>{bus.departure} - {bus.arrival}</Text>
            <Text style={styles.summaryMeta}>{bus.duration} - {bus.price}</Text>
          </View>
          <View style={styles.seatLeftBadge}>
            <Text style={styles.seatLeftText}>{bus.seatsLeft}</Text>
          </View>
        </View>

        <View style={[styles.seatCard, isSeaterBus ? styles.seatCardSeater : null]}>
          <View style={[styles.seatPanel, isSeaterBus ? styles.seatPanelSeater : null]}>
            <View style={[styles.seatGrid, isSeaterBus ? styles.seatGridSeater : null]}>
              {seatRows.map((row) => (
                <View
                  key={row.map((seat) => seat.id).join("-")}
                  style={[styles.seatRow, isSeaterBus ? styles.seatRowSeater : null]}
                >
                  {row.map((seat) => {
                    if (seat.spacer) {
                      return (
                        <View
                          key={seat.id}
                          style={isSeaterBus ? styles.seatSpacerSeater : styles.seatSpacer}
                        />
                      );
                    }

                    const isSelected = selectedSeats.includes(seat.label);

                    return (
                      <TouchableOpacity
                        key={seat.id}
                        activeOpacity={0.85}
                        onPress={() => handleToggleSeat(seat)}
                        style={isSeaterBus ? styles.seatItemSeater : styles.seatItem}
                      >
                        {renderSeatIcon(seat, isSelected)}
                        <Text
                          style={[
                            isSeaterBus ? styles.seatLabelSeater : styles.seatLabel,
                            isSelected ? styles.seatLabelSelected : null,
                            seat.status === "femaleBooked" || seat.status === "maleBooked"
                              ? styles.seatLabelBooked
                              : null,
                          ]}
                        >
                          {seat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.selectedInfoCard}>
            <Text style={styles.selectedInfoTitle}>
              {selectedSeats.length === 0
                ? "Select your seat"
                : `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} selected`}
            </Text>
            <Text style={styles.selectedInfoText}>
              {selectedSeats.length === 0
                ? "Tap any available berth to continue"
                : selectedSeats.join(", ")}
            </Text>
          </View>
        </View>

        <View style={styles.seatGuideSection}>
          <Text style={styles.seatGuideTitle}>Know Your Seat Types</Text>

          <View style={styles.seatGuideCard}>
            <View style={styles.seatGuideHeaderRow}>
              <Text style={styles.seatGuideHeaderText}>Type</Text>
              <Text style={styles.seatGuideHeaderText}>{isSeaterBus ? "Seater" : "Sleeper"}</Text>
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Available</Text>
              {isSeaterBus ? (
                <Seatavailable width={22} height={28} />
              ) : (
                <ButtonAseat width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Selected</Text>
              {isSeaterBus ? (
                <Seatselected width={22} height={28} />
              ) : (
                <ButtonBseat width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Available only for female passenger</Text>
              {isSeaterBus ? (
                <AforfemaleSeater width={22} height={28} />
              ) : (
                <Aforfemale width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Booked by female passenger</Text>
              {isSeaterBus ? (
                <Bookfemale width={22} height={28} />
              ) : (
                <Bookfseat width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRow}>
              <Text style={styles.seatGuideLabel}>Available for male passenger</Text>
              {isSeaterBus ? (
                <AformaleSeater width={22} height={28} />
              ) : (
                <Aformale width={24} height={44} />
              )}
            </View>

            <View style={styles.seatGuideItemRowLast}>
              <Text style={styles.seatGuideLabel}>Booked by male passenger</Text>
              {isSeaterBus ? (
                <Bookmale width={22} height={28} />
              ) : (
                <Bookmseat width={24} height={44} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>TOTAL FARE</Text>
          <Text style={styles.bottomFare}>
            Rs {selectedSeats.length === 0 ? farePerSeat.toLocaleString("en-IN") : totalFare.toLocaleString("en-IN")}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={selectedSeats.length === 0 ? 1 : 0.9}
          disabled={selectedSeats.length === 0}
          onPress={handleContinue}
          style={styles.continueButtonWrap}
        >
          <LinearGradient
            colors={selectedSeats.length === 0 ? ["#E8A8B3", "#D28A97"] : ["#D31637", "#B20C28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: 34,
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
  operatorText: {
    color: "#343038",
    fontSize: 17,
    fontWeight: "700",
  },
  subtitleText: {
    marginTop: 2,
    color: "#8A8490",
    fontSize: 13,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signalButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1F3",
    alignItems: "center",
    justifyContent: "center",
  },
  routeCard: {
    marginTop: 14,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  routeLabel: {
    color: "#9D97A1",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  routePointText: {
    flex: 1,
    color: "#423E45",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  deckTabsWrap: {
    marginTop: 14,
    marginHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FBE8E6",
    padding: 4,
    flexDirection: "row",
  },
  deckTab: {
    flex: 1,
  },
  deckTabActive: {
    minHeight: 42,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  deckTabInactive: {
    minHeight: 42,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  deckTabTextActive: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  deckTabTextInactive: {
    color: "#C61D36",
    fontSize: 14,
    fontWeight: "700",
  },
  summaryRow: {
    marginTop: 18,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTitle: {
    color: "#38333B",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryMeta: {
    marginTop: 4,
    color: "#8B8691",
    fontSize: 12,
    fontWeight: "500",
  },
  seatLeftBadge: {
    backgroundColor: "#FFE5E9",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  seatLeftText: {
    color: "#CB1733",
    fontSize: 10,
    fontWeight: "800",
  },
  selectedInfoCard: {
    marginTop: 14,
    paddingHorizontal: 4,
  },
  selectedInfoTitle: {
    color: "#3B3640",
    fontSize: 13,
    fontWeight: "700",
  },
  selectedInfoText: {
    marginTop: 4,
    color: "#A14D5B",
    fontSize: 12,
    fontWeight: "500",
  },
  seatCard: {
    marginTop: 14,
    marginHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9E0DB",
  },
  seatCardSeater: {
    backgroundColor: "#FFFFFF",
  },
  seatPanel: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  seatPanelSeater: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 18,
  },
  seatGrid: {
    gap: 18,
  },
  seatGridSeater: {
    gap: 6,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  seatRowSeater: {
    marginBottom: 0,
  },
  seatSpacer: {
    width: 32,
  },
  seatSpacerSeater: {
    width: 34,
  },
  seatItem: {
    width: 48,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  seatItemSeater: {
    width: 54,
    height: 70,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  seatLabel: {
    position: "absolute",
    bottom: 9,
    right: 8,
    color: "#6A6670",
    fontSize: 8,
    fontWeight: "600",
  },
  seatLabelSeater: {
    marginTop: 6,
    color: "#6A6670",
    fontSize: 10,
    fontWeight: "600",
  },
  seatLabelBooked: {
    color: "#B55C68",
  },
  seatLabelSelected: {
    color: "#FFFFFF",
  },
  seatGuideSection: {
    marginTop: 18,
    marginHorizontal: 12,
  },
  seatGuideTitle: {
    textAlign: "center",
    color: "#343038",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  seatGuideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E0DB",
    overflow: "hidden",
  },
  seatGuideHeaderRow: {
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFDFC",
    borderBottomWidth: 1,
    borderBottomColor: "#EFE6E1",
  },
  seatGuideHeaderText: {
    color: "#302B33",
    fontSize: 15,
    fontWeight: "800",
  },
  seatGuideItemRow: {
    minHeight: 84,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F2EBE6",
  },
  seatGuideItemRowLast: {
    minHeight: 84,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seatGuideLabel: {
    flex: 1,
    paddingRight: 16,
    color: "#4A4550",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#EEE7E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomLabel: {
    color: "#A29CA6",
    fontSize: 10,
    fontWeight: "600",
  },
  bottomFare: {
    marginTop: 4,
    color: "#3C3740",
    fontSize: 28 / 1.5,
    fontWeight: "800",
  },
  continueButtonWrap: {
    minWidth: 170,
  },
  continueButton: {
    height: 48,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
