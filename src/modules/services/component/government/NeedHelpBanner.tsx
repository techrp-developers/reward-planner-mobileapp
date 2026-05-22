import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
const StartConversationAvatars = require('../../assete/service/Gov_Conversation.png');

export default function NeedHelpBanner() {
  return (
    <LinearGradient
      colors={['#DFE4FF', '#4F6BFF']} 
      style={styles.container}
    >
      <Text style={styles.title}>Need help with Government Documents?</Text>
      
      <Text style={styles.description}>
        Not sure which document you need or how to apply? 
        Our team will guide you step by step, from submission to completion.
      </Text>

      {/* AVATAR AND TEXT ROW */}
      <View style={styles.conversationRow}>
        <Image
          source={StartConversationAvatars}
          style={styles.avatarImage}
          resizeMode="contain"
        />
      </View>

      {/* SPLIT ACTION BUTTON */}
      <View style={styles.actionButton}>
        <View style={styles.numberSection}>
          <Text style={styles.phoneNumber}>+91 7798 612243</Text>
        </View>
        
        <TouchableOpacity style={styles.talkSection} activeOpacity={0.8}>
          <Text style={styles.talkText}>Talk To Us</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 24,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  avatarImage: {
    width: 120,
    height: 80,
  },
  avatarGroup: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DFE4FF',
  },
  overlap: {
    marginLeft: -10,
  },
  convoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#FFFBEB', 
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  numberSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#FDE68A',
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  talkSection: {
    flex: 1,
    backgroundColor: '#FCD34D', // Mustard yellow for action side
    justifyContent: 'center',
    alignItems: 'center',
  },
  talkText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },
});