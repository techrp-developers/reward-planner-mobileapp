import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from 'react-native';

import Remainder from '../assets/BBPS_Service/Bills Reminder.png';


interface RechargeModalProps {
  visible: boolean;
  onClose: () => void;
  onRecharge?: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({
  visible,
  onClose,
  onRecharge,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible, scaleValue]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.contentGroup}>
          <Animated.View
            style={[
              styles.modalWrapper,
              { transform: [{ scale: scaleValue }] },
            ]}
          >
            <ImageBackground
              source={Remainder}
              style={styles.modalContainer}
              imageStyle={styles.modalBackgroundImage}
              resizeMode="cover"
            >
              <Text style={styles.title}>Recharge Reminder</Text>

              <View style={styles.iconCircle}>
                <View style={styles.placeholderLogo}>
                  <Text style={styles.logoText}>⚡</Text>
                </View>
              </View>

              <Text style={styles.detailsText}>
                839283829382 -{'\n'}
                Mahavitran - Maharashtra{'\n'}
                (MSEDCL)
              </Text>

              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Last Recharged - ₹834</Text>
                <Text style={styles.infoLabel}>Due on - 19/01/2026</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.rechargeBtn}
                onPress={() => {
                  if (onRecharge) {
                    onRecharge();
                    return;
                  }
                  onClose();
                }}
              >
                <Text style={styles.rechargeBtnText}>Recharge</Text>
              </TouchableOpacity>

              <View style={styles.footerBtns}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.footerText}>Later</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.footerText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* Separate X Button below the card as per image */}
          <TouchableOpacity 
            style={styles.closeCircle} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay to focus on popup
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentGroup: {
    alignItems: 'center',
  },
  modalWrapper: {
    width: '100%',
    borderRadius: 24,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    // Android Shadow
    elevation: 12,
  },
  modalContainer: {
    width: '100%',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 24,
  },
  modalBackgroundImage: {
    borderRadius: 24,
    
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    color: '#E31E24', // Electric Red
  },
  detailsText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginVertical: 2,
  },
  rechargeBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    width: '80%',
    borderRadius: 15,
    marginTop: 25,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  rechargeBtnText: {
    color: '#9D62D9', 
    fontWeight: '800',
    fontSize: 18,
  },
  footerBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 25,
  },
  footerText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontSize: 15,
    fontWeight: '500',
  },
  closeCircle: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  closeIcon: {
    fontSize: 22,
    color: '#333333',
    fontWeight: 'bold',
  },
});

export default RechargeModal;