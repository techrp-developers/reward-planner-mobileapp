import React, { useCallback } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type RewardModalProps = {
  visible: boolean;
  coins: number;
  onClose: () => void;
};

export const RewardModal = ({ visible, coins, onClose }: RewardModalProps) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon Section with Gradient Circle */}
          <View style={styles.iconCircle}>
            <View style={styles.innerCircle}>
              <MaterialCommunityIcons
                name="gift-outline"
                size={60}
                color="#A654CD"
              />
            </View>
          </View>

          {/* Text Content */}
          <Text style={styles.title}>🎉 Welcome!</Text>
          <Text style={styles.description}>
            You earned{"\n"}
            <Text style={styles.coinText}>
              {coins.toLocaleString()} coins
            </Text>
            !{"\n"}
            <Text style={styles.subText}>Start your journey with us.</Text>
          </Text>

          {/* Gradient Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleClose}
            style={styles.buttonContainer}
          >
            <LinearGradient
              colors={["#FC8BAD", "#A654CD"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.btnText}>Great, thanks!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(132, 84, 205, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(166, 84, 205, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#852BAF",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  coinText: {
    fontWeight: "900",
    color: "#A654CD",
    fontSize: 18,
  },
  subText: {
    fontWeight: "400",
    color: "#999",
  },
  buttonContainer: {
    width: "100%",
  },
  gradientBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
