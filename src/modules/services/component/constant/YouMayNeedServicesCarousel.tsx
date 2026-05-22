import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ServiceData } from './ServiceData';
import Reward from '../../../../assets/product/rewards.svg';


const YouMayNeedServicesCarousel = () => {
    return (
        <View style={styles.wrapper}>
            <Text style={styles.heading}>You may also need</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {ServiceData.map((item) => {
                    const CardImage = item.Image;
                    const isImageAsset = typeof CardImage === 'number' || typeof CardImage === 'string';
                    const imageSource =
                        typeof CardImage === 'string'
                            ? { uri: CardImage }
                            : CardImage;

                    return (
                        <View key={item.id} style={styles.card}>
                            {/* SVG IMAGE */}
                            <View style={styles.imageWrap}>
                                {isImageAsset ? (
                                    <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
                                ) : (
                                    React.createElement(CardImage as React.ComponentType<{ width?: number; height?: number }>, {
                                        width: 160,
                                        height: 90,
                                    })
                                )}
                            </View>

                            {/* TITLE */}
                            <Text numberOfLines={1} style={styles.title}>
                                {item.title}
                            </Text>

                            {/* DESCRIPTION */}
                            <Text numberOfLines={2} style={styles.desc}>
                                {item.desc}
                            </Text>

                            {/* RATING */}
                            <View style={styles.ratingRow}>
                                <MaterialIcons name="star" size={14} color="#FACC15" />
                                <Text style={styles.ratingText}>
                                    {item.rating} ({item.reviews})
                                </Text>
                            </View>

                            {/* PRICE BUTTON */}
                            <TouchableOpacity activeOpacity={0.85} style={styles.priceBtn}>
                                {item.price ? (
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceText}>{item.price}</Text>

                                        {Boolean(item.discount) && (
                                            <View style={styles.discountRow}>
                                                <Reward width={14} height={14} />
                                                <Text style={styles.discountText}>{item.discount}</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={styles.priceText}>{item.cta}</Text>
                                )}
                            </TouchableOpacity>

                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default YouMayNeedServicesCarousel;
const styles = StyleSheet.create({
    wrapper: {
        marginTop: 16,
    },

    heading: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111111',
        marginHorizontal: 16,
        marginBottom: 12,
    },

    scroll: {
        paddingHorizontal: 16,
    },

    card: {
        width: 160,
        backgroundColor: '#FFFFFF',
        // borderRadius: 12,
        // borderWidth: 1,
        // borderColor: '#EEEEEE',
        padding: 10,
        marginRight: 2,
    },

    imageWrap: {
        width: '100%',
        height: 90,
        // borderRadius: 10,
        // backgroundColor: '#F3F4F6',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },

    title: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
        color: '#202020',
    },

    desc: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
        lineHeight: 14,
    },

    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },

    ratingText: {
        fontSize: 11,
        color: '#4B5563',
        marginLeft: 4,
    },

    priceBtn: {
        marginTop: 10,
        backgroundColor: '#7C3AED',
        borderRadius: 8,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    priceText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },

    discountText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#FFFFFF',
    },

});
