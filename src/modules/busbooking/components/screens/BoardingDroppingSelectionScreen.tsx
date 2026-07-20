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

type ActiveTab = "boarding" | "dropping";

type PointItem = {
  id: string;
  time: string;
  title: string;
  city: string;
};

const boardingPoints: PointItem[] = [
  {
    id: "boarding-1",
    time: "21:30",
    title: "SWARGATE - Purple Tr Mitramandal Chowk Shraddha Lodge Pune, Maharashtra",
    city: "Pune",
  },
  {
    id: "boarding-2",
    time: "22:00",
    title: "Paud Road- More Vidyalay chowk, Near Sujata Mastani, Purple Metrolink Pune, Maharashtra",
    city: "Pune",
  },
  {
    id: "boarding-3",
    time: "22:05",
    title: "Lenskart Store, Opp Kinara Hotel Paud road Pune, Maharashtra",
    city: "Pune",
  },
  {
    id: "boarding-4",
    time: "22:10",
    title: "Chandani Chowk Bridge, Pune-Mumbai Highway, Opp Irani Cafe - Purple Office Bavdhan, Maharashtra",
    city: "Pune",
  },
  {
    id: "boarding-5",
    time: "22:15",
    title: "Pashan Sus Road-Audi Showroom Pune, Maharashtra",
    city: "Pune",
  },
  {
    id: "boarding-6",
    time: "22:20",
    title: "Balewadi-Balewadi Stadium End of Flyover Near Orchid Hotel Pune, Maharashtra",
    city: "Pune",
  },
  {
    id: "boarding-7",
    time: "22:25",
    title: "Hinjewadi Bhujbal Bridge Service Road Nr Rajyog Hotel",
    city: "Pune",
  },
];

const droppingPoints: PointItem[] = [
  {
    id: "dropping-1",
    time: "05:45",
    title: "Borivali East National Park Metro Gate Mumbai, Maharashtra",
    city: "Mumbai",
  },
  {
    id: "dropping-2",
    time: "06:05",
    title: "Andheri East Highway Junction Near Hanuman Road Mumbai, Maharashtra",
    city: "Mumbai",
  },
  {
    id: "dropping-3",
    time: "06:20",
    title: "Sion Circle Opp Bus Depot Mumbai, Maharashtra",
    city: "Mumbai",
  },
  {
    id: "dropping-4",
    time: "06:35",
    title: "Dadar TT Plaza Near Bridge Mumbai, Maharashtra",
    city: "Mumbai",
  },
  {
    id: "dropping-5",
    time: "06:45",
    title: "Mumbai Central Service Road Near Main Stop Mumbai, Maharashtra",
    city: "Mumbai",
  },
];

type PointRowProps = {
  item: PointItem;
  isSelected: boolean;
  onPress: () => void;
};

