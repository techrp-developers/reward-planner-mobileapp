import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, ScrollView, StyleSheet, Text, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BillsCard from '../component/home/BillsCard';
import RechargeBill from '../component/home/ReachargeBill';
import Balance from '../assets/BBPS_Service/Balance.png';
import RewardProductCard from '../constatnt/RewardProductCard';
import RechargeModal from '../constatnt/RechargeModal'; // Verify this path!
import SkeletonBox from '../../services/component/constant/SkeletonBox';

function HomePage() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const pulse = useRef(new Animated.Value(0)).current;

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    const handleRechargePress = () => {
        setShowPopup(false);
        navigation.navigate('ReachargeHomeScreen');
    };

    useEffect(() => {
        // Pulse Animation for Skeletons
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
                Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
            ])
        );
        anim.start();

        // Loading Timer
        const timer = setTimeout(() => {
            setLoading(false);
            // Show popup 500ms after loading finishes to ensure UI is ready
            setTimeout(() => {
                setShowPopup(true);
            }, 500);
        }, 900);

        return () => {
            clearTimeout(timer);
            anim.stop();
        };
    }, [pulse]);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View>
                        <View style={styles.balanceContainer}>
                            <SkeletonBox pulse={pulse} width="100%" height={120} borderRadius={16} />
                        </View>
                        <View style={styles.skeletonCard}>
                            <SkeletonBox pulse={pulse} width="40%" height={20} borderRadius={8} />
                            <SkeletonBox pulse={pulse} width="100%" height={18} borderRadius={8} style={styles.skeletonGap} />
                            <SkeletonBox pulse={pulse} width="90%" height={18} borderRadius={8} style={styles.skeletonGap} />
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.balanceContainer}>
                            <ImageBackground
                                source={Balance}
                                style={styles.balanceImage}
                                imageStyle={styles.balanceImageStyle}
                                resizeMode="stretch"
                            >
                                <View style={styles.textOverlay}>
                                    <Text style={styles.spentLabel}>Spent this Month</Text>
                                    <Text style={styles.amountText}>₹25,560.40</Text>
                                </View>
                            </ImageBackground>
                        </View>

                        <BillsCard />
                        <RechargeBill />
                        <RewardProductCard />
                    </>
                )}
            </ScrollView>

            {/* CRITICAL: Keep Modal outside the ScrollView at the very bottom */}
            <RechargeModal 
                visible={showPopup} 
                onClose={handleClosePopup}
                onRecharge={handleRechargePress}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    balanceContainer: { marginHorizontal: 16, marginTop: 10, elevation: 5 },
    balanceImage: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
    balanceImageStyle: { borderRadius: 16 },
    textOverlay: { alignItems: 'center' },
    spentLabel: { color: '#FFFFFF', fontSize: 16, opacity: 0.9 },
    amountText: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
    skeletonCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16 },
    skeletonGap: { marginTop: 12 },
});

export default HomePage;