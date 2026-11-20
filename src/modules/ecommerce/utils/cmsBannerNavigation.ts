import { CommonActions, type NavigationProp, type NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CmsContentTarget, CmsModuleKey, CmsOfferImage, CmsZoneEntry } from '../../common/cms/cmsContentApi';
import type { HomeStackParamList as ServiceHomeStackParamList } from '../../services/navigation/type';
import type { HomeStackParamList } from '../navigation/types';

type ProductPromotionRoutes = Pick<HomeStackParamList, 'CampaignProducts'>;
type ServicePromotionRoutes = Pick<
  ServiceHomeStackParamList,
  'ServiceCampaign' | 'ServiceDescription' | 'Government_Document_Screen' | 'PackScreen'
>;
type PromotionRoutes = {
  Home: NavigatorScreenParams<{
    ProductModule: NavigatorScreenParams<ProductPromotionRoutes>;
    ServicesModule: NavigatorScreenParams<ServicePromotionRoutes>;
  }>;
};
export type CmsPromotionNavigation = NavigationProp<PromotionRoutes>;

function getProductPromotion(banner: CmsZoneEntry, image?: CmsOfferImage): HomeStackParamList['CampaignProducts'] | undefined {
  const targetType = image?.target_type || banner.target_type;
  if (targetType !== 'product' && targetType !== 'category' && targetType !== 'subcategory') return;
  return {
    contentId: banner.content_id,
    imageId: image?.image_id ?? undefined,
    title: banner.title || 'Promotional Products',
  };
}

export function getCmsProductBannerPress(
  navigation: NativeStackNavigationProp<HomeStackParamList>,
  banner: CmsZoneEntry,
  image?: CmsOfferImage,
) {
  const params = getProductPromotion(banner, image);
  return params ? () => navigation.navigate('CampaignProducts', params) : undefined;
}

function getTargetIds(target: CmsContentTarget): number[] {
  let values = target.target_ids;
  if (typeof values === 'string') {
    try {
      values = JSON.parse(values);
    } catch {
      values = null;
    }
  }
  const ids = Array.isArray(values)
    ? Array.from(new Set(values.map(Number).filter(id => Number.isInteger(id) && id > 0)))
    : [];
  const id = Number(target.target_id);
  return ids.length || !Number.isInteger(id) || id <= 0 ? ids : [id];
}

export function getCmsPromotionPress(
  navigation: CmsPromotionNavigation,
  module: CmsModuleKey,
  banner: CmsZoneEntry,
  image?: CmsOfferImage,
): (() => void) | undefined {
  if (module === 'mobile_dashboard') {
    const params = getProductPromotion(banner, image);
    if (params) return () => navigation.navigate('Home', {
      screen: 'ProductModule', params: { screen: 'CampaignProducts', params },
    });
  }
  if (module !== 'service' && module !== 'mobile_dashboard') return;

  const target = image?.target_type ? image : banner;
  const ids = getTargetIds(target);
  if (!ids.length) return;
  const [id] = ids;
  const title = banner.title || undefined;
  let destination: NavigatorScreenParams<ServicePromotionRoutes>;
  switch (target.target_type) {
    case 'service':
      destination = ids.length === 1
        ? { screen: 'ServiceDescription', params: { serviceId: id } }
        : { screen: 'ServiceCampaign', params: { contentId: banner.content_id, imageId: image?.image_id ?? undefined, title } };
      break;
    case 'service_category':
      destination = { screen: 'Government_Document_Screen', params: { categoryId: id } };
      break;
    case 'service_bundle':
      destination = { screen: 'PackScreen', params: { bundleId: id, title } };
      break;
    default:
      return;
  }
  if (module === 'mobile_dashboard') {
    return () => navigation.navigate('Home', { screen: 'ServicesModule', params: destination });
  }
  return () => navigation.dispatch(CommonActions.navigate(destination.screen, destination.params));
}
