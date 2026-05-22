import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, TextInput, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import Banner from '../constant/Banner';
import ScreenHeader from '../constant/navbar/ScreenHeaderColor';
import OrderStatusCard from './MyOrderCard';

const ServiceOrder1 = require('../../assete/ServiceData/Itr.png');
const ServiceOrder2 = require('../../assete/ServiceData/domacile.png');
import LinearGradient from 'react-native-linear-gradient';
import Reward from '../../../../assets/product/rewards.svg';

function MyOrder() {
    const navigation = useNavigation();
    const [search, setSearch] = useState('');

    return (
        <View style={styles.root}>
            {/* HEADER */}
            <ScreenHeader
                title="My Orders"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* BANNER */}
                <Banner />

                {/* SEARCH BAR */}
                <View style={styles.container}>
                    <MaterialIcons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by service name or order ID"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        returnKeyType="search"
                    />
                </View>
                {/* SUMMARY CARDS */}
                <View style={styles.summaryRow}>
                    <LinearGradient
                        colors={['#EFFFF4', '#DDFFE8']}
                        style={styles.summaryCard}
                    >
                        <Text style={styles.summaryLabel}>Coins Earned Till Date:</Text>
                        <View style={styles.summaryValueRow}>
                            <View style={styles.coinIcon}>
                                <Reward/>
                            </View>
                            <Text style={styles.summaryValue}>5000</Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#EFFFF4', '#DDFFE8']}
                        style={styles.summaryCard}
                    >
                        <Text style={styles.summaryLabel}>Total Savings Till Date:</Text>
                        <Text style={styles.summaryValue}>₹10,928</Text>
                    </LinearGradient>
                </View>


                {/* ORDER CARDS */}
                <OrderStatusCard
                    image={
                      <Image
                        source={ServiceOrder1}
                        style={styles.orderImage}
                        resizeMode="contain"
                      />
                    }
                    status="progress"
                    statusText="Order in Progress"
                    title="Rent Agreement"
                    subtitle="Services"
                    rewardCount={1480}
                />

                <OrderStatusCard
                    image={
                      <Image
                        source={ServiceOrder2}
                        style={styles.orderImage}
                        resizeMode="contain"
                      />
                    }
                    status="confirmed"
                    statusText="Order Confirmed"
                    title="New Aadhaar Card"
                    subtitle="Registration"
                    rewardCount={530}
                />
            </ScrollView>
        </View>
    );
}

export default MyOrder;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    scrollContent: {
        paddingBottom: 24,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E6E6E6',

    },

    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: '#111827',
        padding: 0,
    },
    summaryRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 12,
        gap: 10,
                marginBottom: 10,

    },

    summaryCard: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    summaryLabel: {
        fontSize: 12,
        color: '#047857',
        fontWeight: '500',
    },

    summaryValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },

    coinIcon: {
        fontSize: 14,
        marginRight: 4,
    },

    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#047857',
    },

    orderImage: {
        width: 42,
        height: 42,
    },
});
