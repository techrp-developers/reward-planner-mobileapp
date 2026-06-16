import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import GradientButton from "../../constant/GradientButton";
import { CITIES } from "../../constant/InsuranceConstants";
import { getZoneFromCity, filterCities } from "../../utils/InsuranceUtils";
import {
  fetchUserInfo,
  getAuthHeaders,
  isAuthenticated,
} from "../../../common/auth/api/AuthAPI";

type FormData = {
  gender: string;
  members: string[];
  memberCounts: Record<string, number>;
  ages: Record<string, string | number>;
  details: {
    firstName?: string;
    lastName?: string;
    dob?: string; // ✅ standardized storage: ISO "YYYY-MM-DD"
    mobileNumber?: string;
    pincode?: string;
    city?: string;
    zone?: string;
    coverAmount?: string;
    agreeToTerms?: boolean;
  };
};

type Props = {
  data: FormData;
  setData: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
};

/** ===== DOB helpers (standardized, professional) ===== **/

// If backend gives ISO like "1997-02-23", show "23/02/1997"
function isoToDdmmyyyy(iso?: string) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return ""; // unknown format
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

// Convert "23/02/1997" -> "1997-02-23"
function ddmmyyyyToIso(ddmmyyyy: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

// Light validation (day/month/year ranges + real date check)
function isValidDdmmyyyy(ddmmyyyy: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  const d = new Date(yyyy, mm - 1, dd);
  return (
    d.getFullYear() === yyyy &&
    d.getMonth() === mm - 1 &&
    d.getDate() === dd
  );
}

// Auto-format as user types: "23021997" -> "23/02/1997"
function formatDobInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}

