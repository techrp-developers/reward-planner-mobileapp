import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import BBPSHead from '../constatnt/BBPSHead';
import { Biller, StateBillerSection } from './type';
import { fetchOperators, Operator } from '../api/BillsAPI';
import SkeletonBox from '../../services/component/constant/SkeletonBox';

const BillerSelectScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<StateBillerSection[]>([]);
  const [allData, setAllData] = useState<StateBillerSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  // Extract categoryId and categoryName from route params
  const categoryId = Number(route.params?.categoryId);
  const categoryName = route.params?.categoryName || 'Billers';

  const mapFlatOperatorsToSection = (operators: Operator[]): StateBillerSection[] => {
    if (!Array.isArray(operators) || operators.length === 0) {
      return [];
    }

    const billers = operators
      .map((item) => {
        const operatorId = Number(item?.operator_id);
        const name = String(item?.name || '').trim();

        if (!Number.isFinite(operatorId) || operatorId <= 0 || !name) {
          return null;
        }

        return {
          id: operatorId.toString(),
          name,
          operator_id: operatorId,
        };
      })
      .filter((item): item is Biller => Boolean(item));

    if (billers.length === 0) {
      return [];
    }

    return [
      {
        title: 'All Billers',
        data: billers,
      },
    ];
  };

  const loadOperators = useCallback(async () => {
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setError('Category ID not provided');
      setAllData([]);
      setFilteredData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const operators = await fetchOperators(categoryId);
      const transformedData = mapFlatOperatorsToSection(operators);
      setAllData(transformedData);
      setFilteredData(transformedData);
    } catch (err) {
      console.error('❌ Error fetching operators:', err);
      setError('Failed to load billers. Please try again.');
      setAllData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    anim.start();

    return () => {
      anim.stop();
    };
  }, [pulse]);

  // Fetch operators on component mount
  useEffect(() => {
    loadOperators();
  }, [loadOperators]);
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const lowercaseText = text.toLowerCase().trim();

    if (!lowercaseText) {
      setFilteredData(allData);
      return;
    }

    const filtered = allData.reduce((result, section) => {
      // 1. Filter billers within the section by name
      const matchingBillers = section.data.filter((biller) =>
        biller.name.toLowerCase().includes(lowercaseText)
      );

      // 2. Or check if the State name (title) matches
      const stateMatches = section.title.toLowerCase().includes(lowercaseText);

      // 3. If either matches, add to result
      if (matchingBillers.length > 0 || stateMatches) {
        // If state name matched but no biller did, show all billers in that state
        const billersToShow = matchingBillers.length > 0 ? matchingBillers : section.data;
        
        result.push({
          ...section,
          data: billersToShow,
        });
      }
      return result;
    }, [] as StateBillerSection[]);

    setFilteredData(filtered);
  };

  // Render individual Biller Item
  const renderBillerItem = ({ item, index, section }: { item: Biller; index: number; section: StateBillerSection }) => (
    <TouchableOpacity 
      style={[
        styles.billerItemRow,
        index === section.data.length - 1 && styles.lastBillerItemRow,
      ]}
      onPress={() => navigation.navigate('BillDetailsScreen', {
        operatorId: item.operator_id,
        operatorName: item.name,
        categoryId: categoryId,
        categoryName: categoryName,
      })}
    >
      <View style={styles.logoPlaceholder} />
      <Text style={styles.billerNameText} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render State Header (Section)
  const renderSectionHeader = ({ section: { title } }: { section: StateBillerSection }) => (
    <View style={styles.stateHeaderContainer}>
      <Text style={styles.stateHeaderText}>{title}</Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BBPSHead 
          title={`Pay ${categoryName}`}
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadOperators}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BBPSHead 
        title={`Pay ${categoryName}`}
        onBackPress={() => navigation.goBack()} 
      />

      {/* Search Input Area */}
      <View style={styles.searchContainer}>
        {loading ? (
          <SkeletonBox pulse={pulse} width="100%" height={52} borderRadius={12} />
        ) : (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by biller name or State"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
              clearButtonMode="while-editing"
            />
          </View>
        )}
      </View>

      {/* Grouped SectionList */}
      {loading ? (
        <View style={styles.listContent}>
          {[0, 1].map((group) => (
            <View key={`group-${group}`}>
              <SkeletonBox pulse={pulse} width="100%" height={42} borderRadius={10} style={styles.skeletonHeaderGap} />
              {[0, 1, 2].map((item) => (
                <View key={`row-${group}-${item}`} style={styles.skeletonRow}>
                  <SkeletonBox pulse={pulse} width={44} height={44} borderRadius={22} />
                  <SkeletonBox pulse={pulse} width="72%" height={16} borderRadius={8} style={styles.skeletonTextOffset} />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No billers found</Text>
          {searchQuery && (
            <Text style={styles.emptySubtext}>Try searching with a different biller name or state</Text>
          )}
        </View>
      ) : (
        <SectionList
          sections={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderBillerItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  searchContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  skeletonRow: {
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderGap: {
    marginTop: 12,
  },
  skeletonTextOffset: {
    marginLeft: 14,
  },
  stateHeaderContainer: {
    backgroundColor: '#DDE0FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
  },
  stateHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3F52',
  },
  billerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
  },
  lastBillerItemRow: {
    borderBottomColor: '#E5E7EB',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1D5DB',
    marginRight: 14,
  },
  billerNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BillerSelectScreen;
