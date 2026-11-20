import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppTheme } from '../../../theme/ThemeContext';
import {
  campaignFilterCount, campaignPriceBands, campaignSortOptions, defaultCampaignFilters, filterCampaignItems,
  type CampaignFilters, type CampaignItemMetrics, type CampaignSort,
} from './campaignListing';

export function useCampaignListing<T>(items: T[], getMetrics: (item: T) => CampaignItemMetrics) {
  const [filters, setFilters] = useState(defaultCampaignFilters);
  const [sort, setSort] = useState<CampaignSort>('featured');
  const metrics = useMemo(() => items.map(item => ({ item, metrics: getMetrics(item) })), [items, getMetrics]);
  const brands = useMemo(() => [...new Set(metrics.flatMap(({ metrics: item }) => item.brand ? [item.brand] : []))]
    .sort((a, b) => a.localeCompare(b)), [metrics]);
  const results = useMemo(
    () => !campaignFilterCount(filters) && sort === 'featured' ? items : filterCampaignItems(metrics, filters, sort),
    [filters, items, metrics, sort],
  );
  return { results, filters, setFilters, sort, setSort, brands };
}

type Props = {
  count: number;
  label: 'product' | 'service';
  filters: CampaignFilters;
  setFilters: (filters: CampaignFilters) => void;
  sort: CampaignSort;
  setSort: (sort: CampaignSort) => void;
  brands: string[];
  variant?: 'toolbar' | 'header';
};

const ratingOptions = [{ label: 'Any rating', value: 0 }, { label: '3★ & up', value: 3 }, { label: '4★ & up', value: 4 }];
const discountOptions = [
  { label: 'Any discount', value: 0 },
  { label: '10% or more', value: 10 },
  { label: '25% or more', value: 25 },
  { label: '50% or more', value: 50 },
];
const priceOptions = campaignPriceBands.map(({ label }, value) => ({ label, value }));

