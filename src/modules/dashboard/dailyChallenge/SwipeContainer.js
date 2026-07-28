// src/components/SwipeContainer.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DailyQuizScreen from './DailyQuizScreen';
import LeaderboardScreen from './LeaderboardScreen';
import RewardsStoreScreen from './RewardsStoreScreen';
import {
  getRewardsSnapshot,
  initializeActiveEmployeeByName,
  setActiveEmployee,
  subscribeToRewardsUpdates,
  fetchRewardsSnapshot,
} from '../../../services/api';

const TABS = [
  { key: 'quiz', label: 'Quiz' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'store', label: 'Store' },
];

export default function SwipeContainer({ children, loggedInUserName }) {
  const scrollRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const [activeTab, setActiveTab] = useState('quiz');
  const [snapshot, setSnapshot] = useState(() => getRewardsSnapshot());
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [quizCardHeight, setQuizCardHeight] = useState(null);

  const handleCardLayout = event => {
    if (activeTab === 'quiz') {
      const { height } = event.nativeEvent.layout;
      if (height > 0) {
        setQuizCardHeight(height);
      }
    }
  };

  const loadSnapshot = async (empId = snapshot.activeEmployeeId) => {
    const data = await fetchRewardsSnapshot(empId);
    setSnapshot(data);
  };

  useEffect(() => {
    const init = async () => {
      const initialSnapshot = initializeActiveEmployeeByName(loggedInUserName);
      const data = await fetchRewardsSnapshot(initialSnapshot.activeEmployeeId);
      setSnapshot(data);
    };
    init();

    const unsubscribe = subscribeToRewardsUpdates(nextSnapshot => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, [loggedInUserName]);

  const currentXOffsetRef = useRef(screenWidth);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: screenWidth, animated: false });
      currentXOffsetRef.current = screenWidth;
    });
  }, [screenWidth]);

  useEffect(() => {
    const onBackPress = () => {
      // If we are on Page 1 (dashboard), scroll back to Page 0 (Daily Quiz) and prevent exit
      if (scrollRef.current && currentXOffsetRef.current > 10) {
        scrollRef.current.scrollTo({ x: 0, animated: true });
        currentXOffsetRef.current = 0;
        return true; // Prevents app exit
      }
      return false; // Exits app or handles default back action if on Page 0
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, []);

  const activeEmployee = snapshot.activeEmployee;

  const handleEmployeeSwitch = async employeeId => {
    await setActiveEmployee(employeeId);
    await loadSnapshot(employeeId);
    setShowDemoSwitcher(false);
  };

  const handleBackToDashboard = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: screenWidth, animated: true });
      currentXOffsetRef.current = screenWidth;
    }
  };

  const content = useMemo(() => {
    if (activeTab === 'leaderboard') {
      return (
        <LeaderboardScreen
          employees={snapshot.leaderboard}
          activeUserId={snapshot.activeEmployeeId}
        />
      );
    }

    if (activeTab === 'store') {
      return (
        <RewardsStoreScreen
          rewards={snapshot.rewards}
          activeEmployee={activeEmployee}
          onRedeemed={loadSnapshot}
        />
      );
    }

    return (
      <DailyQuizScreen
        activeEmployee={activeEmployee}
        initialQuizState={snapshot.quiz}
        onDataChange={loadSnapshot}
      />
    );
  }, [activeEmployee, activeTab, snapshot]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      bounces={false}
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: screenWidth, y: 0 }}
      scrollEventThrottle={16}
      onMomentumScrollEnd={event => {
        currentXOffsetRef.current = event.nativeEvent.contentOffset.x;
      }}
      style={styles.container}
    >
      {/* PAGE 0: Challenge feed with full screen solid black theme (Left Page) */}
      <View style={[styles.page, styles.challengePage, { width: screenWidth }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header Bar (outside card, sit little bit below) */}
          <View style={styles.headerBar}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.headerIconBtn} 
              onPress={handleBackToDashboard}
            >
              <Text style={styles.headerBackArrow}>〈</Text>
            </TouchableOpacity>
          </View>

          {/* Main Content Glossy LinearGradient Card */}
          <LinearGradient
            colors={['#5e52a0', '#392a83', '#1b1054', '#0a032c']}
            style={[
              styles.whiteCard,
              activeTab !== 'quiz' && quizCardHeight ? { height: quizCardHeight } : null
            ]}
            onLayout={handleCardLayout}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Tab Selector inside the Card */}
            <View style={styles.tabRow}>
              {TABS.map(tab => {
                const isActive = tab.key === activeTab;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.8}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[
              styles.cardStaticContent,
              activeTab !== 'quiz' ? { flex: 1 } : null
            ]}>
              {content}
            </View>
          </LinearGradient>

          {/* Pagination indicator dots below the card */}
          <View style={styles.indicatorDotsRow}>
            <View style={[styles.indicatorDot, styles.indicatorDotActive]} />
            <View style={styles.indicatorDot} />
            <View style={styles.indicatorDot} />
            <View style={styles.indicatorDot} />
            <View style={styles.indicatorDot} />
          </View>
        </SafeAreaView>
      </View>

      {/* PAGE 1: Your Dashboard (Right Page) */}
      <View style={[styles.page, { width: screenWidth }]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  challengePage: {
    backgroundColor: '#06070B', // Premium full screen black theme background
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 36,
    marginBottom: 6,
    height: 50,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackArrow: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4,
  },
  headerShareText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerEmojiIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  switcherDropdown: {
    position: 'absolute',
    top: 110,
    right: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    zIndex: 100,
    width: 200,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  switcherDropdownLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  switcherDropBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  switcherDropBtnActive: {
    backgroundColor: '#334155',
  },
  switcherDropBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  switcherDropBtnTextActive: {
    color: '#bfa07a',
    fontWeight: '800',
  },
  whiteCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)', // Glossy white card border lines
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: 'hidden',
    maxHeight: Dimensions.get('window').height * 0.80,
  },
  cardStaticContent: {
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#ffffff', // Clean white active tab bottom line
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.55)', // Semi-transparent inactive text
    fontSize: 16,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff', // High-contrast active tab text
    fontWeight: '800',
  },
  indicatorDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  indicatorDotActive: {
    width: 8,
    height: 8,
    backgroundColor: '#ffffff',
  },
});