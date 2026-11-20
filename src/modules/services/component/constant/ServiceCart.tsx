import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SelectableServiceCard from '../government/SelectableServiceCard';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { useServicesTheme } from '../../utils/useServicesTheme';

type VariantItem = {
    id: string;
    title: string;
    planTitle?: string;
    price: string;
    oldPrice?: string;
    subtitle?: string;
    rawVariant?: any;
};

const DEFAULT_VARIANTS: VariantItem[] = [];
const ImageHeader = require('../../assete/service/FolderService.png');



type ServiceCartProps = {
    headerImageUrl?: string;
    mainTitle?: string;
    subText?: string;
    rating?: number;
    variants?: VariantItem[];
    onVariantChange?: (variant: VariantItem) => void;
    showVariantSelector?: boolean;
    primaryButtonText?: string;
    onPrimaryPress?: () => void;
    onAddToCart?: () => void;
    showAddToCart?: boolean;
};

export default function ServiceCart({
    headerImageUrl,
    mainTitle,
    subText,
    rating = 0,
    variants,
    onVariantChange,
    showVariantSelector = true,
    primaryButtonText: primaryButtonTextProp,
    onPrimaryPress,
    onAddToCart,
    showAddToCart = true,
}: ServiceCartProps) {
    const servicesTheme = useServicesTheme();
    const services = useMemo(() => {
        if (Array.isArray(variants)) {
            return variants;
        }
        return DEFAULT_VARIANTS;
    }, [variants]);

    const [selectedId, setSelectedId] = useState(services[0]?.id || '');

    useEffect(() => {
        if (services.length === 0 && selectedId !== '') {
            setSelectedId('');
            return;
        }
        if (services.length > 0 && !services.some((item) => item.id === selectedId)) {
            setSelectedId(services[0].id);
        }
    }, [services, selectedId]);

    const selectedService = services.find(
        item => item.id === selectedId
    ) || services[0];

    useEffect(() => {
        if (selectedService && onVariantChange) {
            onVariantChange(selectedService);
        }
    }, [selectedService, onVariantChange]);

    const headerImageSource = headerImageUrl
        ? { uri: getServiceImageUrl(headerImageUrl, 'large') }
        : ImageHeader;

    const parsedRating = Number(rating);
    const numericRating = Number.isFinite(parsedRating)
        ? Math.min(5, Math.max(0, parsedRating))
        : 0;

    const primaryButtonText = primaryButtonTextProp ?? (() => {
        const rawPrice = selectedService?.price;
        if (!rawPrice) return 'Get Started';

        // Extract digits to handle values like "₹0", "0", or " 0 " consistently.
        const numericPart = Number(String(rawPrice).replace(/[^0-9.]/g, ''));
        if (!Number.isFinite(numericPart) || numericPart <= 0) return 'Get Started';

        return `${rawPrice} + Get Start`;
    })();
    const isEnquiryService = primaryButtonText.trim().toLowerCase() === 'enquire now';
    const currentPrice = Number(String(selectedService?.price ?? '').replace(/[^0-9.]/g, '')) || 0;
    const originalPrice = Number(String(selectedService?.oldPrice ?? '').replace(/[^0-9.]/g, '')) || 0;
    const savings = Math.max(0, originalPrice - currentPrice);

    return (
        <ScrollView style={[styles.mainContainer, { backgroundColor: servicesTheme.colors.background }]}>
            <View style={styles.imageContainer}>
                <Image
                    source={headerImageSource}
                    style={styles.mainImg}
                    resizeMode="cover"
                />

            </View>

            <View style={[styles.contentPadding, { backgroundColor: servicesTheme.colors.background }]}>
                {/* 2. Horizontal Service Selector */}
                {showVariantSelector && services.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.container}
                    >
                        {services.map(item => (
                            <SelectableServiceCard
                                key={item.id}
                                {...item}
                                selected={item.id === selectedId}
                                onPress={() => setSelectedId(item.id)}
                            />
                        ))}
                    </ScrollView>
                )}

                {/* 3. Description Section */}
                <View style={styles.descriptionHeader}>
                    <Text style={[styles.mainTitle, { color: servicesTheme.colors.textStrong }]}>
                        {mainTitle || selectedService?.title}
                    </Text>

                    {isEnquiryService && currentPrice > 0 ? (
                        <View style={styles.enquiryPricing}>
                            <View style={styles.enquiryPriceRow}>
                                <Text style={[styles.enquiryPrice, { color: servicesTheme.colors.textStrong }]}>
                                    {'\u20B9'}{currentPrice.toLocaleString('en-IN')}
                                </Text>
                                {originalPrice > currentPrice && (
                                    <Text style={[styles.enquiryMrp, { color: servicesTheme.colors.subtle }]}>
                                        {'\u20B9'}{originalPrice.toLocaleString('en-IN')}
                                    </Text>
                                )}
                            </View>
                            {savings > 0 && (
                                <Text style={[styles.enquirySavings, { color: servicesTheme.colors.muted }]}>
                                    Save <Text style={{ color: servicesTheme.colors.textStrong }}>{'\u20B9'}{savings.toLocaleString('en-IN')}</Text>
                                </Text>
                            )}
                        </View>
                    ) : (
                      <View style={styles.ratingRow}>
                        <Text style={[styles.ratingText, { color: servicesTheme.colors.textStrong }]}>{numericRating.toFixed(1)}</Text>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const iconName = numericRating >= star
                                ? 'star'
                                : numericRating >= star - 0.5
                                    ? 'star-half-full'
                                    : 'star-outline';

                            return (
                                <MaterialCommunityIcons
                                    key={star}
                                    name={iconName}
                                    size={16}
                                    color="#FBBF24"
                                />
                            );
                        })}
                      </View>
                    )}
                </View>

                <Text style={[styles.subText, { color: servicesTheme.colors.muted }]}>
                    {selectedService?.subtitle || subText || 'Complete assistance from application to delivery for your document needs.'}
                </Text>

                {/* 5. Action Buttons */}
                {!isEnquiryService && (
                    <TouchableOpacity activeOpacity={0.9} onPress={onPrimaryPress} style={styles.primaryButtonShadow}>
                        <LinearGradient colors={servicesTheme.gradients.primary} style={styles.primaryButton}>
                            <Text style={styles.buttonText}>{primaryButtonText}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {showAddToCart && (
                    <TouchableOpacity
                        style={[styles.outlineButtonBorder, { backgroundColor: servicesTheme.colors.primary }]}
                        onPress={onAddToCart}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.outlineButtonInner, { backgroundColor: servicesTheme.colors.surface }]}>
                            <Text style={[styles.outlineButtonText, { color: servicesTheme.colors.primary }]}>Add To Cart</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {isEnquiryService && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={onPrimaryPress}
                        style={[styles.primaryButtonShadow, styles.enquiryButtonSpacing]}
                    >
                        <LinearGradient colors={servicesTheme.gradients.primary} style={styles.primaryButton}>
                            <Text style={styles.buttonText}>{primaryButtonText}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};
const styles = StyleSheet.create({
    container: {
        // paddingHorizontal: 16,
        gap: 12,
    },
    mainContainer: { flex: 1, backgroundColor: '#FFF' },
    imageContainer: {
        height: 300,
        position: 'relative'
    },
    mainImg: { width: '100%', height: '100%' },
    contentPadding: { padding: 16 },
    descriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, marginTop: 18 },
    mainTitle: { fontSize: 19, fontWeight: '800', color: '#111827', flex: 1, marginRight: 10, letterSpacing: -0.2 },
    enquiryPricing: { alignItems: 'flex-end', marginLeft: 12 },
    enquiryPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    enquiryPrice: { fontSize: 14, fontWeight: '800' },
    enquiryMrp: { fontSize: 12, textDecorationLine: 'line-through' },
    enquirySavings: { fontSize: 13, marginTop: 3 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    subText: { color: '#6B7280', lineHeight: 20, marginBottom: 22, fontSize: 13.5 },
    primaryButtonShadow: {
        borderRadius: 14, marginBottom: 12,
        shadowColor: '#5B47A3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
    },
    enquiryButtonSpacing: { marginTop: 10 },
    primaryButton: {
        height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    outlineButtonBorder: {
        height: 54, borderRadius: 14, padding: 1.5,
        backgroundColor: '#8665FF', // Fallback for the border gradient logic
    },
    outlineButtonInner: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    },
    outlineButtonText: { color: '#8665FF', fontSize: 16, fontWeight: 'bold' },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginRight: 4,
    },

});