function FilterGroup<T extends number | string>({
  title, options, value, onChange,
}: {
  title: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={[styles.groupTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.chips}>
        {options.map(option => {
          const checked = option.value === value;
          return (
            <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked }}
              onPress={() => onChange(option.value)} style={[
                styles.chip, { borderColor: checked ? theme.primary : theme.border },
                checked && { backgroundColor: theme.card },
              ]}>
              {checked && <MaterialIcons name="check" size={16} color={theme.primary} />}
              <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function CampaignListingControls({ count, label, filters, setFilters, sort, setSort, brands, variant = 'toolbar' }: Props) {
  const { theme } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const [panel, setPanel] = useState<'sort' | 'filter'>('sort');
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(filters);
  const activeCount = campaignFilterCount(filters);
  const inHeader = variant === 'header';
  const close = () => setVisible(false);

  const open = (nextPanel: 'sort' | 'filter') => {
    if (nextPanel === 'filter') setDraft(filters);
    setPanel(nextPanel);
    setVisible(true);
  };

  const buttonStyle = inHeader
    ? [styles.toolbarButton, styles.headerButton, { borderColor: theme.border, backgroundColor: theme.card }]
    : styles.toolbarButton;
  const toolbar = (
      <View style={inHeader ? styles.headerButtons : [styles.toolbar, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Sort offers" style={buttonStyle}
          onPress={() => open('sort')}>
          <MaterialIcons name="sort" size={inHeader ? 17 : 20} color={theme.primary} />
          <Text style={[styles.toolbarLabel, { color: theme.text }]}>Sort</Text>
        </Pressable>
        {!inHeader && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
        <Pressable accessibilityRole="button" accessibilityLabel={activeCount ? `Filter offers, ${activeCount} active` : 'Filter offers'}
          style={buttonStyle} onPress={() => open('filter')}>
          <MaterialIcons name="tune" size={inHeader ? 17 : 20} color={theme.primary} />
          <Text style={[styles.toolbarLabel, { color: theme.text }]}>Filter</Text>
          {activeCount > 0 && <Text style={styles.badge}>{activeCount}</Text>}
        </Pressable>
      </View>
  );
  const summary = (
      <View style={inHeader ? styles.headerSummary : styles.summary}>
        <Text accessibilityLiveRegion="polite" style={[styles.resultCount, { color: theme.secondaryText }]}>
          {count} {label}{count === 1 ? '' : 's'}
        </Text>
        {activeCount > 0 && count > 0 && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setFilters(defaultCampaignFilters)}>
            <Text style={[styles.link, { color: theme.text }]}>Clear filters</Text>
          </Pressable>
        )}
      </View>
  );
  return (
    <>
      {inHeader ? <View style={styles.headerToolbar}>{summary}{toolbar}</View> : <>{toolbar}{summary}</>}
      <Modal animationType="slide" transparent visible={visible} onRequestClose={close}>
        <View style={styles.modal}>
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
          <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: Math.max(bottom, 12) }]}>
            <View style={[styles.sheetHeader, { borderColor: theme.border }]}>
              <Text accessibilityRole="header" style={[styles.sheetTitle, { color: theme.text }]}>
                {panel === 'sort' ? 'Sort by' : 'Filters'}
              </Text>
              {panel === 'filter' && (
                <Pressable accessibilityRole="button" onPress={() => setDraft(defaultCampaignFilters)} style={styles.resetButton}>
                  <Text style={[styles.link, { color: theme.text }]}>Reset</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView bounces={false} contentContainerStyle={styles.sheetContent}>
              {panel === 'sort' ? campaignSortOptions.map(option => (
                <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: sort === option.value }}
                  style={[styles.sortOption, { borderColor: theme.border }]} onPress={() => { setSort(option.value); close(); }}>
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                  <MaterialIcons name={sort === option.value ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22} color={sort === option.value ? theme.primary : theme.secondaryText} />
                </Pressable>
              )) : (
                <>
                  <FilterGroup title="Price" options={priceOptions} value={draft.priceBand}
                    onChange={priceBand => setDraft(previous => ({ ...previous, priceBand }))} />
                  <FilterGroup title="Customer rating" options={ratingOptions} value={draft.rating}
                    onChange={rating => setDraft(previous => ({ ...previous, rating }))} />
                  <FilterGroup title="Discount" options={discountOptions} value={draft.discount}
                    onChange={discount => setDraft(previous => ({ ...previous, discount }))} />
                  {(brands.length > 0 || draft.brand !== '') && (
                    <FilterGroup title="Brand" options={[{ label: 'All brands', value: '' }, ...brands.map(brand => ({ label: brand, value: brand }))]}
                      value={draft.brand} onChange={brand => setDraft(previous => ({ ...previous, brand }))} />
                  )}
                </>
              )}
            </ScrollView>
            {panel === 'filter' && (
              <View style={[styles.sheetFooter, { borderColor: theme.border }]}>
                <Pressable accessibilityRole="button" style={styles.apply} onPress={() => { setFilters(draft); close(); }}>
                  <Text style={styles.applyLabel}>Apply filters</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  toolbarButton: { flex: 1, minHeight: 48, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  toolbarLabel: { fontSize: 14, fontWeight: '700' },
  headerToolbar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 9, gap: 6 },
  headerButtons: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 'auto', gap: 6 },
  headerButton: { flex: 0, minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, gap: 5 },
  headerSummary: { flexShrink: 1, paddingVertical: 4, gap: 4 },
  divider: { width: StyleSheet.hairlineWidth, height: 23 },
  badge: { minWidth: 20, borderRadius: 10, overflow: 'hidden', paddingHorizontal: 5, paddingVertical: 2, backgroundColor: '#5B47A3', color: '#FFF', textAlign: 'center', fontSize: 11, fontWeight: '700' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2, gap: 12 },
  resultCount: { fontSize: 13, fontWeight: '600' },
  link: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  resetButton: { minHeight: 48, paddingHorizontal: 10, justifyContent: 'center' },
  closeButton: { width: 48, height: 52, justifyContent: 'center', alignItems: 'center' },
  sheetContent: { paddingHorizontal: 20, paddingVertical: 12 },
  sortOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  optionLabel: { flexShrink: 1, fontSize: 14, fontWeight: '500' },
  group: { marginBottom: 16, gap: 8 },
  groupTitle: { fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  apply: { minHeight: 48, borderRadius: 8, backgroundColor: '#5B47A3', justifyContent: 'center', alignItems: 'center' },
  applyLabel: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
