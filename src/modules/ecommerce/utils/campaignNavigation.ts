import { Linking } from 'react-native';
import type { CampaignPoster } from '../api/CampaignAPI';

export function openCampaignPoster(navigation: any, poster: CampaignPoster) {
  const target = poster.navigation;
  const destination = target?.destination ?? poster.redirect_type;
  const targetId = target?.targetId ?? poster.redirect_id;
  const service = poster.module === 'service';
  if (!destination) return;
  if (destination === 'external_url' || destination === 'url') {
    const url = target?.url ?? poster.redirect_url;
    if (url && /^https?:\/\//i.test(url)) Linking.openURL(url).catch(() => undefined);
    return;
  }
  if (destination === 'product_details' && targetId) {
    navigation.navigate('ProductDescription', { productId: targetId });
  } else if (destination === 'service_details' && targetId) {
    navigation.navigate('ServiceDescription', { serviceId: targetId });
  } else if (destination === 'service_bundle_details' && targetId) {
    navigation.navigate('PackScreen', { bundleId: targetId, title: poster.title });
  } else if (destination === 'category' && targetId) {
    navigation.navigate('Category', { categoryId: targetId, title: poster.title });
  } else if (destination === 'service_category' && targetId) {
    navigation.navigate('Government_Document_Screen', { categoryId: targetId });
  } else {
    navigation.navigate(service ? 'ServiceCampaign' : 'CampaignProducts', {
      campaignId: destination === 'campaign' ? targetId : poster.campaign_id,
      title: poster.title,
    });
  }
}
