import React from 'react';
import HeaderComponent from '../header/HeaderComponent';
import Home_Chart from '../stepcount/Home_Chart';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

function Dashbord() {
  return (
    <View style={styles.root}>
      <HeaderComponent />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Motivational Quote Banner */}
        <View style={styles.bannerOuter}>
          <LinearGradient
            colors={['#7928CA', '#9C3BE0', '#B84EFF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.card}
          >
            {/* Decorative radial glow overlays for depth */}
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={26}
                color="#9B3DD8"
              />
            </View>

            <Text style={styles.quote}>
              "Success is the sum of small efforts,{'\n'}repeated day in and day out."
            </Text>
          </LinearGradient>
        </View>

        <Home_Chart />
      </ScrollView>
    </View>
  );
}

export default Dashbord;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F5FF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  bannerOuter: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#7928CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.38 : 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  quote: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