function PointRow({ item, isSelected, onPress }: PointRowProps) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.pointRow}>
      <Text style={styles.pointTime}>{item.time}</Text>

      <View style={styles.pointTextWrap}>
        <Text style={styles.pointTitle}>{item.title}</Text>
      </View>

      <View style={[styles.radioOuter, isSelected ? styles.radioOuterSelected : null]}>
        {isSelected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function BoardingDroppingSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const route = useRoute<RouteProp<ModuleStackParamList, "BoardingDroppingSelectionScreen">>();
  const { bus, passengers, selectedSeats } = route.params;
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("boarding");
  const [selectedBoardingPointId, setSelectedBoardingPointId] = React.useState(boardingPoints[0].id);
  const [selectedDroppingPointId, setSelectedDroppingPointId] = React.useState(droppingPoints[0].id);

  const activePoints = activeTab === "boarding" ? boardingPoints : droppingPoints;
  const selectedBoardingPoint = boardingPoints.find((item) => item.id === selectedBoardingPointId) ?? boardingPoints[0];
  const selectedDroppingPoint = droppingPoints.find((item) => item.id === selectedDroppingPointId) ?? droppingPoints[0];
  const selectedPoint = activeTab === "boarding" ? selectedBoardingPoint : selectedDroppingPoint;

  const handleContinue = React.useCallback(() => {
    navigation.navigate("BusSummaryScreen", {
      bus,
      selectedSeats,
      passengers,
      boardingPoint: selectedBoardingPoint.title,
      droppingPoint: selectedDroppingPoint.title,
    });
  }, [bus, navigation, passengers, selectedBoardingPoint.title, selectedDroppingPoint.title, selectedSeats]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={30} color="#222222" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Select boarding & dropping points</Text>
          <Text style={styles.headerSubtitle}>
            {bus.from.split(",")[0]} → {bus.to.split(",")[0]}
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setActiveTab("boarding")}
          style={styles.tabButton}
        >
          <Text style={[styles.tabTitle, activeTab === "boarding" ? styles.tabTitleActive : null]}>
            Boarding points
          </Text>
          <Text style={styles.tabSubtitle}>{selectedBoardingPoint.city}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setActiveTab("dropping")}
          style={styles.tabButton}
        >
          <Text style={[styles.tabTitle, activeTab === "dropping" ? styles.tabTitleActive : null]}>
            Dropping points
          </Text>
          <Text style={styles.tabSubtitle}>{selectedDroppingPoint.city}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.activeTabIndicator, activeTab === "dropping" ? styles.activeTabIndicatorRight : null]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectedCard}>
          <LinearGradient
            colors={["rgba(164,255,200,0.85)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.3, y: 0.2 }}
            style={styles.selectedGlow}
          />
          <Text style={styles.sectionHeader}>
            {activeTab === "boarding"
              ? "Your selected boarding point"
              : "Your selected dropping point"}
          </Text>
          <View style={styles.selectedDivider} />
          <PointRow
            item={selectedPoint}
            isSelected
            onPress={() => {}}
          />
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionHeader}>
            {activeTab === "boarding"
              ? `All boarding points in ${selectedBoardingPoint.city}`
              : `All dropping points in ${selectedDroppingPoint.city}`}
          </Text>

          <View style={styles.listDivider} />

          {activePoints.map((item, index) => {
            const isSelected =
              activeTab === "boarding"
                ? item.id === selectedBoardingPointId
                : item.id === selectedDroppingPointId;

            return (
              <View key={item.id}>
                <PointRow
                  item={item}
                  isSelected={isSelected}
                  onPress={() => {
                    if (activeTab === "boarding") {
                      setSelectedBoardingPointId(item.id);
                    } else {
                      setSelectedDroppingPointId(item.id);
                    }
                  }}
                />
                {index !== activePoints.length - 1 ? <View style={styles.listRowDivider} /> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity activeOpacity={0.92} onPress={handleContinue}>
          <LinearGradient
            colors={["#E53A45", "#D7323E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue to Payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5FB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6EC",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: "#1E1E22",
    fontSize: 17,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 3,
    color: "#7D7B83",
    fontSize: 12,
    fontWeight: "500",
  },
  tabsWrap: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E9E8EF",
  },
  tabButton: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 14,
  },
  tabTitle: {
    color: "#26242B",
    fontSize: 16,
    fontWeight: "700",
  },
  tabTitleActive: {
    fontWeight: "800",
  },
  tabSubtitle: {
    marginTop: 4,
    color: "#717079",
    fontSize: 12,
    fontWeight: "500",
  },
  activeTabIndicator: {
    width: "50%",
    height: 4,
    backgroundColor: "#D93746",
  },
  activeTabIndicatorRight: {
    marginLeft: "50%",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 22,
    gap: 14,
  },
  selectedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  selectedGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 150,
    height: 84,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    color: "#202026",
    fontSize: 16,
    fontWeight: "500",
  },
  selectedDivider: {
    height: 1,
    backgroundColor: "#E8E6EB",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  listDivider: {
    height: 1,
    backgroundColor: "#E8E6EB",
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pointTime: {
    width: 58,
    color: "#1E1D23",
    fontSize: 18,
    fontWeight: "500",
    marginTop: 2,
  },
  pointTextWrap: {
    flex: 1,
    paddingRight: 14,
  },
  pointTitle: {
    color: "#222127",
    fontSize: 16,
    lineHeight: 38 / 1.6,
    fontWeight: "800",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: "#4A4850",
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#3A3840",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D83A46",
  },
  listRowDivider: {
    height: 1,
    backgroundColor: "#E8E6EB",
    marginLeft: 16,
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#ECEAF0",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  continueButton: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
