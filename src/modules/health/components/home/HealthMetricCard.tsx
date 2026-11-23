import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { HealthMetric } from "../../types";

const TONE_STYLES = {
  mint: {
    chip: "#CCFBF1",
    text: "#0F766E",
  },
  rose: {
    chip: "#FFE4E6",
    text: "#BE123C",
  },
  sky: {
    chip: "#E0F2FE",
    text: "#0369A1",
  },
} as const;

type Props = {
  metric: HealthMetric;
};

export default function HealthMetricCard({ metric }: Props) {
  const tone = TONE_STYLES[metric.tone];

  return (
    <View style={styles.card}>
      <View style={[styles.chip, { backgroundColor: tone.chip }]}>
        <Text style={[styles.chipText, { color: tone.text }]}>{metric.label}</Text>
      </View>
      <Text style={styles.value}>{metric.value}</Text>
      <Text style={styles.helper}>{metric.helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 188,
    marginRight: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  helper: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
});
