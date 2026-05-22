import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  type HourlyStatItem,
} from '../../api/DashboardAPI';
import { useTodayHourlyStatsQuery } from '../../api/useFitnessQueries';

const { width } = Dimensions.get('window');

const DEFAULT_HOURLY_DATA: HourlyStatItem[] = [
  { time: '6AM', steps: 0 },
  { time: '9AM', steps: 0 },
  { time: '12PM', steps: 0 },
  { time: '3PM', steps: 0 },
  { time: '6PM', steps: 0 },
];

const DAY_SLOTS = 24;
const GRAPH_HEIGHT = 120;
const BAR_WIDTH = 6;
const DOT_RADIUS = 3;

const parseHour = (time: string) => {
  const match = String(time).trim().toUpperCase().match(/^(\d{1,2})(AM|PM)$/);
  if (!match) return null;

  const hourValue = Number(match[1]);
  const period = match[2];

  if (!Number.isFinite(hourValue)) return null;
  if (period === 'AM') return hourValue === 12 ? 0 : hourValue;
  return hourValue === 12 ? 12 : hourValue + 12;
};

const StatisticsGraph: React.FC = () => {
  const hourlyStatsQuery = useTodayHourlyStatsQuery();
  const hourlyStats =
    hourlyStatsQuery.data?.success && hourlyStatsQuery.data.data && hourlyStatsQuery.data.data.length > 0
      ? hourlyStatsQuery.data.data
      : DEFAULT_HOURLY_DATA;
  const loading = hourlyStatsQuery.isLoading;
  const errorMessage =
    hourlyStatsQuery.data?.message ||
    (hourlyStatsQuery.error ? 'Failed to fetch hourly stats' : '');

  const graphWidth = Math.max(width - 76, 260);
  const barGap = Math.max(4, (graphWidth - DAY_SLOTS * BAR_WIDTH) / (DAY_SLOTS - 1));

  const slotValues = useMemo(() => {
    const values = Array.from({ length: DAY_SLOTS }, () => 0);

    hourlyStats.forEach((item) => {
      const hour = parseHour(item.time);
      if (hour === null || hour < 0 || hour >= DAY_SLOTS) return;
      values[hour] = Math.max(0, item.steps || 0);
    });

    return values;
  }, [hourlyStats]);

  const maxValue = useMemo(() => Math.max(...slotValues, 1), [slotValues]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>

        <TouchableOpacity style={styles.dropdown} activeOpacity={0.85}>
          <Text style={styles.dropdownText}>Today</Text>
          {/* <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color="#374151"
          /> */}
        </TouchableOpacity>
      </View>

      <View style={styles.graphContainer}>
        {loading ? (
          <View style={[styles.loaderBox, { width: graphWidth, height: GRAPH_HEIGHT }]}>
            <ActivityIndicator color="#7FB3FF" />
          </View>
        ) : (
          <Svg height={GRAPH_HEIGHT} width={graphWidth}>
            {slotValues.map((value, index) => {
              const x = index * (BAR_WIDTH + barGap);
              const isEmpty = value <= 0;

              if (isEmpty) {
                return (
                  <Circle
                    key={`dot-${index}`}
                    cx={x + BAR_WIDTH / 2}
                    cy={GRAPH_HEIGHT - 8}
                    r={DOT_RADIUS}
                    fill="#D1D5DB"
                  />
                );
              }

              const barHeight = Math.max(
                8,
                (value / maxValue) * (GRAPH_HEIGHT - 26)
              );
              const y = GRAPH_HEIGHT - barHeight - 8;

              return (
                <Rect
                  key={`bar-${index}`}
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  rx={3}
                  fill="#7FB3FF"
                />
              );
            })}
          </Svg>
        )}

        {errorMessage ? (
          <TouchableOpacity onPress={() => hourlyStatsQuery.refetch()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.labelsContainer}>
          <View style={styles.labelWithIcon}>
            <MaterialCommunityIcons
              name="weather-sunny"
              size={30}
              color="#FDBA18"
            />
          </View>

          <Text style={styles.timeLabel}>6AM</Text>
          <Text style={styles.timeLabel}>12PM</Text>
          <Text style={styles.timeLabel}>6PM</Text>

          <View style={styles.labelWithIcon}>
            <MaterialCommunityIcons
              name="weather-night"
              size={30}
              color="#A21CEF"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default React.memo(StatisticsGraph);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  dropdown: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  dropdownText: {
    fontSize: 18,
    color: '#4B5563',
    fontWeight: '700',
    marginRight: 8,
  },

  graphContainer: {
    alignItems: 'center',
  },

  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    color: '#3B6BFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
    alignItems: 'center',
  },

  labelWithIcon: {
    width: 32,
    alignItems: 'center',
  },

  timeLabel: {
    fontSize: 18,
    color: '#666',
    fontWeight: '700',
  },
});
