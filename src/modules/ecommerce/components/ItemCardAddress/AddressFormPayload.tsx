import React, { useMemo, useState, useEffect } from "react";
import { Dropdown } from "react-native-element-dropdown";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchAllStates } from "../../api/AddressApi";
import { useAlert } from "../alerts";

type AddressTag = "Home" | "Work" | "Other";

type StateOption = {
  state_id: number;
  state_name: string;
  status?: number;
  created_at?: string;
};

export type AddressFormPayload = {
  saveAs: AddressTag;
  flatHouseBuilding: string;
  areaLocality: string;
  fullAddress: string;
  landmark?: string;
  name?: string;
  phone?: string;
  pincode: string;
  city: string;
  state?: string;
  state_id?: number;
  isDefault?: boolean;
};

type Props = {
  visible: boolean;
  fullAddress: string;
  defaultName?: string;
  defaultPhone?: string;
  initialValues?: Partial<AddressFormPayload>;
  onClose: () => void;
  onSubmit: (payload: AddressFormPayload) => Promise<void> | void;
};

const chipIcon = (tag: AddressTag) => {
  if (tag === "Home") return "⌂";
  if (tag === "Work") return "⌁";
  return "◎";
};

function AddressDetailsSheet({
  visible,
  fullAddress,
  defaultName,
  defaultPhone,
  initialValues,
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const [saveAs, setSaveAs] = useState<AddressTag>(initialValues?.saveAs ?? "Home");
  const [flatHouseBuilding, setFlatHouseBuilding] = useState(initialValues?.flatHouseBuilding ?? "");
  const [areaLocality, setAreaLocality] = useState(initialValues?.areaLocality ?? "");
  const [landmark, setLandmark] = useState(initialValues?.landmark ?? "");
  const [name, setName] = useState(initialValues?.name ?? defaultName ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? defaultPhone ?? "");
  const [pincode, setPincode] = useState(initialValues?.pincode ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [states, setStates] = useState<StateOption[]>([]);
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState("");

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const res = await fetchAllStates();
      const statesData = Array.isArray(res?.data) ? res.data : [];
      setStates(statesData);
    } catch (error) {
      console.log("State Error:", error);
      setStates([]);
    }
  };
  useEffect(() => {
    if (!pincode && fullAddress) {
      const m = fullAddress.match(/(\d{6})/);
      if (m) setPincode(m[1]);
    }
  }, [fullAddress, pincode]);

  useEffect(() => {
    if (!initialValues) return;

    if (initialValues.saveAs) setSaveAs(initialValues.saveAs);
    setFlatHouseBuilding(initialValues.flatHouseBuilding ?? "");
    setAreaLocality(initialValues.areaLocality ?? "");
    setLandmark(initialValues.landmark ?? "");
    setName(initialValues.name ?? defaultName ?? "");
    setPhone(initialValues.phone ?? defaultPhone ?? "");
    setPincode(initialValues.pincode ?? "");
    setCity(initialValues.city ?? "");
    setStateId(initialValues.state_id ?? null);
    setStateName(initialValues.state ?? "");
  }, [initialValues, defaultName, defaultPhone]);

  useEffect(() => {
    if (!stateName || states.length === 0) return;
    const matchedState = states.find(
      (item) => item.state_name.toLowerCase() === stateName.toLowerCase()
    );
    if (matchedState) setStateId(matchedState.state_id);
  }, [stateName, states]);

  const errors = useMemo(() => {
    const e: { [k: string]: string } = {};
    if (!flatHouseBuilding.trim()) e.flatHouseBuilding = "Required";
    if (!areaLocality.trim()) e.areaLocality = "Required";
    if (!pincode.trim()) e.pincode = "Required";
    if (!city.trim()) e.city = "Required";
    return e;
  }, [flatHouseBuilding, areaLocality, pincode, city]);

  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  if (!visible) return null;

  const handleSubmit = async () => {
    setTouched({
      flatHouseBuilding: true,
      areaLocality: true,
      pincode: true,
      city: true,
    });

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit({
        saveAs,
        flatHouseBuilding: flatHouseBuilding.trim(),
        areaLocality: areaLocality.trim(),
        fullAddress,
        landmark: landmark.trim() || undefined,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        pincode: pincode.trim(),
        city: city.trim(),
        state_id: stateId ?? undefined,
        state: stateName.trim() || undefined,
      });
    } catch (err: any) {
      console.error("Failed to save address:", err);
      alert.error("Error", err?.response?.data?.message || "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.sheetHandle} />
          <Text style={styles.headerTitle}>Enter Complete Address</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Save Address as</Text>
          <View style={styles.chipRow}>
            {(["Home", "Work", "Other"] as AddressTag[]).map((tag) => {
              const active = saveAs === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSaveAs(tag)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipIcon, active && styles.chipTextActive]}>
                    {chipIcon(tag)}
                  </Text>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Flat / House no / Building Name*</Text>
          <TextInput
            value={flatHouseBuilding}
            onChangeText={setFlatHouseBuilding}
            placeholder="Enter here"
            style={[
              styles.input,
              touched.flatHouseBuilding && errors.flatHouseBuilding ? styles.inputError : null,
            ]}
            onBlur={() => setTouched((p) => ({ ...p, flatHouseBuilding: true }))}
          />
          {touched.flatHouseBuilding && errors.flatHouseBuilding ? (
            <Text style={styles.errorText}>{errors.flatHouseBuilding}</Text>
          ) : null}

          <Text style={styles.label}>Area / Sector / Locality*</Text>
          <TextInput
            value={areaLocality}
            onChangeText={setAreaLocality}
            placeholder="Enter here"
            style={[
              styles.input,
              touched.areaLocality && errors.areaLocality ? styles.inputError : null,
            ]}
            onBlur={() => setTouched((p) => ({ ...p, areaLocality: true }))}
          />
          {touched.areaLocality && errors.areaLocality ? (
            <Text style={styles.errorText}>{errors.areaLocality}</Text>
          ) : null}

          <Text style={styles.label}>Nearby Landmark (Optional)</Text>
          <TextInput value={landmark} onChangeText={setLandmark} placeholder="Enter here" style={styles.input} />

          <Text style={styles.label}>Pincode*</Text>
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter pincode"
            style={[styles.input, touched.pincode && errors.pincode && styles.inputError]}
            onBlur={() => setTouched((p) => ({ ...p, pincode: true }))}
          />
          {touched.pincode && errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}

          <Text style={styles.label}>City*</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            style={[styles.input, touched.city && errors.city && styles.inputError]}
            onBlur={() => setTouched((p) => ({ ...p, city: true }))}
          />
          {touched.city && errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

          <Text style={styles.label}>State</Text>

          <Dropdown
            style={styles.input}
            data={states}
            labelField="state_name"
            valueField="state_id"
            placeholder="Select State"
            value={stateId}
            onChange={item => {
              setStateId(item.state_id);
              setStateName(item.state_name);
            }}
          />

          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Enter name" style={styles.input} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ""))}
            placeholder="Enter phone"
            keyboardType="number-pad"
            maxLength={10}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.9}
            style={[styles.ctaWrapper, { marginBottom: insets.bottom + 78 }]}
          >
            <LinearGradient
              colors={["#8665FF", "#5B47A3"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.cta, (!canSubmit || submitting) && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>{submitting ? "Saving..." : "Update address and proceed"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default AddressDetailsSheet;

/* styles omitted for brevity — keep your existing styles (no change required) */
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", backgroundColor: "transparent" },
  sheet: { height: "78%", backgroundColor: "white", borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetHandle: {
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: -24,
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  headerTitle: { fontSize: 14, fontWeight: "800" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 16, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 22 },
  label: { fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 8 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "white" },
  chipActive: { borderColor: "#7c3aed", backgroundColor: "rgba(124,58,237,0.08)" },
  chipIcon: { fontSize: 14, fontWeight: "800" },
  chipText: { fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#7c3aed" },
  input: { borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "white", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13 },
  inputError: { borderColor: "#ef4444" },
  errorText: { marginTop: 6, color: "#ef4444", fontSize: 11, fontWeight: "700" },
  readonlyBox: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 12, padding: 12, minHeight: 56, justifyContent: "center", backgroundColor: "#fafafa" },
  readonlyText: { fontSize: 12, fontWeight: "600", color: "#444" },
  ctaWrapper: {
    marginTop: 18,
    alignSelf: "center",

  },

  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: 238,

  },

  ctaDisabled: {
    opacity: 0.5,
  },

  ctaText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",

  },

});
