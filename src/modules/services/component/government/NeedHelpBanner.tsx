import React from 'react';
import { Linking, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const StartConversationAvatars = require('../../assete/service/Gov_Conversation.png');

const CONTACT_NUMBER = '918660583751';
const CONTACT_NUMBER_DISPLAY = '+91 8660 583751';

export default function NeedHelpBanner() {
  return (
    <LinearGradient
      colors={['#F8F9FF', '#EEF1FF']}
      style={styles.container}
    >
      {/* TEXT + AVATAR ROW */}
      <View style={styles.topRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="bank" size={26} color="#4F46E5" />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.eyebrow}>WE'RE HERE TO HELP</Text>
          <Text style={styles.title}>
            Govt. Document <Text style={styles.titleAccent}>Help</Text>
          </Text>
          <Text style={styles.subtitle}>Quick guidance from our team</Text>
        </View>

        <View style={styles.avatarCol}>
          <Image
            source={StartConversationAvatars}
            style={styles.avatarImage}
            resizeMode="contain"
          />
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Our team is online</Text>
          </View>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL(`tel:+${CONTACT_NUMBER}`)}
          style={styles.buttonWrap}
        >
          <LinearGradient
            colors={['#6D5DFB', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionButton}
          >
            <View style={styles.actionIconCircle}>
              <MaterialCommunityIcons name="phone" size={16} color="#4338CA" />
            </View>
            <Text style={styles.actionText} numberOfLines={1}>
              {CONTACT_NUMBER_DISPLAY}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Linking.openURL(`https://wa.me/${CONTACT_NUMBER}`)}
          style={styles.buttonWrap}
        >
          <LinearGradient
            colors={['#34D399', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionButton}
          >
            <View style={styles.actionIconCircle}>
              <MaterialCommunityIcons name="whatsapp" size={16} color="#16A34A" />
            </View>
            <Text style={styles.actionText} numberOfLines={1}>
              Chat with us
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  titleAccent: {
    color: '#4F46E5',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  avatarCol: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 72,
    height: 26,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 10,
    gap: 8,
  },
  actionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
