import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { ModuleStackParamList } from "../../../../navigation/MainLayout";

type FilterChip = {
  id: string;
  label: string;
  opensScreen?: boolean;
};

export type BusCard = {
  id: string;
  operator: string;
  subtitle: string;
  departure: string;
  arrival: string;
  from: string;
  to: string;
  duration: string;
  price: string;
  seatsLeft: string;
  rating: string;
  features: string[];
  about: string;
  topRated?: boolean;
};

const filterChips: FilterChip[] = [
  { id: "all", label: "All", opensScreen: true },
  { id: "ac", label: "AC" },
  { id: "sleeper", label: "Sleeper" },
  { id: "seater", label: "Seater" },
  { id: "departure-time", label: "Departure Time" },
  { id: "under", label: "Under 999" },
];

const busCards: BusCard[] = [
  {
    id: "1",
    operator: "Bharat Express",
    subtitle: "Volvo AC Sleeper (2+1)",
    departure: "22:00",
    arrival: "06:45",
    from: "Mumbai, Borivali",
    to: "Pune, Swargate",
    duration: "8h 45m",
    price: "Rs 1,250",
    seatsLeft: "2 SEATS LEFT",
    rating: "4.5",
    features: ["BEST PRICE GUARANTEED", "FREE WIFI", "LIVE TRACKING"],
    about: "About Bus: Clean sleeper coach with smooth ride and punctual service.",
    topRated: true,
  },
  {
    id: "2",
    operator: "Bharat Express",
    subtitle: "Volvo AC Sleeper (2+1)",
    departure: "22:00",
    arrival: "06:45",
    from: "Mumbai, Borivali",
    to: "Pune, Swargate",
    duration: "8h 45m",
    price: "Rs 1,250",
    seatsLeft: "2 SEATS LEFT",
    rating: "4.5",
    features: ["CHARGING POINT", "BLANKET", "WATER BOTTLE"],
    about: "About Bus: Comfortable AC bus with neat seats and reliable night travel.",
  },
  {
    id: "3",
    operator: "Bharat Express",
    subtitle: "Volvo AC Sleeper (2+1)",
    departure: "22:00",
    arrival: "06:45",
    from: "Mumbai, Borivali",
    to: "Pune, Swargate",
    duration: "8h 45m",
    price: "Rs 1,250",
    seatsLeft: "2 SEATS LEFT",
    rating: "4.5",
    features: ["LIVE TRACKING", "USB CHARGER", "EMERGENCY SUPPORT"],
    about: "About Bus: Trusted operator bus with good seating and easy boarding.",
  },
  {
    id: "4",
    operator: "Orange Tours",
    subtitle: "Volvo Multi Axle Seater (2+2)",
    departure: "21:30",
    arrival: "05:50",
    from: "Mumbai, Andheri",
    to: "Pune, Wakad",
    duration: "8h 20m",
    price: "Rs 440",
    seatsLeft: "12 SEATS LEFT",
    rating: "4.3",
    features: ["FREE WIFI", "READING LIGHT", "FRESH LINEN"],
    about: "About Bus: Spacious seater bus suited for budget-friendly city travel.",
  },
  {
    id: "5",
    operator: "Sharma Travels",
    subtitle: "AC Seater 2+2",
    departure: "23:15",
    arrival: "06:55",
    from: "Mumbai, Dadar",
    to: "Pune, Shivaji Nagar",
    duration: "7h 40m",
    price: "Rs 440",
    seatsLeft: "10 SEATS LEFT",
    rating: "4.6",
    features: ["BEST PRICE GUARANTEED", "FEMALE FRIENDLY", "LIVE TRACKING"],
    about: "About Bus: Popular seater option with safe and comfortable seating.",
    topRated: true,
  },
  {
    id: "6",
    operator: "IntrCity SmartBus",
    subtitle: "Bharat Benz AC Sleeper",
    departure: "20:45",
    arrival: "05:15",
    from: "Mumbai, Sion",
    to: "Pune, Hinjewadi",
    duration: "8h 30m",
    price: "Rs 1,099",
    seatsLeft: "3 SEATS LEFT",
    rating: "4.4",
    features: ["SANITIZED BUS", "CHARGING POINT", "FREE WIFI"],
    about: "About Bus: Premium sleeper bus with well-maintained interior and comfort.",
  },
];

