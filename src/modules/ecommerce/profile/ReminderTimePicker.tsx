import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const PRIMARY = "#4F46E5";

type Meridiem = "AM" | "PM";
type Field = "hour" | "minute" | "meridiem";

type ReminderParts = { hour: string; minute: string; meridiem: Meridiem };

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const MERIDIEMS: Meridiem[] = ["AM", "PM"];

/** Accepts "10:30 AM", "10:30:00 PM" or 24h "22:30"; falls back to the next 5 minutes. */
export const parseReminderParts = (value?: string | null): ReminderParts => {
  const match = String(value || "")
    .trim()
    .replace(/[  ]/g, " ")
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?$/i);

  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    let meridiem = match[3]?.toUpperCase() as Meridiem | undefined;

    if (!meridiem) {
      meridiem = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
    }

    if (hour >= 1 && hour <= 12 && minute <= 59) {
      return { hour: String(hour), minute: String(minute).padStart(2, "0"), meridiem };
    }
  }

  const soon = new Date(Date.now() + 5 * 60 * 1000);
  const hours24 = soon.getHours();
  return {
    hour: String(hours24 % 12 || 12),
    minute: String(soon.getMinutes()).padStart(2, "0"),
    meridiem: hours24 >= 12 ? "PM" : "AM",
  };
};

export const formatReminderParts = ({ hour, minute, meridiem }: ReminderParts) =>
  `${hour}:${minute} ${meridiem}`;

type Props = {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  textColor: string;
};

const ReminderTimePicker = ({ value, onChange, isDark, textColor }: Props) => {
  const [openField, setOpenField] = useState<Field | null>(null);
  const parts = useMemo(() => parseReminderParts(value), [value]);

  const colors = {
    box: isDark ? "#111827" : "#F8FAFC",
    border: isDark ? "#374151" : "#E5E7EB",
    list: isDark ? "#1F2937" : "#FFFFFF",
    selectedBg: isDark ? "#312E81" : "#EEF2FF",
    label: isDark ? "#9CA3AF" : "#777777",
  };

  const select = (field: Field, option: string) => {
    onChange(formatReminderParts({ ...parts, [field]: option }));
    setOpenField(null);
  };

  const renderDropdown = (field: Field, label: string, options: string[]) => {
    const isOpen = openField === field;
    const current = parts[field];

    return (
      <View style={styles.column}>
        <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.trigger,
            { backgroundColor: colors.box, borderColor: isOpen ? PRIMARY : colors.border },
          ]}
          onPress={() => setOpenField(isOpen ? null : field)}
        >
          <Text style={[styles.triggerText, { color: textColor }]}>{current}</Text>
          <MaterialCommunityIcons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.label}
          />
        </TouchableOpacity>

        {isOpen && (
          <ScrollView
            style={[styles.list, { backgroundColor: colors.list, borderColor: colors.border }]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {options.map(option => {
              const selected = option === current;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, selected && { backgroundColor: colors.selectedBg }]}
                  onPress={() => select(field, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? PRIMARY : textColor },
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View>
      <View style={styles.row}>
        {renderDropdown("hour", "Hour", HOURS)}
        {renderDropdown("minute", "Minute", MINUTES)}
        {renderDropdown("meridiem", "AM / PM", MERIDIEMS)}
      </View>
      <Text style={[styles.preview, { color: colors.label }]}>
        Alarm at <Text style={{ color: textColor, fontWeight: "700" }}>{formatReminderParts(parts)}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  trigger: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerText: {
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    maxHeight: 180,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  option: {
    paddingVertical: 10,
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
  },
  optionTextSelected: {
    fontWeight: "700",
  },
  preview: {
    marginTop: 14,
    fontSize: 13,
  },
});

export default ReminderTimePicker;
