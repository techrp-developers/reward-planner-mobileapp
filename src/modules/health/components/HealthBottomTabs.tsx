import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import EventTabIcon from '../assets/icons/eventtabicon.svg';
import ProviderTabIcon from '../assets/icons/providertabicon.svg';

export const HEALTH_TAB_BAR_HEIGHT = 72;

type HealthTabKey = 'Home' | 'Providers' | 'Events' | 'Profile';

type Props = {
  activeTabKey: HealthTabKey;
  onTabPress: (tab: HealthTabKey) => void;
};

const tabs: Array<{
  key: HealthTabKey;
  label: string;
  icon?: string;
  SvgIcon?: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  iconSize?: number;
}> = [
  { key: 'Home', label: 'Home', icon: 'home-outline', iconSize: 27 },
  { key: 'Providers', label: 'Providers', SvgIcon: ProviderTabIcon },
  { key: 'Events', label: 'Events', SvgIcon: EventTabIcon },
  { key: 'Profile', label: 'Profile', icon: 'account-outline', iconSize: 27 },
];

export default function HealthBottomTabs({ activeTabKey, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.bar,
          { height: HEALTH_TAB_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset },
        ]}
      >
        {tabs.map(tab => {
          const isActive = tab.key === activeTabKey;
          const SvgIcon = tab.SvgIcon;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.85}
              style={styles.item}
              onPress={() => onTabPress(tab.key)}
            >
              <View style={styles.iconWrap}>
                {SvgIcon ? (
                  <SvgIcon
                    width={24}
                    height={24}
                    color={isActive ? '#6B7280' : '#9CA3AF'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={tab.icon!}
                    size={tab.iconSize ?? 24}
                    color={isActive ? '#6B7280' : '#9CA3AF'}
                  />
                )}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    color: '#000000',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: 'Manrope',
  },
  labelActive: {
    color: '#16A34A',
  },
});

