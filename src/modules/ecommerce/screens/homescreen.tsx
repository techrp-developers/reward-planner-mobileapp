import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useDashboardLayout } from '../../common/cms/useDashboardLayout';
import type { EcommerceDashboardSectionKey } from '../../common/cms/dashboardLayout';
import { useNavbarScroll } from '../../../navbar/NavbarScrollContext';

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
const LazyHomeBanner = React.lazy(() =>
  Promise.resolve({ default: require('../components/home/HomeBanner').default }),
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

type SectionKey = EcommerceDashboardSectionKey;

type HomeSection = {
  key: SectionKey;
};

const ECOMMERCE_SECTION_KEYS: readonly SectionKey[] = [
  'homeBanner', 'categories', 'bestSeller', 'topRated', 'offerHome', 'newArrivals',
  'mostView', 'recommended', 'features', 'recent', 'productCategory',
];

const INITIAL_VISIBLE_SECTIONS = ['homeBanner', 'categories'] as const;
const INITIAL_VISIBLE_SECTION_SET = new Set<SectionKey>(INITIAL_VISIBLE_SECTIONS);
const SECTION_RENDER_AHEAD = 1;

const SECTION_HEIGHTS: Record<SectionKey, number> = {
  categories: 260,
  homeBanner: 180,
  bestSeller: 360,
  topRated: 360,
  offerHome: 430,
  newArrivals: 360,
  mostView: 360,
  recommended: 360,
  features: 620,
  recent: 360,
  productCategory: 720,
};

const SECTION_PREFETCHERS: Partial<Record<SectionKey, () => Promise<unknown>>> = {
  categories: () => {
    const { prefetchCategoriesSection } = require('../components/home/categories_section');
    return prefetchCategoriesSection();
  },
  homeBanner: () => {
    const { prefetchHomeBannerSection } = require('../components/home/HomeBanner');
    return prefetchHomeBannerSection();
  },
  bestSeller: () => {
    const { prefetchBestSellerSection } = require('../components/Promotion/BestSeller');
    return prefetchBestSellerSection();
  },
  topRated: () => {
    const { prefetchTopRatedSection } = require('../components/Promotion/TopRated');
    return prefetchTopRatedSection();
  },
  offerHome: () => {
    const { prefetchOfferHomeSection } = require('../components/home/OfferHome');
    return prefetchOfferHomeSection();
  },
  newArrivals: () => {
    const { prefetchNewArrivalsSection } = require('../components/Promotion/NewArrivals');
    return prefetchNewArrivalsSection();
  },
  mostView: () => {
    const { prefetchMostViewSection } = require('../components/Promotion/MostView');
    return prefetchMostViewSection();
  },
  features: () => {
    const { prefetchFeaturesProductSection } = require('../components/home/featuresProduct');
    return prefetchFeaturesProductSection();
  },
  productCategory: () => {
    const { prefetchProductCategoriesSection } = require('./ProductCategoriesScreen');
    return prefetchProductCategoriesSection();
  },
};

const buildRecommendedPrefetcher = (userId?: number | string) => {
  if (!userId) return undefined;
  return () => {
    const { prefetchRecommendedSection } = require('../components/Promotion/RecommendedProducts');
    return prefetchRecommendedSection(Number(userId));
  };
};

const buildRecentPrefetcher = (userId?: number | string) => {
  if (!userId) return undefined;
  return () => {
    const { prefetchRecentProductSection } = require('../components/Promotion/RecentProduct');
    return prefetchRecentProductSection(Number(userId));
  };
};

const MemoCategoriesSection = React.memo(CategoriesSection);

const SectionSkeleton = React.memo(function SectionSkeleton({
  sectionKey,
}: {
  sectionKey: SectionKey;
}) {
  return <HomeSectionSkeleton height={SECTION_HEIGHTS[sectionKey]} />;
});

const LazySection = React.memo(function LazySection({
  sectionKey,
  children,
}: {
  sectionKey: SectionKey;
  children: React.ReactNode;
}) {
  return (
  <React.Suspense fallback={<SectionSkeleton sectionKey={sectionKey} />}>
    {children}
  </React.Suspense>
  );
});

const HomeSectionLoader = React.memo(function HomeSectionLoader({
  sectionKey,
}: {
  sectionKey: SectionKey;
}) {
  switch (sectionKey) {
    case 'homeBanner':
      return <LazySection sectionKey={sectionKey}><LazyHomeBanner /></LazySection>;
    case 'categories':
      return <MemoCategoriesSection />;
    case 'bestSeller':
      return <LazySection sectionKey={sectionKey}><LazyBestSeller /></LazySection>;
    case 'topRated':
      return <LazySection sectionKey={sectionKey}><LazyTopRated /></LazySection>;
    case 'offerHome':
      return <LazySection sectionKey={sectionKey}><LazyOfferHome /></LazySection>;
    case 'newArrivals':
      return <LazySection sectionKey={sectionKey}><LazyNewArrivals /></LazySection>;
    case 'mostView':
      return <LazySection sectionKey={sectionKey}><LazyMostView /></LazySection>;
    case 'recommended':
      return <LazySection sectionKey={sectionKey}><LazyRecommendedProducts /></LazySection>;
    case 'features':
      return <LazySection sectionKey={sectionKey}><LazyFeaturesProduct /></LazySection>;
    case 'recent':
      return <LazySection sectionKey={sectionKey}><LazyRecentProduct /></LazySection>;
    case 'productCategory':
      return <LazySection sectionKey={sectionKey}><LazyProductCategory /></LazySection>;
    default:
      return null;
  }
});

const ViewportRenderer = React.memo(function ViewportRenderer({
  sectionKey,
  shouldRender,
}: {
  sectionKey: SectionKey;
  shouldRender: boolean;
}) {
  if (!shouldRender) {
    return <SectionSkeleton sectionKey={sectionKey} />;
  }

  return <HomeSectionLoader sectionKey={sectionKey} />;
});

const SectionContent = React.memo(({
  sectionKey,
  isReady,
}: {
  sectionKey: SectionKey;
  isReady: boolean;
}) => {
  return <ViewportRenderer sectionKey={sectionKey} shouldRender={isReady} />;
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
  const { onScroll } = useNavbarScroll();
  const layout = useDashboardLayout('ecommerce', ECOMMERCE_SECTION_KEYS);
  const homeSections = useMemo<HomeSection[]>(
    () => layout.sections.map(({ key }) => ({ key: key as SectionKey })),
    [layout.sections],
  );
  const homeSectionKeys = useMemo(() => homeSections.map(({ key }) => key), [homeSections]);
  const sectionOffsets = useMemo(() => {
    let offset = 0;
    return homeSections.reduce((result, section) => {
      result[section.key] = offset;
      offset += SECTION_HEIGHTS[section.key];
      return result;
    }, {} as Partial<Record<SectionKey, number>>);
  }, [homeSections]);
  const [readySections, setReadySections] = useState<Set<SectionKey>>(
    () => new Set(INITIAL_VISIBLE_SECTION_SET),
  );
  const pendingReadySections = useRef<Set<SectionKey>>(new Set(INITIAL_VISIBLE_SECTION_SET));
  const prefetchedSections = useRef<Set<SectionKey>>(new Set());
  const prefetchQueueRef = useRef(Promise.resolve());

  const markSectionsReady = useCallback((keys: SectionKey[]) => {
    const keysToAdd = keys.filter((key) => !pendingReadySections.current.has(key));
    if (keysToAdd.length === 0) return;

    keysToAdd.forEach((key) => {
      pendingReadySections.current.add(key);
    });

    InteractionManager.runAfterInteractions(() => {
      setReadySections((previous) => {
        const next = new Set(previous);
        keysToAdd.forEach((key) => next.add(key));
        return next;
      });
    });
  }, []);

  const userId = user?.user_id;
  const sectionPrefetchers = useMemo(() => {
    const next = {
      ...SECTION_PREFETCHERS,
    };
    const recommendedPrefetcher = buildRecommendedPrefetcher(userId);
    const recentPrefetcher = buildRecentPrefetcher(userId);

    if (recommendedPrefetcher) next.recommended = recommendedPrefetcher;
    if (recentPrefetcher) next.recent = recentPrefetcher;

    return next;
  }, [userId]);

  const enqueueSectionPrefetch = useCallback(
    (keys: SectionKey[]) => {
      const uniqueKeys = keys.filter((key) => {
        if (prefetchedSections.current.has(key)) return false;
        return Boolean(sectionPrefetchers[key]);
      });

      if (uniqueKeys.length === 0) return prefetchQueueRef.current;

      uniqueKeys.forEach((key) => prefetchedSections.current.add(key));

      prefetchQueueRef.current = uniqueKeys.reduce(
        (queue, key) =>
          queue
            .catch(() => undefined)
            .then(() => sectionPrefetchers[key]?.())
            .then(() => undefined)
            .catch(() => undefined),
        prefetchQueueRef.current,
      );

      return prefetchQueueRef.current;
    },
    [sectionPrefetchers],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const keysToRender = new Set<SectionKey>();
      const keysToPrefetch = new Set<SectionKey>();

      viewableItems.forEach((entry) => {
        const key = (entry.item as HomeSection | undefined)?.key;
        if (!key) return;

        const startIndex = homeSectionKeys.indexOf(key);
        homeSectionKeys.slice(startIndex, startIndex + SECTION_RENDER_AHEAD + 1).forEach((sectionKey) => {
          keysToRender.add(sectionKey);
          keysToPrefetch.add(sectionKey);
        });
      });

      const sectionsToRender = Array.from(keysToRender);
      enqueueSectionPrefetch(Array.from(keysToPrefetch));
      markSectionsReady(sectionsToRender);
    },
    [enqueueSectionPrefetch, homeSectionKeys, markSectionsReady],
  );

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      enqueueSectionPrefetch(['categories'])
        .catch(() => undefined)
        .then(() => {
          const phaseTwo: SectionKey[] = ['bestSeller', 'topRated'];
          enqueueSectionPrefetch(phaseTwo);
        });
    });

    return () => {
      interaction.cancel();
    };
  }, [enqueueSectionPrefetch, isAuthenticated]);

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
  const getItemLayout = useCallback(
    (_: ArrayLike<HomeSection> | null | undefined, index: number) => {
      const key = homeSections[index].key;
      return {
        length: SECTION_HEIGHTS[key],
        offset: sectionOffsets[key] ?? 0,
        index,
      };
    },
    [homeSections, sectionOffsets],
  );

  return (
    <ThemedHomeSurface>
      <FlatList
        data={homeSections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={48}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
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
