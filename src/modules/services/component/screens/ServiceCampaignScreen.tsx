import React from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/type';
import { ServiceCampaignItems } from '../home/ServiceCampaigns';
import { useAppTheme } from '../../../../theme/ThemeContext';
import ScreenHeader from '../constant/navbar/ScreenHeaderColor';

export default function ServiceCampaignScreen() {
  const { params } = useRoute<RouteProp<HomeStackParamList, 'ServiceCampaign'>>();
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background }}>
    <ScreenHeader title={params.title || 'Service offers'} onBackPress={() => navigation.goBack()} />
    <ServiceCampaignItems campaignId={params.campaignId} />
  </View>;
}
