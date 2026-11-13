import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../../theme/ThemeContext";

type BenefitsRowProps = {
  is_returnable?: number | boolean;
  is_replaceable?: number | boolean;
  return_window_days?: number;
  open_box_delivery?: number | boolean;
};

export default function BenefitsRow(props: BenefitsRowProps) {
  const { theme } = useAppTheme();
  const isReturnable = Boolean(props.is_returnable);
  const isReplaceable = Boolean(props.is_replaceable);
  const isOpenBox = Number(props.open_box_delivery) === 1 || props.open_box_delivery === true;

  const returnText = isReturnable
    ? `${props.return_window_days ?? 7} Day Return`
    : "Non Returnable";

  const replacementText = isReplaceable ? "Replacement Available" : "No Replacement";

  return (
    <View>
    <View style={styles.benefitsRow}>
      <View style={styles.benefitItem}>
        <MaterialCommunityIcons
          name={isReturnable ? "refresh" : "close-circle-outline"}
          size={26}
          color={isReturnable ? "#10B981" : "#EF4444"}
        />
        <Text style={[styles.benefitText, isReturnable ? styles.textGreen : styles.textRed]}>
          {returnText}
        </Text>
      </View>

      <View style={styles.benefitItem}>
        <MaterialCommunityIcons
          name={isReplaceable ? "swap-horizontal" : "close-circle-outline"}
          size={26}
          color={isReplaceable ? "#6366F1" : "#EF4444"}
        />
        <Text style={[styles.benefitText, isReplaceable ? styles.textIndigo : styles.textRed]}>
          {replacementText}
        </Text>
      </View>

      <View style={styles.benefitItem}>
        <MaterialCommunityIcons name="flash" size={26} color="#F97316" />
        <Text style={[styles.benefitText, { color: theme.secondaryText }]}>Fast Delivery</Text>
      </View>
    </View>

    {isOpenBox ? (
      <View style={[styles.openBoxBanner, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <MaterialCommunityIcons name="package-variant" size={22} color="#2563EB" />
        <View style={styles.openBoxCopy}>
          <Text style={[styles.openBoxTitle, { color: theme.text }]}>Open Box Delivery</Text>
          <Text style={[styles.openBoxText, { color: theme.secondaryText }]}>
            Check the product in front of the delivery agent before accepting it.
          </Text>
        </View>
      </View>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  benefitsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  benefitItem: {
    width: "33.33%",
    alignItems: "center",
    gap: 6,
  },

  benefitText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
    textAlign: "center",
  },

  openBoxBanner: {
    marginTop: 14,
    marginHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  openBoxCopy: { flex: 1 },
  openBoxTitle: { fontSize: 13, fontWeight: "800" },
  openBoxText: { fontSize: 11, fontWeight: "500", marginTop: 2, lineHeight: 15 },

  textGreen:  { color: "#10B981" },
  textIndigo: { color: "#6366F1" },
  textRed:    { color: "#EF4444" },
});
