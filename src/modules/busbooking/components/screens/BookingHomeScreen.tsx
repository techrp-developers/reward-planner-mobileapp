import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BusFrame1 from "../../assets/banners/busframe1.svg";
import BusFrame2 from "../../assets/banners/busframe2.svg";
import ExclusiveOfferBooking from "../../assets/banners/exclusiveofferbooking.svg";
import type { ModuleStackParamList } from "../../../../navigation/MainLayout";

type DateChip = {
  id: string;
  day: string;
  date: string;
  active?: boolean;
};

type Journey = {
  route: string;
  time: string;
  ticket: string;
};

type SearchHistory = {
  from: string;
  to: string;
  lastSearched: string;
};

type PopularRoute = {
  id: string;
  illustration: "frame1" | "frame2";
};

const nextJourney: Journey = {
  route: "Mumbai to Pune",
  time: "22:45",
  ticket: "BG-99281",
};

const recentSearches: SearchHistory[] = [
  { from: "Delhi", to: "Chandigarh", lastSearched: "Last searched 2 days ago" },
  { from: "Jaipur", to: "Udaipur", lastSearched: "Last searched 5 days ago" },
];

const popularRoutes: PopularRoute[] = [
  {
    id: "goa",
    illustration: "frame1",
  },
  {
    id: "nashik",
    illustration: "frame2",
  },
  {
    id: "indore",
    illustration: "frame1",
  },
];

const buildCurrentMonthDateChips = (): {
  monthTitle: string;
  chips: DateChip[];
} => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthTitle = now.toLocaleString("en-US", { month: "long" });

  const chips: DateChip[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const currentDate = new Date(year, month, dayNumber);

    return {
      id: `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`,
      day: currentDate
        .toLocaleString("en-US", { weekday: "short" })
        .toUpperCase(),
      date: String(dayNumber).padStart(2, "0"),
      active: dayNumber === today,
    };
  });

  return { monthTitle, chips };
};

