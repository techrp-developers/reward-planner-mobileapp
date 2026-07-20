import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
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

type Gender = "M" | "F" | "O";

type PassengerForm = {
  fullName: string;
  age: string;
  gender: Gender;
  email: string;
  phone: string;
  whatsappUpdates: boolean;
};

const quickSelectPassengers = [
  { id: "1", name: "Somay" },
  { id: "2", name: "Rahul" },
];

const getFareValue = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;

const createPassengerForm = (): PassengerForm => ({
  fullName: "",
  age: "",
  gender: "M",
  email: "",
  phone: "",
  whatsappUpdates: true,
});

export default function PassengerDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModuleStackParamList>>();
  const route = useRoute<RouteProp<ModuleStackParamList, "PassengerDetailsScreen">>();
  const { bus, selectedSeats } = route.params;

  const [passengers, setPassengers] = React.useState<PassengerForm[]>(
    () => selectedSeats.map(() => createPassengerForm())
  );

  const totalFare = getFareValue(bus.price) * selectedSeats.length;

  const updatePassenger = React.useCallback(
    (index: number, key: keyof PassengerForm, value: string | boolean) => {
      setPassengers((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item
        )
      );
    },
    []
  );

  const applyQuickSelect = React.useCallback((name: string) => {
    if (passengers.length === 0) {
      return;
    }

    updatePassenger(0, "fullName", name);
  }, [passengers.length, updatePassenger]);

  const handleContinueToSummary = React.useCallback(() => {
    navigation.navigate("BoardingDroppingSelectionScreen", {
      bus,
      selectedSeats,
      passengers: selectedSeats.map((seat, index) => ({
        seat,
        fullName: passengers[index]?.fullName || `Passenger ${index + 1}`,
        age: passengers[index]?.age || "",
        gender: passengers[index]?.gender || "M",
        email: passengers[index]?.email || "",
        phone: passengers[index]?.phone || "",
      })),
    });
  }, [bus, navigation, passengers, selectedSeats]);

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

        <Text style={styles.headerTitle}>Passenger Details</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.85} style={styles.alertButton}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#D31637" />
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
        <View style={styles.quickHeaderRow}>
          <Text style={styles.quickHeaderTitle}>Quick Select</Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.addNewText}>Add New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickSelectRow}
        >
          {quickSelectPassengers.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              onPress={() => applyQuickSelect(item.name)}
              style={styles.quickSelectChip}
            >
              <View style={styles.quickAvatar}>
                <MaterialCommunityIcons name="account" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.quickSelectText}>{item.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity activeOpacity={0.88} style={styles.seeMoreChip}>
            <View style={styles.plusBadge}>
              <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.seeMoreText}>See more</Text>
          </TouchableOpacity>
        </ScrollView>

        {selectedSeats.map((seat, index) => {
          const passenger = passengers[index];

          return (
            <View key={seat} style={styles.passengerBlock}>
              <Text style={styles.passengerTitle}>
                Passenger {index + 1} (Seat {seat})
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>*Full Name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={passenger.fullName}
                    onChangeText={(value) => updatePassenger(index, "fullName", value)}
                    placeholder="Enter your name here"
                    placeholderTextColor="#B7B0B8"
                    style={styles.input}
                  />
                  <MaterialCommunityIcons name="account-outline" size={18} color="#A7A0A8" />
                </View>

                <View style={styles.rowFields}>
                  <View style={styles.ageField}>
                    <Text style={styles.fieldLabel}>*Age</Text>
                    <TextInput
                      value={passenger.age}
                      onChangeText={(value) => updatePassenger(index, "age", value)}
                      placeholder="Enter your age"
                      placeholderTextColor="#B7B0B8"
                      keyboardType="number-pad"
                      style={styles.inputSolo}
                    />
                  </View>

                  <View style={styles.genderField}>
                    <Text style={styles.fieldLabel}>*Gender</Text>
                    <View style={styles.genderRow}>
                      {(["M", "F", "O"] as Gender[]).map((gender) => {
                        const isActive = passenger.gender === gender;

                        return (
                          <TouchableOpacity
                            key={gender}
                            activeOpacity={0.88}
                            onPress={() => updatePassenger(index, "gender", gender)}
                            style={[styles.genderChip, isActive ? styles.genderChipActive : null]}
                          >
                            <Text
                              style={[
                                styles.genderChipText,
                                isActive ? styles.genderChipTextActive : null,
                              ]}
                            >
                              {gender}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>*Email ID</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={passenger.email}
                    onChangeText={(value) => updatePassenger(index, "email", value)}
                    placeholder="Enter your Email ID here"
                    placeholderTextColor="#B7B0B8"
                    keyboardType="email-address"
                    style={styles.input}
                  />
                  <MaterialCommunityIcons name="email-outline" size={18} color="#A7A0A8" />
                </View>

                <Text style={styles.fieldLabel}>*Phone number</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={passenger.phone}
                    onChangeText={(value) => updatePassenger(index, "phone", value)}
                    placeholder="Enter your Phone number here"
                    placeholderTextColor="#B7B0B8"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                  <MaterialCommunityIcons name="phone-outline" size={18} color="#A7A0A8" />
                </View>

                <View style={styles.checkboxRow}>
                  <Switch
                    value={passenger.whatsappUpdates}
                    onValueChange={(value) => updatePassenger(index, "whatsappUpdates", value)}
                    trackColor={{ false: "#E4DADF", true: "#F2A0AD" }}
                    thumbColor={passenger.whatsappUpdates ? "#BE1028" : "#FFFFFF"}
                    ios_backgroundColor="#E4DADF"
                  />
                  <Text style={styles.checkboxText}>
                    Send booking confirmation and trip updates via WhatsApp and Email.
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomSummaryRow}>
          <Text style={styles.bottomSeatCount}>
            {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
          </Text>

          <View style={styles.bottomFareWrap}>
            <Text style={styles.bottomFare}>₹{totalFare.toLocaleString("en-IN")}</Text>
            <View style={styles.addIconBox}>
              <MaterialCommunityIcons name="plus" size={14} color="#6D6A72" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleContinueToSummary}
          style={styles.continueButtonWrap}
        >
          <LinearGradient
            colors={["#D31637", "#B20C28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Select boarding & dropping points</Text>
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
    paddingBottom: 32,
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
    color: "#3B3740",
    fontSize: 17,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#556A7A",
    alignItems: "center",
    justifyContent: "center",
  },
  quickHeaderRow: {
    marginTop: 16,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickHeaderTitle: {
    color: "#4B4650",
    fontSize: 16,
    fontWeight: "700",
  },
  addNewText: {
    color: "#2E6EF3",
    fontSize: 16,
    fontWeight: "600",
  },
  quickSelectRow: {
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 12,
  },
  quickSelectChip: {
    minWidth: 110,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFD6D8",
    flexDirection: "row",
    alignItems: "center",
  },
  quickAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#5B6A79",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  quickSelectText: {
    color: "#CB1733",
    fontSize: 14,
    fontWeight: "600",
  },
  seeMoreChip: {
    minWidth: 108,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFE3E3",
    flexDirection: "row",
    alignItems: "center",
  },
  plusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#C40F2A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  seeMoreText: {
    color: "#CB1733",
    fontSize: 14,
    fontWeight: "600",
  },
  passengerBlock: {
    marginTop: 22,
    marginHorizontal: 12,
  },
  passengerTitle: {
    color: "#4A4650",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DFD9",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fieldLabel: {
    color: "#59535D",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrap: {
    height: 42,
    borderWidth: 1,
    borderColor: "#EFE6E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: "#3D3840",
    fontSize: 13,
    paddingVertical: 0,
  },
  rowFields: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ageField: {
    flex: 1,
    marginRight: 10,
  },
  genderField: {
    flex: 1,
  },
  inputSolo: {
    height: 42,
    borderWidth: 1,
    borderColor: "#EFE6E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: "#3D3840",
    fontSize: 13,
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  genderChip: {
    width: 42,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CEC5C8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    backgroundColor: "#C40F2A",
    borderColor: "#C40F2A",
  },
  genderChipText: {
    color: "#8D8690",
    fontSize: 13,
    fontWeight: "700",
  },
  genderChipTextActive: {
    color: "#FFFFFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
    color: "#B1AAB3",
    fontSize: 10,
    lineHeight: 14,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#EEE7E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  bottomSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bottomSeatCount: {
    color: "#3F3A43",
    fontSize: 13,
    fontWeight: "500",
  },
  bottomFareWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomFare: {
    color: "#3C3740",
    fontSize: 18,
    fontWeight: "800",
  },
  addIconBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#A7A1AA",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  continueButtonWrap: {
    width: "100%",
  },
  continueButton: {
    height: 42,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