export default function BusListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const [selectedFilter, setSelectedFilter] = React.useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);

  const handleFilterPress = React.useCallback(
    (item: FilterChip) => {
      if (item.opensScreen) {
        setSelectedFilter(null);
        navigation.navigate("AllFilterScreen");
        return;
      }

      setSelectedFilter(item.id);
    },
    [navigation]
  );

  const handleOpenSeatSelection = React.useCallback(
    (bus: BusCard) => {
      setSelectedBusId(bus.id);
      navigation.navigate("SeatSelectionScreen", { bus });
    },
    [navigation]
  );

  const handleOpenAboutBus = React.useCallback(
    (bus: BusCard) => {
      navigation.navigate("AboutBusScreen", { bus });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={34} color="#6F6F75" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.routeTitle}>{"Mumbai -> Pune"}</Text>
          <Text style={styles.routeMeta}>24 OCT • 2 PASSENGERS</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.85} style={styles.headerActionButton}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={28}
              color="#D61A33"
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={styles.profileButton}>
            <MaterialCommunityIcons name="account" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>34 Buses found</Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.sortText}>Sort by: Rating</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filterChips.map((item) => {
            const isSelected = !item.opensScreen && selectedFilter === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => handleFilterPress(item)}
                style={[styles.filterChip, isSelected ? styles.filterChipActive : null]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.filterChipTextActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.cardsList}>
          {busCards.map((item) => {
            const isHighlighted = selectedBusId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setSelectedBusId(item.id)}
                style={[styles.busCard, isHighlighted ? styles.busCardHighlighted : null]}
              >
                <View style={styles.busCardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleWrap}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.operatorText}>{item.operator}</Text>
                        {item.topRated ? (
                          <View style={styles.topRatedBadge}>
                            <Text style={styles.topRatedText}>TOP RATED</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.subtitleText}>{item.subtitle}</Text>
                    </View>

                    <View
                      style={[
                        styles.ratingPill,
                        isHighlighted ? styles.ratingPillHighlighted : null,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="star"
                        size={14}
                        color={isHighlighted ? "#FFC94A" : "#FFFFFF"}
                      />
                      <Text
                        style={[
                          styles.ratingText,
                          isHighlighted ? styles.ratingTextHighlighted : null,
                        ]}
                      >
                        {item.rating}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timingRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeText}>{item.departure}</Text>
                      <Text style={styles.placeText}>{item.from}</Text>
                    </View>

                    <View style={styles.durationWrap}>
                      <Text style={styles.durationText}>{item.duration}</Text>
                      <View style={styles.durationLineRow}>
                        <View style={styles.durationDot} />
                        <View
                          style={[
                            styles.durationLine,
                            isHighlighted ? styles.durationLineHighlighted : null,
                          ]}
                        />
                        <View
                          style={[
                            styles.durationDot,
                            isHighlighted ? styles.durationDotHighlighted : null,
                          ]}
                        />
                      </View>
                    </View>

                    <View style={[styles.timeBlock, styles.timeBlockRight]}>
                      <Text style={styles.timeText}>{item.arrival}</Text>
                      <Text style={styles.placeText}>{item.to}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.priceText}>{item.price}</Text>
                      <Text style={styles.seatsText}>{item.seatsLeft}</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleOpenSeatSelection(item)}
                      style={[
                        styles.seatsButton,
                        isHighlighted ? styles.seatsButtonHighlighted : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.seatsButtonText,
                          isHighlighted ? styles.seatsButtonTextHighlighted : null,
                        ]}
                      >
                        View Seats
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.highlightFooter,
                    isHighlighted ? styles.highlightFooterSelected : null,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenAboutBus(item)}
                  >
                    <Text style={styles.aboutBusLink}>About Bus</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitleWrap: {
    flex: 1,
    paddingLeft: 6,
  },
  routeTitle: {
    color: "#3C3C43",
    fontSize: 21,
    fontWeight: "700",
  },
  routeMeta: {
    marginTop: 4,
    color: "#6D6D73",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerActionButton: {
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
    backgroundColor: "#6E7F89",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
  },
  resultsRow: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsText: {
    color: "#4B4B52",
    fontSize: 13,
    fontWeight: "700",
  },
  sortText: {
    color: "#446EF2",
    fontSize: 13,
    fontWeight: "600",
  },
  filtersRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    minWidth: 42,
    paddingHorizontal: 15,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFD8D8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8BABA",
  },
  filterChipActive: {
    backgroundColor: "#CF1833",
    borderColor: "#CF1833",
  },
  filterChipText: {
    color: "#8E6D6D",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  cardsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 14,
    marginBottom: 30,
  },
  busCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  busCardHighlighted: {
    borderColor: "#E41C36",
  },
  busCardBody: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  operatorText: {
    color: "#4A4A50",
    fontSize: 14,
    fontWeight: "700",
  },
  topRatedBadge: {
    marginLeft: 8,
    backgroundColor: "#97E4FF",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  topRatedText: {
    color: "#0078A6",
    fontSize: 8,
    fontWeight: "800",
  },
  subtitleText: {
    marginTop: 4,
    color: "#8F8F95",
    fontSize: 11,
    fontWeight: "500",
  },
  ratingPill: {
    minWidth: 52,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#6B6B70",
    borderWidth: 1,
    borderColor: "#6B6B70",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  ratingPillHighlighted: {
    backgroundColor: "#6B6B70",
    borderColor: "#6B6B70",
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  ratingTextHighlighted: {
    color: "#FFFFFF",
  },
  timingRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  timeBlock: {
    width: 82,
  },
  timeBlockRight: {
    alignItems: "flex-end",
  },
  timeText: {
    color: "#4A4A50",
    fontSize: 20,
    fontWeight: "800",
  },
  placeText: {
    marginTop: 2,
    color: "#5E5E63",
    fontSize: 11,
    fontWeight: "500",
  },
  durationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  durationText: {
    color: "#8D8D92",
    fontSize: 9,
    fontWeight: "500",
  },
  durationLineRow: {
    marginTop: 5,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  durationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E0E0E0",
  },
  durationDotHighlighted: {
    backgroundColor: "#B90F28",
  },
  durationLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E5E8",
  },
  durationLineHighlighted: {
    backgroundColor: "#D31A33",
  },
  cardBottomRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  priceText: {
    color: "#424248",
    fontSize: 17,
    fontWeight: "800",
  },
  seatsText: {
    marginTop: 3,
    color: "#E0283B",
    fontSize: 10,
    fontWeight: "800",
  },
  seatsButton: {
    minWidth: 146,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FF3550",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  seatsButtonHighlighted: {
    backgroundColor: "#D61A33",
    borderColor: "#D61A33",
  },
  seatsButtonText: {
    color: "#E11C35",
    fontSize: 22 / 1.5,
    fontWeight: "700",
  },
  seatsButtonTextHighlighted: {
    color: "#FFFFFF",
  },
  highlightFooter: {
    minHeight: 38,
    backgroundColor: "#FFF2F3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#F2D5D9",
  },
  highlightFooterSelected: {
    backgroundColor: "#FFF2F3",
    borderTopColor: "#F2D5D9",
  },
  aboutBusLink: {
    color: "#2D6BFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