export default function BookingHomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const routeCardWidth = Math.min(150, width * 0.41);
  const routeCardHeight = Math.round((routeCardWidth * 197) / 162);
  const { monthTitle, chips: dateChips } = React.useMemo(
    () => buildCurrentMonthDateChips(),
    []
  );

  const defaultSelectedDateId =
    dateChips.find((chip) => chip.active)?.id ?? dateChips[0]?.id ?? "";
  const [selectedDateId, setSelectedDateId] = React.useState(defaultSelectedDateId);

  const selectedChip = React.useMemo(
    () => dateChips.find((chip) => chip.id === selectedDateId) ?? dateChips[0],
    [dateChips, selectedDateId]
  );

  const todayChip = React.useMemo(
    () => dateChips.find((chip) => chip.active) ?? dateChips[0],
    [dateChips]
  );

  const tomorrowChip = React.useMemo(() => {
    const todayIndex = dateChips.findIndex((chip) => chip.id === todayChip?.id);
    if (todayIndex < 0) {
      return dateChips[1];
    }
    return dateChips[todayIndex + 1];
  }, [dateChips, todayChip]);

  const journeyDateText = React.useMemo(() => {
    if (!selectedChip) {
      return "";
    }

    const selectedDate = new Date(selectedChip.id);
    const dayLabel = selectedDate.toLocaleString("en-US", { weekday: "short" });
    const monthLabel = selectedDate.toLocaleString("en-US", { month: "short" });

    return `${dayLabel} ${selectedChip.date}-${monthLabel}`;
  }, [selectedChip]);

  const renderRouteIllustration = (illustration: PopularRoute["illustration"]) => {
    const Illustration = illustration === "frame1" ? BusFrame1 : BusFrame2;
    return <Illustration width="100%" height="100%" />;
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 16) + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchCard}>
        <View style={styles.inputStack}>
          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="bus-side" size={18} color="#444444" />
            <Text style={styles.routePlaceholder}>From</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.swapButton}>
            <MaterialCommunityIcons name="swap-vertical" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.routeDivider} />

          <View style={styles.routeRow}>
            <MaterialCommunityIcons name="bus-side" size={18} color="#444444" />
            <Text style={styles.routePlaceholder}>To</Text>
          </View>
        </View>

        <View style={styles.dateJourneyRow}>
          <View style={styles.dateJourneyInfo}>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#444444" />
            <View style={styles.dateJourneyTextWrap}>
              <Text style={styles.dateJourneyLabel}>Date of Journey</Text>
              <Text style={styles.dateJourneyValue}>{journeyDateText}</Text>
            </View>
          </View>

          <View style={styles.datePillsWrap}>
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.dateActionPill,
                selectedDateId === todayChip?.id ? styles.dateActionPillActive : null,
              ]}
              onPress={() => {
                if (todayChip) {
                  setSelectedDateId(todayChip.id);
                }
              }}
            >
              <Text
                style={[
                  styles.dateActionPillText,
                  selectedDateId === todayChip?.id ? styles.dateActionPillTextActive : null,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.dateActionPill,
                selectedDateId === tomorrowChip?.id ? styles.dateActionPillActive : null,
              ]}
              onPress={() => {
                if (tomorrowChip) {
                  setSelectedDateId(tomorrowChip.id);
                }
              }}
            >
              <Text
                style={[
                  styles.dateActionPillText,
                  selectedDateId === tomorrowChip?.id ? styles.dateActionPillTextActive : null,
                ]}
              >
                Tomorrow
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.bookingOptionsWrap}>
        <View style={styles.roundTripRow}>
          <View style={styles.roundTripInfoWrap}>
            <View style={styles.roundTripIconWrap}>
              <MaterialCommunityIcons name="rotate-3d-variant" size={20} color="#E11D48" />
            </View>
            <Text style={styles.roundTripText}>Round Trip</Text>
          </View>
          <TouchableOpacity activeOpacity={0.9} style={styles.roundTripToggleTrack}>
            <View style={styles.roundTripToggleThumb} />
          </TouchableOpacity>
        </View>

        <View style={styles.womenBookingRow}>
          <View style={styles.womenSectionIconWrap}>
            <MaterialCommunityIcons name="human-female" size={22} color="#E11D48" />
          </View>
          <View style={styles.womenSectionTextWrap}>
            <Text style={styles.womenSectionTitle}>Booking for women</Text>
            <Text style={styles.womenSectionLink}>Know more</Text>
          </View>
          <TouchableOpacity activeOpacity={0.9} style={styles.womenToggleTrack}>
            <View style={styles.womenToggleThumb} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.searchButton}
        onPress={() => navigation.navigate("BusListingScreen")}
      >
        <LinearGradient
          colors={["#CE1538", "#9D0A1B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.searchButtonGradient}
        >
          <MaterialCommunityIcons name="magnify" size={18} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Search buses</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Select Date</Text>
        <Text style={styles.sectionAction}>{monthTitle}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dateChips.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            onPress={() => setSelectedDateId(item.id)}
            style={[styles.dateChip, selectedDateId === item.id ? styles.dateChipActive : null]}
          >
            <Text
              style={[
                styles.dateChipDay,
                selectedDateId === item.id ? styles.dateChipDayActive : null,
              ]}
            >
              {item.day}
            </Text>
            <Text
              style={[
                styles.dateChipDate,
                selectedDateId === item.id ? styles.dateChipDateActive : null,
              ]}
            >
              {item.date}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Next Journey</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.journeyTopRow}>
          <View style={styles.tonightBadge}>
            <Text style={styles.tonightBadgeText}>TONIGHT</Text>
          </View>
          <View style={styles.departureWrap}>
            <Text style={styles.departureTime}>{nextJourney.time}</Text>
            <Text style={styles.departureLabel}>DEPARTURE</Text>
          </View>
        </View>

        <Text style={styles.journeyRoute}>{nextJourney.route}</Text>

        <View style={styles.journeyDivider} />

        <View style={styles.journeyBottomRow}>
          <View style={styles.ticketWrap}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={14}
              color="#9CA3AF"
            />
            <Text style={styles.ticketText}>Ticket: {nextJourney.ticket}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
      </View>

      <View style={styles.historyList}>
        {recentSearches.map((item) => (
          <TouchableOpacity
            key={`${item.from}-${item.to}`}
            activeOpacity={0.88}
            style={styles.historyCard}
          >
            <View style={styles.historyIconBox}>
              <MaterialCommunityIcons name="history" size={20} color="#E11D48" />
            </View>
            <View style={styles.historyTextWrap}>
              <Text style={styles.historyRoute}>
                {item.from} <Text style={styles.routeArrow}>{"->"}</Text> {item.to}
              </Text>
              <Text style={styles.historyMeta}>{item.lastSearched}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#374151" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exclusive Offers</Text>
        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offerArtworkOnlyWrap}>
        <ExclusiveOfferBooking width="100%" height="100%" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.routesRow}
      >
        {popularRoutes.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            style={[styles.routeCard, { width: routeCardWidth }]}
          >
            <View style={[styles.routeArt, { height: routeCardHeight }]}>
              {renderRouteIllustration(item.illustration)}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F5F1",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 0,
    borderWidth: 1.2,
    borderColor: "#D4D4D8",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginTop: 14,
  },
  bookingOptionsWrap: {
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  inputStack: {
    position: "relative",
  },
  routeRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  routePlaceholder: {
    marginLeft: 14,
    color: "#595959",
    fontSize: 18,
    fontWeight: "500",
  },
  routeDivider: {
    height: 2,
    backgroundColor: "#D4D4D8",
    marginLeft: 0,
    marginRight: 32,
  },
  swapButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  dateJourneyRow: {
    minHeight: 78,
    borderTopWidth: 2,
    borderTopColor: "#D4D4D8",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateJourneyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateJourneyTextWrap: {
    marginLeft: 12,
  },
  dateJourneyLabel: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "500",
  },
  dateJourneyValue: {
    color: "#222222",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 1,
  },
  datePillsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateActionPill: {
    minWidth: 82,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFCED1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dateActionPillText: {
    color: "#444444",
    fontSize: 13,
    fontWeight: "600",
  },
  dateActionPillActive: {
    backgroundColor: "#C8102E",
  },
  dateActionPillTextActive: {
    color: "#FFFFFF",
  },
  womenBookingRow: {
    minHeight: 56,
    marginTop: 2,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  roundTripRow: {
    minHeight: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundTripInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  roundTripIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFE4E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roundTripText: {
    color: "#444444",
    fontSize: 16,
    fontWeight: "600",
  },
  roundTripToggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#D93644",
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  roundTripToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  searchButton: {
    marginTop: 18,
    marginHorizontal: 0,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  searchButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderRadius: 22,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },
  womenSectionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFE4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  womenSectionTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  womenSectionTitle: {
    color: "#3F3F46",
    fontSize: 16,
    fontWeight: "600",
  },
  womenSectionLink: {
    marginTop: 2,
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  womenToggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#D93644",
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  womenToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#333333",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionAction: {
    color: "#C8102E",
    fontSize: 14,
    fontWeight: "700",
  },
  dateRow: {
    gap: 12,
    paddingRight: 6,
  },
  dateChip: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#E8E7E6",
    alignItems: "center",
    justifyContent: "center",
  },
  dateChipActive: {
    backgroundColor: "#C8102E",
  },
  dateChipDay: {
    fontSize: 9,
    color: "#7C7C7C",
    fontWeight: "700",
  },
  dateChipDayActive: {
    color: "rgba(255,255,255,0.78)",
  },
  dateChipDate: {
    marginTop: 4,
    fontSize: 24,
    color: "#3F3F46",
    fontWeight: "800",
    lineHeight: 26,
  },
  dateChipDateActive: {
    color: "#FFFFFF",
  },
  journeyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  journeyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tonightBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tonightBadgeText: {
    color: "#EF4444",
    fontSize: 9,
    fontWeight: "800",
  },
  departureWrap: {
    alignItems: "flex-end",
  },
  departureTime: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "700",
  },
  departureLabel: {
    color: "#A1A1AA",
    fontSize: 9,
    fontWeight: "700",
  },
  journeyRoute: {
    marginTop: 8,
    color: "#3F3F46",
    fontSize: 18,
    fontWeight: "800",
  },
  journeyDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  journeyBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketText: {
    marginLeft: 6,
    color: "#71717A",
    fontSize: 12,
    fontWeight: "500",
  },
  viewDetailsText: {
    color: "#C8102E",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#FCEBEC",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FAD4D7",
    alignItems: "center",
    justifyContent: "center",
  },
  historyTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  historyRoute: {
    color: "#3F3F46",
    fontSize: 15,
    fontWeight: "700",
  },
  routeArrow: {
    color: "#EF4444",
  },
  historyMeta: {
    marginTop: 2,
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "500",
  },
  viewAllText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  offerArtworkOnlyWrap: {
    width: "auto",
    height: 130,
    marginLeft: -34,
    marginRight: -34,
  },
  routesRow: {
    gap: 12,
    paddingRight: 2,
    paddingBottom: 16,
  },
  routeCard: {
  },
  routeArt: {
    width: "100%",
  },
});
