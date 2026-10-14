import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabsInset } from '../../../bottombar/BottomTabsInsetContext';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Screen root for BBPS. BBPSHead pads the top itself, so only the bottom is
// handled here: above the app's bottom tab bar when it is shown, otherwise
// above the system navigation bar.
function BBPSSafeAreaView({ children, style }: Props) {
  const tabBarInset = useBottomTabsInset();
  const edges: Edge[] = tabBarInset > 0 ? ['left', 'right'] : ['left', 'right', 'bottom'];

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1 }, style, tabBarInset > 0 && { paddingBottom: tabBarInset }]}
    >
      {children}
    </SafeAreaView>
  );
}

export default React.memo(BBPSSafeAreaView);
