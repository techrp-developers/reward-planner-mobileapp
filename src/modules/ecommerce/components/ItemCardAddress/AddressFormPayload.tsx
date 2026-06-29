import React, { useEffect, useMemo, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchAllStates } from "../../api/AddressApi";
import { useAlert } from "../alerts";

type AddressTag = "Home" | "Work" | "Other";

type StateOption = {
  state_id: number;
  state_name: string;
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
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (payload: AddressFormPayload) => Promise<void> | void;
};

const ADDRESS_TAGS: AddressTag[] = ["Home", "Work", "Other"];

const tagIcon = (tag: AddressTag) => {
  if (tag === "Home") return "⌂";
  if (tag === "Work") return "⌁";
  return "◎";
};

function useStates() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchAllStates(forceRefresh);
      setStates(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setStates([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { states, loading, error, retry: () => load(true) };
}

type FormFields = {
  saveAs: AddressTag;
  flatHouseBuilding: string;
  areaLocality: string;
  landmark: string;
  name: string;
  phone: string;
  pincode: string;
  city: string;
  stateId: number | null;
  stateName: string;
};

function buildInitialFields(
  initialValues: Partial<AddressFormPayload> | undefined,
  defaultName?: string,
  defaultPhone?: string
): FormFields {
  return {
    saveAs: initialValues?.saveAs ?? "Home",
    flatHouseBuilding: initialValues?.flatHouseBuilding ?? "",
    areaLocality: initialValues?.areaLocality ?? "",
    landmark: initialValues?.landmark ?? "",
    name: initialValues?.name ?? defaultName ?? "",
    phone: initialValues?.phone ?? defaultPhone ?? "",
    pincode: initialValues?.pincode ?? "",
    city: initialValues?.city ?? "",
    stateId: initialValues?.state_id ?? null,
    stateName: initialValues?.state ?? "",
  };
}

function AddressDetailsSheet({
  visible,
  fullAddress,
  defaultName,
  defaultPhone,
  initialValues,
  submitLabel = "Save address",
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { states, loading: statesLoading, error: statesError, retry: retryStates } = useStates();

  const [fields, setFields] = useState<FormFields>(() =>
    buildInitialFields(initialValues, defaultName, defaultPhone)
  );
  const [isDefault] = useState(initialValues?.isDefault ?? false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Re-sync fields if the record being edited changes while the sheet stays mounted.
  useEffect(() => {
    setFields(buildInitialFields(initialValues, defaultName, defaultPhone));
  }, [initialValues, defaultName, defaultPhone]);

  // Backfill pincode from a freeform address string (e.g. picked from the map) if not already set.
  useEffect(() => {
    if (fields.pincode || !fullAddress) return;
    const match = fullAddress.match(/(\d{6})/);
    if (match) {
      setFields(prev => ({ ...prev, pincode: match[1] }));
    }
  }, [fullAddress, fields.pincode]);

  // If only a state name was supplied (no id), resolve it once the states list loads.
  useEffect(() => {
    if (fields.stateId !== null || !fields.stateName || states.length === 0) return;
    const matched = states.find(
      s => s.state_name.toLowerCase() === fields.stateName.toLowerCase()
    );
    if (matched) {
      setFields(prev => ({ ...prev, stateId: matched.state_id }));
    }
  }, [fields.stateId, fields.stateName, states]);

  const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const markTouched = (key: string) => setTouched(prev => ({ ...prev, [key]: true }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!fields.flatHouseBuilding.trim()) e.flatHouseBuilding = "Required";
    if (!fields.areaLocality.trim()) e.areaLocality = "Required";
    if (!fields.pincode.trim()) e.pincode = "Required";
    if (!fields.city.trim()) e.city = "Required";
    return e;
  }, [fields.flatHouseBuilding, fields.areaLocality, fields.pincode, fields.city]);

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
        saveAs: fields.saveAs,
        flatHouseBuilding: fields.flatHouseBuilding.trim(),
        areaLocality: fields.areaLocality.trim(),
        fullAddress,
        landmark: fields.landmark.trim() || undefined,
        name: fields.name.trim() || undefined,
        phone: fields.phone.trim() || undefined,
        pincode: fields.pincode.trim(),
        city: fields.city.trim(),
        state_id: fields.stateId ?? undefined,
        state: fields.stateName.trim() || undefined,
        isDefault,
      });
    } catch (err: any) {
      console.error("Failed to save address:", err);
      alert.error("Error", err?.response?.data?.message || "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const statePlaceholder = statesLoading
    ? "Loading states..."
    : statesError
    ? "Couldn't load states - tap to retry"
    : "Select State";

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
            {ADDRESS_TAGS.map(tag => {
              const active = fields.saveAs === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setField("saveAs", tag)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipIcon, active && styles.chipTextActive]}>
                    {tagIcon(tag)}
                  </Text>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Flat / House no / Building Name*</Text>
          <TextInput
            value={fields.flatHouseBuilding}
            onChangeText={t => setField("flatHouseBuilding", t)}
            placeholder="Enter here"
            style={[
              styles.input,
              touched.flatHouseBuilding && errors.flatHouseBuilding ? styles.inputError : null,
            ]}
            onBlur={() => markTouched("flatHouseBuilding")}
          />
          {touched.flatHouseBuilding && errors.flatHouseBuilding ? (
            <Text style={styles.errorText}>{errors.flatHouseBuilding}</Text>
          ) : null}

          <Text style={styles.label}>Area / Sector / Locality*</Text>
          <TextInput
            value={fields.areaLocality}
            onChangeText={t => setField("areaLocality", t)}
            placeholder="Enter here"
            style={[
              styles.input,
              touched.areaLocality && errors.areaLocality ? styles.inputError : null,
            ]}
            onBlur={() => markTouched("areaLocality")}
          />
          {touched.areaLocality && errors.areaLocality ? (
            <Text style={styles.errorText}>{errors.areaLocality}</Text>
          ) : null}

          <Text style={styles.label}>Nearby Landmark (Optional)</Text>
          <TextInput
            value={fields.landmark}
            onChangeText={t => setField("landmark", t)}
            placeholder="Enter here"
            style={styles.input}
          />

          <Text style={styles.label}>Pincode*</Text>
          <TextInput
            value={fields.pincode}
            onChangeText={t => setField("pincode", t)}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter pincode"
            style={[styles.input, touched.pincode && errors.pincode && styles.inputError]}
            onBlur={() => markTouched("pincode")}
          />
          {touched.pincode && errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}

          <Text style={styles.label}>City*</Text>
          <TextInput
            value={fields.city}
            onChangeText={t => setField("city", t)}
            placeholder="Enter city"
            style={[styles.input, touched.city && errors.city && styles.inputError]}
            onBlur={() => markTouched("city")}
          />
          {touched.city && errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

          <Text style={styles.label}>State</Text>
          <Dropdown
            style={[styles.input, statesLoading && styles.inputDisabled]}
            data={states}
            labelField="state_name"
            valueField="state_id"
            placeholder={statePlaceholder}
            value={fields.stateId}
            disable={statesLoading}
            onChange={item => {
              setField("stateId", item.state_id);
              setField("stateName", item.state_name);
            }}
            renderRightIcon={() =>
              statesLoading ? <ActivityIndicator size="small" color="#7c3aed" /> : null
            }
          />
          {statesError ? (
            <TouchableOpacity onPress={retryStates}>
              <Text style={styles.retryText}>Couldn't load states. Tap to retry.</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={fields.name}
            onChangeText={t => setField("name", t)}
            placeholder="Enter name"
            style={styles.input}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={fields.phone}
            onChangeText={t => setField("phone", t.replace(/[^\d]/g, ""))}
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
              <Text style={styles.ctaText}>{submitting ? "Saving..." : submitLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default AddressDetailsSheet;

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
  inputDisabled: { opacity: 0.6 },
  inputError: { borderColor: "#ef4444" },
  errorText: { marginTop: 6, color: "#ef4444", fontSize: 11, fontWeight: "700" },
  retryText: { marginTop: 6, color: "#7c3aed", fontSize: 11, fontWeight: "700" },
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
