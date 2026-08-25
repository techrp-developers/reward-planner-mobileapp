import React from "react";
import { View } from "react-native";
import PromotionalBanner from "./PromotionalBanner";
import OffersBanner from "./OffersBanner";

// Single ListHeaderComponent slot for the Product home FlatList — both CMS
// banners are always-visible (not part of the lazy virtualized section
// list), so they're composed here rather than adding new section keys.
function HomeHeaderBanners() {
  return (
    <View>
      <PromotionalBanner />
      <OffersBanner />
    </View>
  );
}

export default React.memo(HomeHeaderBanners);
