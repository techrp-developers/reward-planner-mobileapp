import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  InteractionManager,
  Platform,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import CategoriesSection from '../components/home/categories_section';
import HomeSectionSkeleton from '../components/home/HomeSectionSkeleton';
import { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';

// Keep only the immediately visible categories in the cold-open
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

const INITIAL_VISIBLE_SECTIONS = new Set<SectionKey>(['categories']);
const READY_HOME_SECTIONS = new Set<SectionKey>(INITIAL_VISIBLE_SECTIONS);
const HOME_SECTION_KEYS = HOME_SECTIONS.map((section) => section.key);
const SECTION_PREFETCH_AHEAD = 3;

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

const ThemedHomeSurface = React.memo(function ThemedHomeSurface({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return <View style={[styles.container, { backgroundColor: theme.background }]}>{children}</View>;
});

function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const [readySections, setReadySections] = useState<Set<SectionKey>>(
    () => new Set(READY_HOME_SECTIONS),
  );
  const pendingReadySections = useRef<Set<SectionKey>>(new Set(READY_HOME_SECTIONS));

  const markSectionsReady = useCallback((keys: SectionKey[]) => {
    const keysToAdd = keys.filter((key) => !pendingReadySections.current.has(key));
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
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const keysToWarm = new Set<SectionKey>();

      viewableItems.forEach((entry) => {
        const key = (entry.item as HomeSection | undefined)?.key;
        if (!key) return;

        const index = HOME_SECTION_KEYS.indexOf(key);
        for (
          let offset = 0;
          offset <= SECTION_PREFETCH_AHEAD && index + offset < HOME_SECTION_KEYS.length;
          offset += 1
        ) {
          keysToWarm.add(HOME_SECTION_KEYS[index + offset]);
        }
      });

      markSectionsReady(Array.from(keysToWarm));
    }
  ).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const runWarmup = (delay: number, task: () => void) => {
      timers.push(setTimeout(() => {
        InteractionManager.runAfterInteractions(task);
      }, delay));
    };

    runWarmup(120, () => {
      const { prefetchCategoriesSection } = require('../components/home/categories_section');
      const { prefetchBestSellerSection } = require('../components/Promotion/BestSeller');
      const { prefetchTopRatedSection } = require('../components/Promotion/TopRated');

      markSectionsReady(['bestSeller', 'topRated']);
      Promise.allSettled([
        prefetchCategoriesSection(),
        prefetchBestSellerSection(),
        prefetchTopRatedSection(),
      ]).catch(() => {});
    });

    runWarmup(420, () => {
      const { prefetchOfferHomeSection } = require('../components/home/OfferHome');
      const { prefetchNewArrivalsSection } = require('../components/Promotion/NewArrivals');
      const { prefetchMostViewSection } = require('../components/Promotion/MostView');

      markSectionsReady(['offerHome', 'newArrivals', 'mostView']);
      Promise.allSettled([
        prefetchOfferHomeSection(),
        prefetchNewArrivalsSection(),
        prefetchMostViewSection(),
      ]).catch(() => {});
    });

    runWarmup(820, () => {
      const { prefetchRecommendedSection } = require('../components/Promotion/RecommendedProducts');
      const { prefetchFeaturesProductSection } = require('../components/home/featuresProduct');
      const { prefetchRecentProductSection } = require('../components/Promotion/RecentProduct');
      const { prefetchProductCategoriesSection } = require('./ProductCategoriesScreen');

      markSectionsReady(['recommended', 'features', 'recent', 'productCategory']);

      const tasks = [
        prefetchFeaturesProductSection(),
        prefetchProductCategoriesSection(),
      ];

      if (isAuthenticated && user?.user_id) {
        tasks.push(prefetchRecommendedSection(user.user_id));
        tasks.push(prefetchRecentProductSection(user.user_id));
      }

      Promise.allSettled(tasks).catch(() => {});
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isAuthenticated, markSectionsReady, user?.user_id]);

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
    <ThemedHomeSurface>
      <FlatList
        data={HOME_SECTIONS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={24}
        windowSize={9}
        removeClippedSubviews={Platform.OS === 'android'}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={ListFooterSpacer}
      />
    </ThemedHomeSurface>
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