// Professional City Input Dropdown Component
const CityInputDropdown: React.FC<{
  selectedCity: string | undefined;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onCitySelect: (city: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  filteredCities: string[];
}> = ({
  selectedCity,
  searchTerm,
  onSearchChange,
  onCitySelect,
  isOpen,
  setIsOpen,
  filteredCities,
}) => {
  return (
    <View style={styles.cityInputWrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsOpen(!isOpen)}
        style={[styles.cityCard, isOpen && styles.cityCardFocused]}
      >
        <View style={styles.cityLeft}>
          <View
            style={[
              styles.cityIconCircle,
              selectedCity && styles.cityIconCircleActive,
            ]}
          >
            <MaterialIcons name="location-city" size={24} color="#8665FF" />
          </View>
          <View style={styles.cityTextContainer}>
            <Text style={styles.cityLabel}>City</Text>
            <Text style={styles.citySubLabel}>Select your location</Text>
          </View>
        </View>

        <View style={[styles.cityInputBox, isOpen && styles.cityInputActive]}>
          <TextInput
            style={styles.cityInput}
            placeholder="Search"
            value={searchTerm || (selectedCity ? selectedCity : "")}
            onChangeText={onSearchChange}
            onFocus={() => setIsOpen(true)}
            placeholderTextColor="#B0B0B5"
          />
          <MaterialIcons
            name={isOpen ? "expand-less" : "expand-more"}
            size={18}
            color="#8665FF"
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.cityDropdownContainer}>
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={50}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cityListItem,
                  selectedCity === item && styles.cityListItemSelected,
                ]}
                onPress={() => {
                  onCitySelect(item);
                  setIsOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.cityListItemText,
                    selectedCity === item && styles.cityListItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {selectedCity === item && (
                  <MaterialIcons name="check" size={18} color="#8665FF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default function Step2PA({ data, setData, onNext, onBack }: Props) {  const insets = useSafeAreaInsets();  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>(CITIES);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // UI state for DOB shown as DD/MM/YYYY (while stored as ISO)
  const [dobDisplay, setDobDisplay] = useState<string>("");

  // Prefill DOB display whenever stored DOB changes (e.g., from API prefill)
  useEffect(() => {
    const display = isoToDdmmyyyy(data.details.dob);
    if (display && display !== dobDisplay) setDobDisplay(display);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.details.dob]);

  // Fetch user info and check authentication on mount
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        if (!isAuthenticated()) {
          Alert.alert("Login Required", "Please log in to get insurance quotes", [
            { text: "OK", onPress: () => onBack() },
          ]);
          setChecking(false);
          return;
        }

        await getAuthHeaders();

        const userInfo = await fetchUserInfo();
        console.log("📱 Step2PA - User Info Received:", userInfo);

        if (userInfo?.user) {
          const user = userInfo.user;

          // ✅ Assuming backend returns ISO "YYYY-MM-DD" in user.date_of_birth
          const userDobIso =
            user.date_of_birth || user.dob || user.birth_date || "";

          setData({
            ...data,
            details: {
              ...data.details,
              firstName: data.details.firstName || user.first_name || "",
              lastName: data.details.lastName || user.last_name || "",
              mobileNumber: data.details.mobileNumber || user.phone || "",
              city: data.details.city || user.city || "",
              pincode: data.details.pincode || user.pincode || "",
              zone: data.details.zone || getZoneFromCity(user.city || ""),
              dob: data.details.dob || userDobIso || "",
            },
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setChecking(false);
      }
    };

    checkAuthAndLoadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Input Changes
  const handleInputChange = (field: string, value: any) => {
    setData({
      ...data,
      details: { ...data.details, [field]: value },
    });
  };

  // DOB change: update display + store ISO when valid
  const handleDobChange = (raw: string) => {
    const formatted = formatDobInput(raw);
    setDobDisplay(formatted);

    if (isValidDdmmyyyy(formatted)) {
      const iso = ddmmyyyyToIso(formatted);
      handleInputChange("dob", iso);
    } else {
      // keep stored dob empty until valid (so validation works correctly)
      handleInputChange("dob", "");
    }
  };

  // Handle City Input with Auto-Zone Update
  const handleCityChange = (value: string) => {
    setData({
      ...data,
      details: {
        ...data.details,
        city: value,
        zone: getZoneFromCity(value),
      },
    });
    setCitySearchTerm(value);

    const filtered = filterCities(value, CITIES);
    setFilteredCities(filtered);
  };

  // Handle City Selection
  const handleCitySelect = (city: string) => {
    handleCityChange(city);
    setCitySearchTerm("");
    setIsCityDropdownOpen(false);
  };

  const isDobValid = useMemo(() => {
    // since we store ISO only when valid, this is enough:
    return !!data.details.dob;
  }, [data.details.dob]);

  const isFormValid =
    !!data.details.firstName &&
    !!data.details.lastName &&
    isDobValid &&
    (data.details.mobileNumber?.length === 10) &&
    (data.details.pincode?.length === 6) &&
    !!data.details.city &&
    !!data.details.zone;

  const handleContinue = () => {
    if (!isFormValid) {
      Alert.alert(
        "Validation",
        "Please complete all personal details to continue"
      );
      return;
    }
    onNext();
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="lock-outline" size={50} color="#8665FF" />
          <Text style={styles.loadingText}>Verifying authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const FOOTER_HEIGHT = 88; // back button (56) + padding (20) + gap (12)

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: FOOTER_HEIGHT + insets.bottom + 24,
          },
        ]}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 16 : 120}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Personal Details</Text>
          <Text style={styles.headerSubtitle}>
            This information helps us personalize your insurance quotes.
          </Text>
        </View>

        <View style={styles.formContainer}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>First Name *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter first name"
                    value={data.details.firstName}
                    onChangeText={(v) => handleInputChange("firstName", v)}
                  />
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.flex1}>
                <Text style={styles.label}>Last Name *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter last name"
                    value={data.details.lastName}
                    onChangeText={(v) => handleInputChange("lastName", v)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Date of Birth *</Text>
                <View
                  style={[
                    styles.inputBox,
                    !isDobValid && dobDisplay.length > 0 ? styles.inputErrorBox : null,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="DD/MM/YYYY"
                    keyboardType="number-pad"
                    value={dobDisplay}
                    onChangeText={handleDobChange}
                    maxLength={10}
                  />
                  <MaterialIcons
                    name="calendar-today"
                    size={18}
                    color="#8665FF"
                  />
                </View>
                {!isDobValid && dobDisplay.length > 0 && (
                  <Text style={styles.errorText}>Enter a valid date (DD/MM/YYYY)</Text>
                )}
              </View>

              <View style={styles.spacer} />

              <View style={styles.flex1}>
                <Text style={styles.label}>Mobile Number *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.textInput, styles.mobileInput]}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={data.details.mobileNumber}
                    onChangeText={(v) =>
                      handleInputChange("mobileNumber", v.replace(/\D/g, ""))
                    }
                  />
                  <MaterialIcons name="phone" size={18} color="#8665FF" />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Pincode *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter pincode"
                    keyboardType="numeric"
                    maxLength={6}
                    value={data.details.pincode}
                    onChangeText={(v) =>
                      handleInputChange("pincode", v.replace(/\D/g, ""))
                    }
                  />
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.flex1}>
                <Text style={styles.label}>Zone</Text>
                <View style={[styles.inputBox, styles.disabledBox]}>
                  <Text style={[styles.textInput, styles.disabledText]}>
                    {data.details.zone || "Auto-filled"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>City *</Text>
              <CityInputDropdown
                selectedCity={data.details.city}
                searchTerm={citySearchTerm}
                onSearchChange={handleCityChange}
                onCitySelect={handleCitySelect}
                isOpen={isCityDropdownOpen}
                setIsOpen={setIsCityDropdownOpen}
                filteredCities={filteredCities}
              />
            </View>
          </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="keyboard-backspace" size={24} color="#8665FF" />
          </TouchableOpacity>
          <View style={styles.footerButtonWrapper}>
            <GradientButton
              title="Continue"
              onPress={handleContinue}
              disabled={!isFormValid}
            />
          </View>
        </View>
      </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFF" },
  backgroundGradient: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 25 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 14, color: "#71717A", lineHeight: 20 },

  formContainer: { gap: 18 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  flex1: { flex: 1 },
  fieldWrapper: { width: "100%" },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B4B4B",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBf5",
    paddingHorizontal: 15,
    height: 52,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
    flex: 1,
  },

  inputErrorBox: {
    borderColor: "#E11D48",
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    color: "#E11D48",
    fontSize: 12,
    fontWeight: "600",
  },

  disabledBox: {
    backgroundColor: "#F9F9FB",
    borderColor: "#D5D5DB",
  },
  disabledText: {
    color: "#999999",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBf5",
    justifyContent: "center",
    alignItems: "center",
  },

  keyboardAvoidingView: { flex: 1 },
  spacer: { width: 12 },
  mobileInput: { flex: 1 },
  footerButtonWrapper: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    color: "#8665FF",
    fontWeight: "700",
    fontSize: 14,
  },

  // ===== CITY INPUT DROPDOWN STYLES =====
  cityInputWrapper: {
    marginBottom: 4,
  },

  cityDropdownContainer: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    marginTop: 8,
    maxHeight: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },

  cityListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F5",
  },

  cityListItemSelected: {
    backgroundColor: "#F9F8FF",
  },

  cityListItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A2E",
    flex: 1,
  },

  cityListItemTextSelected: {
    fontWeight: "700",
    color: "#8665FF",
  },

  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cityCardFocused: {
    borderColor: "#8665FF",
    backgroundColor: "#F9F8FF",
    borderWidth: 1.5,
    shadowOpacity: 0.06,
    elevation: 4,
  },
  cityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cityIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8F9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cityIconCircleActive: {
    backgroundColor: "#EBE5FF",
  },
  cityTextContainer: {
    justifyContent: "center",
  },
  cityLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    letterSpacing: -0.3,
  },
  citySubLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  cityInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    paddingHorizontal: 12,
    minWidth: 140,
    height: 44,
    justifyContent: "center",
    gap: 8,
  },
  cityInputActive: {
    borderColor: "#8665FF",
    backgroundColor: "#F9F8FF",
  },
  cityInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
    flex: 1,
    textAlign: "center",
  },
});