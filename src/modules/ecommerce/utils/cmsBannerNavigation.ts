import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CmsOfferImage, CmsZoneEntry } from '../../common/cms/cmsContentApi';
import type { HomeStackParamList } from '../navigation/types';

export function getCmsProductBannerPress(
  navigation: NativeStackNavigationProp<HomeStackParamList>,
  banner: CmsZoneEntry,
  image?: CmsOfferImage,
) {
  const targetType = image?.target_type || banner.target_type;
  if (targetType !== 'product' && targetType !== 'category' && targetType !== 'subcategory') {
    return undefined;
  }

  return () => navigation.navigate('CampaignProducts', {
    contentId: banner.content_id,
    imageId: image?.image_id ?? undefined,
    title: banner.title || 'Promotional Products',
  });
}
