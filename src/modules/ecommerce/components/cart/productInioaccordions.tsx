import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type Props = {
  productDescription?: string;
  brandDescription?: string;
  variantSpecs?: Array<{ label: string; value: string }>;
};

export default function ProductInfoAccordions({
  productDescription,
  brandDescription,
  variantSpecs,
}: Props) {
  const [open, setOpen] = useState<"product" | "brand" | null>(null);

  const normalizeText = (value?: string) =>
    String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const toPoints = (value?: string, fallback?: string[]) => {
    const cleaned = normalizeText(value);
    if (!cleaned) return fallback || [];

    const parts = cleaned
      .split(/\n|\r|\.|•|\u2022|-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return parts.length ? parts : [cleaned];
  };

  const productPoints = toPoints(productDescription, ["No product information available"]);
  const brandPoints = toPoints(brandDescription, ["No brand information available"]);
  const cleanedSpecs = (variantSpecs || []).filter(
    (item) => item?.label && String(item?.value || "").trim()
  );

  const toggle = (key: "product" | "brand") => {
    setOpen(prev => (prev === key ? null : key));
  };

  return (
    <View style={styles.wrap}>
      {/* Product information */}
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardHeader}
          onPress={() => toggle("product")}
        >
          <Text style={styles.cardTitle}>Product information</Text>
          <MaterialIcons
            name={open === "product" ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={22}
            color="#666"
          />
        </TouchableOpacity>

        {open === "product" && (
          <View style={styles.cardBody}>
            {cleanedSpecs.length > 0 && (
              <View style={styles.specsWrap}>
                <Text style={styles.specsHeading}>Variant & Attributes</Text>
                {cleanedSpecs.map((spec, index) => (
                  <View key={`${spec.label}-${index}`} style={styles.specRow}>
                    <Text style={styles.specLabel}>{spec.label}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {productPoints.map((t, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.checkWrap}>
                  <MaterialIcons name="check-circle" size={16} color="#22C55E" />
                </View>
                <Text style={styles.rowText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* About Brand */}
      <View style={[styles.card, styles.brandCard]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardHeader}
          onPress={() => toggle("brand")}
        >
          <Text style={styles.cardTitle}>About Brand</Text>
          <MaterialIcons
            name={open === "brand" ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={22}
            color="#666"
          />
        </TouchableOpacity>

        {open === "brand" && (
          <View style={styles.cardBody}>
            {brandPoints.map((t, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.rowText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>      
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    marginTop: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 12,
    overflow: "hidden",
  },
  brandCard: {
    marginTop: 12,
  },

  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#222",
  },

  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  specsWrap: {
    borderWidth: 1,
    borderColor: "#ECEFF3",
    borderRadius: 10,
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 6,
  },

  specsHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },

  specRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 6,
    gap: 10,
  },

  specLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    flex: 1,
  },

  specValue: {
    fontSize: 11.5,
    color: "#111827",
    fontWeight: "700",
    flex: 1.2,
    textAlign: "right",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 8,
  },

  checkWrap: {
    paddingTop: 2,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 8,
  },

  bullet: {
    fontSize: 16,
    lineHeight: 18,
    color: "#222",
    paddingTop: 1,
  },

  rowText: {
    flex: 1,
    fontSize: 11.5,
    color: "#333",
    lineHeight: 16,
  },

  reviewsWrap: {
    marginTop: 16,
  },

  reviewsTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },

  reviewRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },

  reviewText: {
    fontSize: 11.5,
    color: "#444",
    fontWeight: "700",
  },

  ratingsCount: {
    marginTop: 6,
    fontSize: 11,
    color: "#666",
  },
});
