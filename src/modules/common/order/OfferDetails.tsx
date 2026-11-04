import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import { getAppliedOffer, type OfferLine } from './appliedOffer';
import { formatMoney } from '../../ecommerce/utils/formatMoney';

export default function OfferDetails({ item }: { item: OfferLine }) {
  const { theme } = useAppTheme();
  const offer = getAppliedOffer(item);
  if (!offer) return null;
  return <View style={styles.container}>
    <Text style={[styles.title, { color: theme.primary }]}>{offer.title}</Text>
    {offer.original_price != null && <Text style={[styles.detail, { color: theme.secondaryText }]}>Regular price: {formatMoney(offer.original_price)} each</Text>}
    {offer.savings > 0 && <Text style={[styles.detail, { color: theme.primary }]}>Offer savings: {formatMoney(offer.savings)}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { marginTop: 6, gap: 2 },
  title: { fontSize: 12, fontWeight: '700' },
  detail: { fontSize: 12 },
});
