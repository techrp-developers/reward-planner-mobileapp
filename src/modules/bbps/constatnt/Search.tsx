import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import PaymentTop from '../../../navbar/assete/Payment_BG.png';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { BillCategory, fetchBillsCategories } from '../api/BillsAPI';

const MIN_SEARCH_LENGTH = 2;

function Search({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    let active = true;

    fetchBillsCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data.filter((item) => String(item.status) === '1'));
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const isSearchActive = query.length >= MIN_SEARCH_LENGTH;
  const results = useMemo(() => {
    if (!isSearchActive) return [];

    return categories.filter((item) =>
      [item.operator_category_name, item.operator_category_group]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [categories, isSearchActive, query]);

  const headerHeight = Math.round(width * 0.4);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { height: headerHeight }]}>
        <Image source={PaymentTop} style={styles.headerImage} resizeMode="cover" />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#A654CD" />
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder='Search "Electricity, DTH, FASTag…"'
            placeholderTextColor="#6B7280"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isSearchActive && (
          <Text style={styles.hint}>Type at least 2 characters to search bill payments</Text>
        )}

        {isSearchActive && loading && (
          <View style={styles.skeletonWrap}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.skeletonRow}>
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
                </View>
              </View>
            ))}
          </View>
        )}

        {isSearchActive && !loading && failed && (
          <Text style={styles.message}>Unable to load bill-payment services right now.</Text>
        )}

        {isSearchActive && !loading && !failed && results.length === 0 && (
          <Text style={styles.message}>No bill-payment services found for “{search.trim()}”</Text>
        )}

        {isSearchActive && !loading && !failed && results.map((item) => (
          <TouchableOpacity
            key={item.operator_category_id}
            activeOpacity={0.8}
            style={styles.resultRow}
            onPress={() =>
              navigation.navigate('BillerSelectScreen', {
                categoryId: item.operator_category_id,
                categoryName: item.operator_category_name,
              })
            }
          >
            <View style={styles.resultIcon}>
              <MaterialCommunityIcons name="receipt-text-outline" size={26} color="#7C3AED" />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {item.operator_category_name}
              </Text>
              <Text style={styles.resultType} numberOfLines={1}>
                {item.operator_category_group || 'Payments & bills'}
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-top-left" size={20} color="#B6B6B6" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    left: 18,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    color: '#111827',
    fontSize: 14,
    textAlignVertical: 'center',
  },
  list: {
    flex: 1,
    marginTop: 4,
  },
  hint: {
    paddingHorizontal: 20,
    paddingTop: 28,
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
  },
  message: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    color: '#7A7A7A',
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  resultIcon: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEEAF8',
    borderRadius: 10,
    backgroundColor: '#F7F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
    marginLeft: 14,
  },
  resultTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  resultType: {
    marginTop: 2,
    color: '#999999',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
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

export default Search;
