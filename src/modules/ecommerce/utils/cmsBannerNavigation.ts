import { CommonActions, type NavigationProp, type NavigatorScreenParams } from '@react-navigation/native';
import { Linking } from 'react-native';
import type { CmsContentTarget, CmsModuleKey, CmsOfferImage, CmsZoneEntry } from '../../common/cms/cmsContentApi';
import type { HomeStackParamList as ServiceHomeStackParamList } from '../../services/navigation/type';
import type { HomeStackParamList } from '../navigation/types';

type ProductPromotionRoutes = Pick<HomeStackParamList, 'CampaignProducts'>;
type ServicePromotionRoutes = Pick<
  ServiceHomeStackParamList,
  'ServiceCampaign' | 'PackScreen'
>;
type PromotionRoutes = ProductPromotionRoutes & {
  Home: NavigatorScreenParams<{
    ProductModule: NavigatorScreenParams<ProductPromotionRoutes>;
    ServicesModule: NavigatorScreenParams<ServicePromotionRoutes>;
  }>;
};
export type CmsPromotionNavigation = NavigationProp<PromotionRoutes, keyof PromotionRoutes, string>;

function getProductPromotion(banner: CmsZoneEntry, image?: CmsOfferImage): HomeStackParamList['CampaignProducts'] | undefined {
  const targetType = image?.target_type || banner.target_type;
  if (targetType !== 'product' && targetType !== 'category' && targetType !== 'subcategory') return;
  return {
    contentId: banner.content_id,
    imageId: image?.image_id ?? undefined,
    title: banner.title || 'Promotional Products',
  };
}

const positiveId = (value: unknown) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

function openProductPromotion(
  navigation: CmsPromotionNavigation,
  module: CmsModuleKey,
  params: ProductPromotionRoutes['CampaignProducts'],
) {
  if (module === 'product') {
    navigation.navigate('CampaignProducts', params);
    return;
  }
  (navigation.getParent<CmsPromotionNavigation>('AppStack') ?? navigation).navigate('Home', {
    screen: 'ProductModule', params: { screen: 'CampaignProducts', params },
  });
}

function openServicePromotion(
  navigation: CmsPromotionNavigation,
  module: CmsModuleKey,
  destination: NavigatorScreenParams<ServicePromotionRoutes>,
) {
  if (module === 'service' && destination.screen) {
    navigation.dispatch(CommonActions.navigate(destination.screen, destination.params));
    return;
  }
  (navigation.getParent<CmsPromotionNavigation>('AppStack') ?? navigation).navigate('Home', {
    screen: 'ServicesModule', params: destination,
  });
}

function getBannerLinkPress(navigation: CmsPromotionNavigation, module: CmsModuleKey, banner: CmsZoneEntry) {
  const link = banner.redirect_link?.trim();
  if (!link) return;
  const openLink = () => { Linking.openURL(link).catch(() => undefined); };
  const appPrefix = /^reward(?:planners|app):\/\//i;
  if (!appPrefix.test(link)) return openLink;

  const [path, query = ''] = link.replace(appPrefix, '').split('#', 1)[0].split('?');
  const match = /^(?:\/?)(offers\/products|offers\/services|campaign-products|campaignproducts|service-campaign|servicecampaign)(?:\/(\d+))?\/?$/i.exec(path);
  if (!match) return openLink;
  try {
    const search = new URLSearchParams(query);
    const contentId = positiveId(match[2] ?? search.get('contentId'));
    const campaignId = contentId ? undefined : positiveId(search.get('campaignId'));
    const title = banner.title || undefined;
    let params: ServicePromotionRoutes['ServiceCampaign'];
    if (contentId) {
      params = { contentId, imageId: positiveId(search.get('imageId')), title };
    } else if (campaignId) {
      params = { campaignId, title };
    } else {
      return;
    }
    if (/^(offers\/services|service)/i.test(match[1])) {
      return () => openServicePromotion(navigation, module, { screen: 'ServiceCampaign', params });
    }
    return () => openProductPromotion(navigation, module, { ...params, title: title || 'Promotional Products' });
  } catch {
    return undefined;
  }
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
  const params = getProductPromotion(banner, image);
  if (params) return () => openProductPromotion(navigation, module, params);

  const target = image?.target_type ? image : banner;
  if (target.target_type !== 'service' && target.target_type !== 'service_category' && target.target_type !== 'service_bundle') {
    return getBannerLinkPress(navigation, module, banner);
  }
  const ids = getTargetIds(target);
  if (!ids.length) return getBannerLinkPress(navigation, module, banner);
  const [id] = ids;
  const title = banner.title || undefined;
  const destination: NavigatorScreenParams<ServicePromotionRoutes> = target.target_type === 'service_bundle'
    ? { screen: 'PackScreen', params: { bundleId: id, title } }
    : { screen: 'ServiceCampaign', params: { contentId: banner.content_id, imageId: image?.image_id ?? undefined, title } };
  return () => openServicePromotion(navigation, module, destination);
}
