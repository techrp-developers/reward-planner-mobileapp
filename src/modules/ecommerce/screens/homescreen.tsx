import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import CategoriesSection from '../components/home/categories_section';
import FeaturesProduct from '../components/home/featuresProduct';
import ProductCategory from './ProductCategoriesScreen';
import HomeBanner from '../components/home/HomeBanner';
import OfferHome from '../components/home/OfferHome';
import { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import RecentProduct from '../components/Promotion/RecentProduct';
import NewArrivals from '../components/Promotion/NewArrivals';
import BestSeller from '../components/Promotion/BestSeller';
import TopRated from '../components/Promotion/TopRated';
import RecommendedProducts from '../components/Promotion/RecommendedProducts';
import MostView from '../components/Promotion/MostView';

type SectionKey =
  | 'banner'
  | 'categories'
  | 'bestSeller'
  | 'topRated'
  | 'offerHome'
  | 'newArrivals'
  | 'mostView'
  | 'recommended'
  | 'features'
  | 'recent'
  | 'productCategory';

type HomeSection = {
  key: SectionKey;
};

const HOME_SECTIONS: HomeSection[] = [
  { key: 'banner' },
  { key: 'categories' },
  { key: 'bestSeller' },
  { key: 'topRated' },
  { key: 'offerHome' },
  { key: 'newArrivals' },
  { key: 'mostView' },
  { key: 'recommended' },
  { key: 'features' },
  { key: 'recent' },
  { key: 'productCategory' },
];

const MemoHomeBanner = React.memo(HomeBanner);
const MemoCategoriesSection = React.memo(CategoriesSection);
const MemoBestSeller = React.memo(BestSeller);
const MemoTopRated = React.memo(TopRated);
const MemoOfferHome = React.memo(OfferHome);
const MemoNewArrivals = React.memo(NewArrivals);
const MemoMostView = React.memo(MostView);
const MemoRecommendedProducts = React.memo(RecommendedProducts);
const MemoFeaturesProduct = React.memo(FeaturesProduct);
const MemoRecentProduct = React.memo(RecentProduct);
const MemoProductCategory = React.memo(ProductCategory);

const SectionContent = React.memo(({ sectionKey }: { sectionKey: SectionKey }) => {
  switch (sectionKey) {
    case 'banner':
      return <MemoHomeBanner />;
    case 'categories':
      return <MemoCategoriesSection />;
    case 'bestSeller':
      return <MemoBestSeller />;
    case 'topRated':
      return <MemoTopRated />;
    case 'offerHome':
      return <MemoOfferHome />;
    case 'newArrivals':
      return <MemoNewArrivals />;
    case 'mostView':
      return <MemoMostView />;
    case 'recommended':
      return <MemoRecommendedProducts />;
    case 'features':
      return <MemoFeaturesProduct />;
    case 'recent':
      return <MemoRecentProduct />;
    case 'productCategory':
      return <MemoProductCategory />;
    default:
      return null;
  }
});

SectionContent.displayName = 'SectionContent';

const ListFooterSpacer = React.memo(() => <View style={styles.footerSpacer} />);

ListFooterSpacer.displayName = 'HomeListFooterSpacer';

function HomeScreen() {
  const renderItem = useCallback(
    ({ item }: { item: HomeSection }) => <SectionContent sectionKey={item.key} />,
    []
  );
  const keyExtractor = useCallback((item: HomeSection) => item.key, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={HOME_SECTIONS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={HOME_SECTIONS.length}
        maxToRenderPerBatch={HOME_SECTIONS.length}
        updateCellsBatchingPeriod={16}
        windowSize={HOME_SECTIONS.length}
        removeClippedSubviews={false}
        ListFooterComponent={ListFooterSpacer}
      />
    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 0,
  },
  footerSpacer: {
    height: TAB_BAR_HEIGHT + 16,
  },
});
