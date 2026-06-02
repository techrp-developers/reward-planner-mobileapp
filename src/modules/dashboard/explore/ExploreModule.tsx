import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, fs } from '../../../utils/responsive';
type TopTab = 'Product' | 'Services' | 'Payments' | 'DineOut';

const Explore1 = require('../../../assets/sampleImages/ExploreSevice(1).png');
const Explore2 = require('../../../assets/sampleImages/ExploreSevice(2).png');
const Explore3 = require('../../../assets/sampleImages/ExploreSevice(3).png');
const Explore4 = require('../../../assets/sampleImages/ExploreSevice(4).png');
const Explore5 = require('../../../assets/sampleImages/ExploreSevice(5).png');
const Explore6 = require('../../../assets/sampleImages/ExploreSevice(6).png');
const Explore7 = require('../../../assets/sampleImages/ExploreSevice(7).png');
const Explore8 = require('../../../assets/sampleImages/ExploreSevice(8).png');

type CategoryItem = {
  image: ReturnType<typeof require>;
  tab: TopTab;
};

const exploreServices : CategoryItem[] = [
  { image: Explore1, tab: 'Product' },
  { image: Explore2, tab: 'Services' },
  { image: Explore3, tab: 'Payments' },
  { image: Explore4, tab: 'Product' },
  { image: Explore5, tab: 'Product' },
  { image: Explore6, tab: 'Product' },
  { image: Explore7, tab: 'DineOut' },
  { image: Explore8, tab: 'Product' },
];

const TAB_TO_MODULE: Record<TopTab, { screen: string; moduleName: TopTab }> = {
  Product: { screen: 'ProductModule', moduleName: 'Product' },
  Services: { screen: 'ServicesModule', moduleName: 'Services' },
  Payments: { screen: 'PaymentsModule', moduleName: 'Payments' },
  DineOut: { screen: 'DineOutModule', moduleName: 'DineOut' },
};

function ExploreModule() {
    const { width } = useWindowDimensions();
    const navigation = useNavigation();

    // Full-width card minus horizontal padding; height scales with width
    const CARD_WIDTH = width - rs(32);
    const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.4);

    const handleCategoryPress = useCallback(
        (tab: TopTab) => {
          const target = TAB_TO_MODULE[tab];
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Home',
              params: {
                screen: target.screen,
                params: { moduleName: target.moduleName },
                moduleName: target.moduleName,
              },
            })
          );
        },
        [navigation],
      );
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.backArrow}>{'‹'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Explore Services</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {exploreServices.map((item, i) => (
                    <TouchableOpacity
                        key={i}
                        activeOpacity={0.9}
                        style={[
                            styles.exploreItem,
                            {
                                width: CARD_WIDTH,
                                height: CARD_HEIGHT,
                            },
                        ]}
                        onPress={() => handleCategoryPress(item.tab)}
                    >
                        <Image
                            source={item.image}
                            style={styles.exploreImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

export default ExploreModule;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: rs(16),
        paddingVertical: rs(12),
        backgroundColor: '#F5F6FA',
    },
    backBtn: {
        width: rs(36),
        height: rs(36),
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: fs(32),
        color: '#1A1A2E',
        lineHeight: rs(36),
        fontWeight: '300',
    },
    headerTitle: {
        fontSize: fs(18),
        fontWeight: '700',
        color: '#1A1A2E',
        letterSpacing: 0.2,
    },

    // List
    container: {
        paddingHorizontal: rs(16),
        paddingTop: rs(8),
        paddingBottom: rs(32),
        alignItems: 'center',
        gap: rs(14),
    },

    exploreItem: {
        borderRadius: rs(16),
        overflow: 'hidden',
        backgroundColor: '#E8E8E8',
    },

    exploreImage: {
        width: '100%',
        height: '100%',
    },
});
