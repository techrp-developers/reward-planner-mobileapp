import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ViewToken,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';
import {
    getMutualFundCategories,
    type MFArticleSummary,
} from '../../api/MutualFundAPI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const INFORMED_CATEGORY_ID = 6;

type SliderArticle = MFArticleSummary & { sectionId: number; sectionTitle: string };

interface Props {
    navigation: NativeStackNavigationProp<HomeStackParamList, 'MutualFundCalculators'>;
}

const MFInformedInvestors: React.FC<Props> = ({ navigation }) => {
    const [articles, setArticles] = useState<SliderArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const flatRef = useRef<FlatList<SliderArticle>>(null);

    useEffect(() => {
        getMutualFundCategories()
            .then(cats => {
                console.log('[MFInformedInvestors] all categories:', cats.map(c => c.id + ':' + c.title));
                const target = cats.find(c => c.id === INFORMED_CATEGORY_ID);
                console.log('[MFInformedInvestors] found category id=6:', target ? target.title : 'NOT FOUND');
                if (!target) return;
                console.log('[MFInformedInvestors] children count:', target.children.length);
                const flat: SliderArticle[] = [];
                for (const child of target.children) {
                    console.log('[MFInformedInvestors] child section:', child.id, child.title, '| articles:', child.articles.length);
                    for (const article of child.articles) {
                        flat.push({ ...article, sectionId: child.id, sectionTitle: child.title });
                    }
                }
                console.log('[MFInformedInvestors] total flattened articles:', flat.length);
                setArticles(flat);
            })
            .catch(err => {
                console.error('[MFInformedInvestors] fetch error:', err);
                setArticles([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setActiveIndex(viewableItems[0].index);
            }
        },
        [],
    );

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    // const goTo = (index: number) => {
    //     flatRef.current?.scrollToIndex({ index, animated: true });
    //     setActiveIndex(index);
    // };

    const renderItem = ({ item }: { item: SliderArticle }) => (
        <View style={styles.card}>
            <View style={styles.thumbContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
                <View style={styles.thumbOverlay} />
                <View style={styles.tagRow}>
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>INFORMED INVESTING</Text>
                        <Text style={styles.tagSep}> · </Text>
                        <Text style={styles.tagSection} numberOfLines={1}>{item.sectionTitle}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
                <Text style={styles.excerpt} numberOfLines={2}>{item.short_description}</Text>
                <TouchableOpacity
                    style={styles.readMoreRow}
                    onPress={() => navigation.navigate('ArticleDetails', {
                        articleId: item.id,
                        sectionId: item.sectionId,
                    })}
                >
                    <Text style={styles.readMore}>Read More</Text>
                    <Text style={styles.readMoreArrow}> ›</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={PURPLE} />
            </View>
        );
    }

    if (articles.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>For the Informed Investor</Text>
                <Text style={styles.sectionSubtitle}>
                    Explore fund types, goal planning, and retirement strategies to
                    make smarter investment decisions.
                </Text>
            </View>

            <FlatList
                ref={flatRef}
                data={articles}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

            {/* <View style={styles.dots}>
                {articles.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.8}>
                        <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
                    </TouchableOpacity>
                ))}
            </View> */}

            <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('MFInvestorsDetail', { categoryId: INFORMED_CATEGORY_ID })}
                activeOpacity={0.8}
            >
                <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
        </View>
    );
};

export default MFInformedInvestors;

const PURPLE = '#8665FF';

const styles = StyleSheet.create({
    loaderContainer: { height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    section: { marginBottom: 24 },
    header: { paddingHorizontal: 4, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', letterSpacing: -0.3, marginBottom: 6 },
    sectionSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
    listContent: { paddingLeft: 0, paddingRight: 8 },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    thumbContainer: { height: 180, backgroundColor: '#EDE9FF', position: 'relative' },
    thumb: { width: '100%', height: '100%' },
    thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
    tagRow: { position: 'absolute', top: 12, left: 12, right: 12 },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        maxWidth: '100%',
    },
    tagText: { fontSize: 9, fontWeight: '800', color: PURPLE, letterSpacing: 0.4 },
    tagSep: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
    tagSection: { fontSize: 9, fontWeight: '600', color: '#374151', flexShrink: 1 },
    body: { padding: 14 },
    title: { fontSize: 14, fontWeight: '700', color: '#1F2937', lineHeight: 20, marginBottom: 8 },
    excerpt: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 12 },
    readMoreRow: { flexDirection: 'row', alignItems: 'center' },
    readMore: { fontSize: 13, fontWeight: '700', color: PURPLE, textDecorationLine: 'underline' },
    readMoreArrow: { fontSize: 15, color: PURPLE, fontWeight: '700' },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, gap: 6 },
    dot: { borderRadius: 4, height: 6 },
    dotActive: { width: 20, backgroundColor: PURPLE },
    dotInactive: { width: 6, backgroundColor: '#D1D5DB' },
    viewAllBtn: {
        alignSelf: 'flex-start',
        marginTop: 16,
        backgroundColor: PURPLE,
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderRadius: 8,
    },
    viewAllText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
});