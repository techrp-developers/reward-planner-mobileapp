import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/type';
import { ServiceCampaignItems } from '../home/ServiceCampaigns';
import { useAppTheme } from '../../../../theme/ThemeContext';
import ScreenHeader from '../constant/navbar/ScreenHeaderColor';

export default function ServiceCampaignScreen() {
  const { params } = useRoute<RouteProp<HomeStackParamList, 'ServiceCampaign'>>();
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  return <View style={[styles.screen, { backgroundColor: theme.background }]}>
    <ServiceCampaignItems {...params} renderHeader={controls => (
      <ScreenHeader title={params.title || 'Service offers'} onBackPress={() => navigation.goBack()} compact>
        {controls}
      </ScreenHeader>
    )} />
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
