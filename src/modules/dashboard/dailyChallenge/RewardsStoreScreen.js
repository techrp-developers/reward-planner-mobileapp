// src/screens/RewardsStoreScreen.js
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { redeemReward } from '../../../services/api';

const DEFAULT_REWARDS = [
  { id: 'coffee', name: 'Coffee Voucher', emoji: '☕', cost: 120, stock: 8 },
  { id: 'hoodie', name: 'Team Hoodie', emoji: '🧥', cost: 300, stock: 3 },
  { id: 'movie', name: 'Movie Pass', emoji: '🎬', cost: 220, stock: 5 },
  { id: 'lunch', name: 'Lunch Coupon', emoji: '🍱', cost: 180, stock: 4 },
];

export default function RewardsStoreScreen({
  rewards,
  activeEmployee,
  onRedeemed,
}) {
  const displayRewards = rewards && rewards.length > 0 ? rewards : DEFAULT_REWARDS;
  const handleRedeem = reward => {
    if (reward.stock <= 0) {
      Alert.alert('Out of stock', 'This reward is currently unavailable.');
      return;
    }

    if (activeEmployee.points < reward.cost) {
      Alert.alert(
        'Not enough points',
        `You need ${reward.cost - activeEmployee.points} more points to redeem ${reward.name}.`,
      );
      return;
    }

    Alert.alert(
      'Confirm redemption',
      `Redeem ${reward.name} for ${reward.cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              await redeemReward(reward.id, activeEmployee.id);
              onRedeemed?.();
              Alert.alert('Redeemed', `${reward.name} has been added to your rewards.`);
            } catch (error) {
              Alert.alert('Redemption failed', error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Rewards Store</Text>
        <Text style={styles.subtext}>
          Available balance: <Text style={styles.balanceHighlight}>🪙 {activeEmployee.points} pts</Text>
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.storeScroll}>
        <View style={styles.grid}>
          {displayRewards.map(reward => {
            const disabled =
              reward.stock <= 0 || activeEmployee.points < reward.cost;

            return (
              <TouchableOpacity
                key={reward.id}
                activeOpacity={0.88}
                style={[styles.itemCard, disabled && styles.itemCardDisabled]}
                onPress={() => handleRedeem(reward)}
              >
                <Text style={styles.itemEmoji}>{reward.emoji}</Text>
                <Text style={styles.itemName}>{reward.name}</Text>
                <Text style={styles.itemCost}>{reward.cost} pts</Text>
                <Text style={styles.itemStock}>Stock left: {reward.stock}</Text>
                <View style={[styles.redeemPill, disabled && styles.redeemPillDisabled]}>
                  <Text style={styles.redeemPillText}>
                    {reward.stock <= 0
                      ? 'Sold out'
                      : activeEmployee.points < reward.cost
                      ? 'Earn more'
                      : 'Redeem'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  storeScroll: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
  },
  titleText: {
    fontFamily: 'Georgia',
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#e9d5ff',
    fontSize: 13,
    marginTop: 2,
  },
  balanceHighlight: {
    fontWeight: '700',
    color: '#ffffff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 12,
  },
  itemCardDisabled: {
    opacity: 0.55,
  },
  itemEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  itemName: {
    fontFamily: 'Georgia',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
  },
  itemCost: {
    color: '#e9d5ff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  itemStock: {
    color: '#e9d5ff',
    fontSize: 11,
    marginTop: 4,
  },
  redeemPill: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    alignItems: 'center',
  },
  redeemPillDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  redeemPillText: {
    color: '#1b1054',
    fontSize: 11,
    fontWeight: '800',
  },
});
