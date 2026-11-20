import React from 'react';
import PromotionalBanner, { prefetchPromotionalBanner } from './PromotionalBanner';

export const prefetchHomeBannerSection = prefetchPromotionalBanner;

export default function HomeBanner() {
  return (
    <>
      <PromotionalBanner />
      <PromotionalBanner zone="brand_promotional_banner" />
    </>
  );
}
