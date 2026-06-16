import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';
import { getMutualFundCategories, type MFCategory } from '../../api/MutualFundAPI';

interface Props {
    navigation: NativeStackNavigationProp<HomeStackParamList>;
}

const FAQSection: React.FC<Props> = ({ navigation }) => {
    const [categories, setCategories] = useState<MFCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMutualFundCategories()
            .then(cats => {
                const faqCats = cats.filter(c => !c.has_children);
                setCategories(faqCats);
            })
            .catch(err => {
                console.error('[FAQSection] fetch error:', err);
                setCategories([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const renderCard = ({ item }: { item: MFCategory }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
                navigation.navigate('FAQListing', {
                    categoryId: item.id.toString(),
                    categoryTitle: item.title,
                })
            }
        >
            <View style={styles.cardContent}>
                <Text style={styles.cardText} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.chevronContainer}>
                    <Text style={styles.chevron}>›</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Commonly Asked Questions</Text>

            {loading ? (
                <ActivityIndicator
                    size="small"
                    color="#8665FF"
                    style={styles.loader}
                />
            ) : (
                <FlatList
                    data={categories}
                    renderItem={renderCard}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    scrollEnabled={false}
                />
            )}
        </View>
    );
};

export default FAQSection;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        backgroundColor: '#F9FAFB',
    },

    heading: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
        letterSpacing: -0.4,
    },

    loader: {
        marginTop: 16,
    },

    row: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    card: {
        backgroundColor: '#FFFFFF',
        flex: 0.485,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(134, 101, 255, 0.12)',
        padding: 14,
        shadowColor: '#8665FF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 40,
    },

    cardText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        lineHeight: 18,
        paddingRight: 4,
    },

    chevronContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(134, 101, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    chevron: {
        fontSize: 16,
        color: '#8665FF',
        fontWeight: '700',
        marginTop: -2,
    },
});
