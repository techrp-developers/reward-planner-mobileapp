// src/screens/LeaderboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { api } from '../../../services/api';

const DEFAULT_STANDINGS = [
  { id: 'sakshi', name: 'Sakshi', points: 450, streak: 4 },
  { id: 'alice', name: 'Alice', points: 360, streak: 2 },
  { id: 'bob', name: 'Bob', points: 280, streak: 0 },
];

export default function LeaderboardScreen({ employees, activeUserId = 'sakshi' }) {
  const [loading, setLoading] = useState(!employees);
  const [refreshing, setRefreshing] = useState(false);
  const [usersList, setUsersList] = useState(employees && employees.length > 0 ? employees : DEFAULT_STANDINGS);

  const fetchStandings = async () => {
    try {
      const data = await api.getLeaderboard();
      setUsersList(data && data.length > 0 ? data : DEFAULT_STANDINGS);
    } catch (error) {
      console.error('Error fetching standings:', error);
      setUsersList(DEFAULT_STANDINGS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (employees && employees.length > 0) {
      setUsersList(employees);
      setLoading(false);
    } else if (!employees) {
      fetchStandings();
    }
  }, [employees, activeUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStandings();
  };

  const renderItem = ({ item, index }) => {
    const isCurrentUser = item.id === activeUserId;
    const rank = index + 1;

    let rankDisplay = <Text style={styles.rankText}>#{rank}</Text>;
    if (rank === 1) rankDisplay = <Text style={styles.rankEmoji}>🏆</Text>;
    else if (rank === 2) rankDisplay = <Text style={styles.rankEmoji}>🥈</Text>;
    else if (rank === 3) rankDisplay = <Text style={styles.rankEmoji}>🥉</Text>;

    return (
      <View style={[styles.leaderRow, isCurrentUser && styles.currentUserRow]}>
        <View style={styles.leftContainer}>
          <View style={styles.rankContainer}>{rankDisplay}</View>
          <View style={styles.infoContainer}>
            <Text style={[styles.nameText, isCurrentUser && styles.currentUserNameText]}>
              {item.name} {isCurrentUser && '(You)'}
            </Text>
            {item.streak > 0 && (
              <Text style={styles.streakBadge}>
                🔥 {item.streak} Day Streak
              </Text>
            )}
          </View>
        </View>
        <View style={styles.rightContainer}>
          <Text style={styles.pointsText}>{item.points}</Text>
          <Text style={styles.pointsLabel}>PTS</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#e9d5ff" />
        <Text style={styles.loadingText}>Loading Standings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Leaderboard</Text>
        <Text style={styles.subtext}>Top employees of MPS Global</Text>
      </View>

      <FlatList
        data={usersList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e9d5ff" />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No users registered yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  titleText: {
    fontFamily: 'Georgia',
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#e9d5ff',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 4,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#e9d5ff',
    fontSize: 14,
    marginTop: 10,
  },
  emptyText: {
    color: '#e9d5ff',
    fontSize: 15,
  },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#ffffff',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankContainer: {
    width: 36,
    alignItems: 'flex-start',
  },
  rankText: {
    color: '#e9d5ff',
    fontSize: 14,
    fontWeight: '800',
  },
  rankEmoji: {
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    color: '#f3e8ff',
    fontSize: 15,
    fontWeight: '700',
  },
  currentUserNameText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  streakBadge: {
    color: '#fb7185',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  pointsLabel: {
    color: '#e9d5ff',
    fontSize: 9,
    fontWeight: '700',
  },
});
