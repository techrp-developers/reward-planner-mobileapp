import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { getProductImageUrl } from "../../api/ProductApi";
// Assuming you have your image utility
// import { getProductImageUrl } from "../../api/ProductApi"; 

type Props = {
    item: any;
    onIncrease: () => void;
    onDecrease: () => void;
    onRemove: () => void;
    onPress?: () => void;
};

const toNumber = (v: any) => Number(String(v).replace(/[^\d.]/g, "")) || 0;

const getDeliveryDate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[deliveryDate.getDay()];
    const date = deliveryDate.getDate();
    const monthName = months[deliveryDate.getMonth()];
    
    return `Delivery by ${dayName}, ${date} ${monthName}`;
};

export default function CheckoutItemCart({ item, onIncrease, onDecrease, onRemove, onPress }: Props) {
    const deliveryText = useMemo(() => getDeliveryDate(), []);
    const price = toNumber(item.final_item_total || item.item_total || item.sale_price || item.price);
    const productTitle =
        item?.product_name ||
        item?.title ||
        item?.name ||
        item?.product?.name ||
        item?.product?.title ||
        "Product";

    const productSubtitle =
        item?.variant_name ||
        item?.variant?.name ||
        item?.category_name ||
        "";

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                {/* Left column: Image + Quantity */}
                <TouchableOpacity style={styles.leftCol} activeOpacity={0.85} onPress={onPress}>
                    <Image source={{ uri: getProductImageUrl(item.image) }} style={styles.image} />
                    <View style={styles.qtyRow}>
                        <TouchableOpacity onPress={onDecrease} style={styles.qtyBtn}>
                            <Text style={styles.qtySymbol}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.quantity || 1}</Text>
                        <TouchableOpacity onPress={onIncrease} style={styles.qtyBtn}>
                            <Text style={styles.qtySymbol}>+</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Middle content */}
                <TouchableOpacity style={styles.info} activeOpacity={0.85} onPress={onPress}>
                    <Text style={styles.title} numberOfLines={1}>{productTitle}</Text>
                    {!!productSubtitle && <Text style={styles.subTitle}>{productSubtitle}</Text>}

                    <View style={styles.deliveryRow}>
                        <MaterialIcons name="local-shipping" size={16} color="#9CA3AF" />
                        <Text style={styles.delivery}>{deliveryText}</Text>
                    </View>

                    <Text style={styles.return}>7 Days Returnable</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{price.toLocaleString()}</Text>
                    </View>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity onPress={onRemove} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Offer row */}
            <TouchableOpacity style={styles.offerContainer}>
                <View style={styles.offerRow}>
                    <View style={styles.offerLeft}>
                        <MaterialIcons name="brightness-7" size={20} color="#F59E0B" />
                        <Text style={styles.offerText}>1 Offer Available</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#4B5563" />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 10,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        // Shadow for iOS/Android
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    topRow: {
        flexDirection: "row",
        position: 'relative',
    },
    leftCol: {
        alignItems: "center",
        marginRight: 12,
    },
    image: {
        width: 80,
        height: 80,
        resizeMode: "contain",
        marginBottom: 12,
    },
    qtyRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingHorizontal: 8,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
        
    },
    qtySymbol: { fontSize: 18, color: "#4B5563" },
    qtyValue: { width: 30, textAlign: "center", fontWeight: "500", fontSize: 14 },

    info: {
        flex: 1,
        paddingTop: 2,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1F2937",
    },
    subTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4B5563",
        marginBottom: 4,
    },
    deliveryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        gap: 6,
    },
    delivery: { fontSize: 13, color: "#6B7280" },
    return: {
        fontSize: 13,
        color: "#3B82F6",
        marginTop: 6,
        fontWeight: '500'
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
    },
    price: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginRight: 8,
    },
    closeBtn: {
        padding: 2,
    },
    offerContainer: {
        marginTop: 12,
        marginLeft: 92, // Aligns with the info section
    },
    offerRow: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#FFF7ED",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between',
    },
    offerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    offerText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#4B5563",
    },
});
