import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getServiceImageUrl } from '../../utils/serviceImage';

import { HomeStackParamList } from '../../navigation/type';
import { getAllServices } from '../../api/ServiceAPI';
import ServiceHeader from '../constant/ServiceHeader';
import SkeletonBox from '../constant/SkeletonBox';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<HomeStackParamList, 'ServiceSearch'>;

type ServiceResult = {
  id: number;
  name: string;
  description: string;
  service_image: string;
  price: string;
  category_name: string;
  rating: string;
  estimated_days: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceSearchScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ServiceResult[]>([]);

  const pulse = useRef(new Animated.Value(0)).current;

  // Skeleton pulse loop
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // Debounced search — 300ms
  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await getAllServices(search.trim());
        setResults(res?.success ? (res.data ?? []) : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handlePress = useCallback(
    (item: ServiceResult) => {
      navigation.navigate('ServiceDescription', {
        serviceId: item.id,
        title: item.name,
      });
    },
    [navigation]
  );

  const isSearchActive = search.trim().length >= 2;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <ServiceHeader
        search={search}
        onChangeSearch={setSearch}
        autoFocus
      />

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isSearchActive ? (
          <Text style={styles.hint}>Type at least 2 characters to search services</Text>
        ) : loading ? (
          <View style={styles.skeletonWrap}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.skeletonRow}>
                <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={10} />
                <View style={styles.skeletonText}>
                  <SkeletonBox pulse={pulse} width="72%" height={13} borderRadius={999} />
                  <SkeletonBox
                    pulse={pulse}
                    width="44%"
                    height={10}
                    borderRadius={999}
                    style={styles.skeletonGap}
                  />
                  <SkeletonBox
                    pulse={pulse}
                    width="28%"
                    height={11}
                    borderRadius={999}
                    style={styles.skeletonGap}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : results.length === 0 ? (
          <Text style={styles.noResult}>No services found for "{search}"</Text>
        ) : (
          results.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={styles.row}
              onPress={() => handlePress(item)}
            >
              <View style={styles.imgWrap}>
                <Image
                  source={{ uri: getServiceImageUrl(item.service_image) }}
                  style={styles.img}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.mid}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rowCat} numberOfLines={1}>
                  {item.category_name}
                </Text>
                <Text style={styles.rowPrice}>₹{item.price}</Text>
              </View>

              <MaterialCommunityIcons name="arrow-top-left" size={20} color="#bbb" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
    marginTop: 16,
  },
  // Hint
  hint: {
    paddingHorizontal: 20,
    paddingTop: 24,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // No result
  noResult: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 14,
    color: '#7A7A7A',
  },
  // Result row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  imgWrap: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: {
    width: 44,
    height: 44,
  },
  mid: {
    flex: 1,
    marginLeft: 14,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  rowCat: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  rowPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A654CD',
    marginTop: 3,
  },
  // Skeleton
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonText: {
    flex: 1,
    marginLeft: 14,
  },
  skeletonGap: {
    marginTop: 8,
  },
});
