import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ServiceCancellation } from '../../api/OrderAPI';

type Props = {
  cancellation: ServiceCancellation;
  serviceName: string;
  onCancelPress: () => void;
};

export default function ServiceCancellationCard({
  cancellation,
  serviceName,
  onCancelPress,
}: Props) {
  if (!cancellation.can_cancel) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancelPress} activeOpacity={0.8}>
        <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
        <Text style={styles.cancelText}>Cancel {serviceName}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 12,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
});
