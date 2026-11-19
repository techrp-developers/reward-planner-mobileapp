import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import type { CmsOfferImage, CmsZoneEntry } from '../../../common/cms/cmsContentApi';
import { getCmsProductBannerPress } from '../../utils/cmsBannerNavigation';
import PromotionalBanner, { prefetchPromotionalBanner } from './PromotionalBanner';

export const prefetchHomeBannerSection = prefetchPromotionalBanner;

export default function HomeBanner() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const getPressAction = React.useCallback(
    (banner: CmsZoneEntry, image?: CmsOfferImage) => getCmsProductBannerPress(navigation, banner, image),
    [navigation],
  );

  return (
    <>
      <PromotionalBanner getPressAction={getPressAction} />
      <PromotionalBanner zone="brand_promotional_banner" getPressAction={getPressAction} />
    </>
  );
}
