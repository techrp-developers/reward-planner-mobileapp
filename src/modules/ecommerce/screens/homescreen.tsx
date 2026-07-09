import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  InteractionManager,
  Platform,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import CategoriesSection from '../components/home/categories_section';
import HomeBanner from '../components/home/HomeBanner';
import HomeSectionSkeleton from '../components/home/HomeSectionSkeleton';
import { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';

// Keep only the immediately visible banner and categories in the cold-open
// bundle. Every lower section is evaluated only when FlatList reaches it.
const LazyBestSeller = React.lazy(() =>
  Promise.resolve({ default: require('../components/Promotion/BestSeller').default }),
);
const LazyTopRated = React.lazy(() =>
  Promise.resolve({ default: require('../components/Promotion/TopRated').default }),
);
const LazyOfferHome = React.lazy(() =>
  Promise.resolve({ default: require('../components/home/OfferHome').default }),
);
const LazyNewArrivals = React.lazy(() =>
  Promise.resolve({ default: require('../components/Promotion/NewArrivals').default }),
);
const LazyMostView = React.lazy(() =>
  Promise.resolve({ default: require('../components/Promotion/MostView').default }),
);
const LazyRecommendedProducts = React.lazy(() =>
  Promise.resolve({ default: require('../components/Promotion/RecommendedProducts').default }),
);
const LazyFeaturesProduct = React.lazy(() =>
  Promise.resolve({ default: require('../components/home/featuresProduct').default }),
);
const LazyRecentProduct = React.lazy(() =>
  Promise.resolve({ default: require('../components/Promotion/RecentProduct').default }),
);
const LazyProductCategory = React.lazy(() =>
  Promise.resolve({ default: require('./ProductCategoriesScreen').default }),
);

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

const INITIAL_VISIBLE_SECTIONS = new Set<SectionKey>(['banner', 'categories']);
const READY_HOME_SECTIONS = new Set<SectionKey>(INITIAL_VISIBLE_SECTIONS);

const MemoHomeBanner = React.memo(HomeBanner);
const MemoCategoriesSection = React.memo(CategoriesSection);

const LazySection = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<HomeSectionSkeleton height={320} />}>
    {children}
  </React.Suspense>
);

const SectionContent = React.memo(({
  sectionKey,
  isReady,
}: {
  sectionKey: SectionKey;
  isReady: boolean;
}) => {
  if (!isReady) {
    return <HomeSectionSkeleton height={320} />;
  }

  switch (sectionKey) {
    case 'banner':
      return <MemoHomeBanner />;
    case 'categories':
      return <MemoCategoriesSection />;
    case 'bestSeller':
      return <LazySection><LazyBestSeller /></LazySection>;
    case 'topRated':
      return <LazySection><LazyTopRated /></LazySection>;
    case 'offerHome':
      return <LazySection><LazyOfferHome /></LazySection>;
    case 'newArrivals':
      return <LazySection><LazyNewArrivals /></LazySection>;
    case 'mostView':
      return <LazySection><LazyMostView /></LazySection>;
    case 'recommended':
      return <LazySection><LazyRecommendedProducts /></LazySection>;
    case 'features':
      return <LazySection><LazyFeaturesProduct /></LazySection>;
    case 'recent':
      return <LazySection><LazyRecentProduct /></LazySection>;
    case 'productCategory':
      return <LazySection><LazyProductCategory /></LazySection>;
    default:
      return null;
  }
});

SectionContent.displayName = 'SectionContent';

const ListFooterSpacer = React.memo(() => <View style={styles.footerSpacer} />);

ListFooterSpacer.displayName = 'HomeListFooterSpacer';

function HomeScreen() {
  const [readySections, setReadySections] = useState<Set<SectionKey>>(
    () => new Set(READY_HOME_SECTIONS),
  );
  const pendingReadySections = useRef<Set<SectionKey>>(new Set(READY_HOME_SECTIONS));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const nextKeys = viewableItems
        .map((entry) => (entry.item as HomeSection | undefined)?.key)
        .filter((key): key is SectionKey => Boolean(key));

      const keysToAdd = nextKeys.filter((key) => !pendingReadySections.current.has(key));
      if (keysToAdd.length === 0) return;

      keysToAdd.forEach((key) => {
        pendingReadySections.current.add(key);
        READY_HOME_SECTIONS.add(key);
      });

      InteractionManager.runAfterInteractions(() => {
        setReadySections((previous) => {
          const next = new Set(previous);
          keysToAdd.forEach((key) => next.add(key));
          return next;
        });
      });
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 8,
    minimumViewTime: 80,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: HomeSection }) => (
      <SectionContent
        sectionKey={item.key}
        isReady={readySections.has(item.key)}
      />
    ),
    [readySections]
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
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={32}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
