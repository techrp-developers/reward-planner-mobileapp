import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigation } from '@react-navigation/native';

interface UserInfo {
  name: string;
  number: string;
  operatorLogo: any; // Asset for the VI/Jio logo
  type: string; // e.g., "Prepaid"
}

interface Props {
  title?: string;
  user?: UserInfo; // New optional prop for the profile header
  onBackPress: () => void;
  onHelpPress?: () => void;
  onChangePress?: () => void; // For the "Change" link
}

const BBPSHead: React.FC<Props> = ({ title, user, onBackPress, onHelpPress, onChangePress }) => {
  const navigation = useNavigation<any>();

  const handleHelpPress = useCallback(() => {
    onHelpPress?.();
    navigation.navigate('HelpForm');
  }, [onHelpPress, navigation]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={onBackPress} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={32} color="#4B5563" />
          </TouchableOpacity>

          {/* Conditional Rendering: Profile vs Standard Title */}
          {user ? (
            <View style={styles.profileSection}>
              <View style={styles.logoContainer}>
                <Image source={user.operatorLogo} style={styles.operatorLogo} resizeMode="contain" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user.name} - {user.number}
                </Text>
                <View style={styles.typeRow}>
                  <Text style={styles.typeText}>{user.type} - </Text>
                  <TouchableOpacity onPress={onChangePress}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Right Section: Help Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleHelpPress} style={styles.helpButtonWrap}>
          <LinearGradient colors={['#A654CD', '#FC8BAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBorder}>
            <View style={styles.helpInnerContainer}>
              <MaskedView style={styles.maskedView} maskElement={
                <View style={styles.row}>
                  <MaterialIcons name="chat-bubble-outline" size={18} color="black" />
                  <Text style={styles.helpText}>Help</Text>
                </View>
              }>
                <LinearGradient colors={['#A654CD', '#FC8BAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullStretch} />
              </MaskedView>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... your existing styles ...
  headerContainer: { backgroundColor: '#FFFFFF', paddingTop: 40 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: 12 },
  backButton: { marginRight: 8, paddingVertical: 4 },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  
  // Profile specific styles
  profileSection: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  logoContainer: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  operatorLogo: { width: 28, height: 28 },
  userInfo: { marginLeft: 12, flex: 1, minWidth: 0 },
  userNameText: { fontSize: 16, fontWeight: '700', color: '#374151', flexShrink: 1 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  typeText: { fontSize: 14, color: '#6B7280' },
  changeText: { fontSize: 14, color: '#8665FF', fontWeight: '600' },
  
  // Help button styles (Keep yours)
  helpButtonWrap: { flexShrink: 0 },
  gradientBorder: { padding: 1.5, borderRadius: 10 },
  helpInnerContainer: { backgroundColor: '#FFFFFF', borderRadius: 8.5, paddingHorizontal: 12, paddingVertical: 7 },
  maskedView: { flexDirection: 'row', alignItems: 'center', height: 20, width: 64 },
  row: { flexDirection: 'row', alignItems: 'center' },
  helpText: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
  fullStretch: { ...StyleSheet.absoluteFillObject },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
});

export default BBPSHead;