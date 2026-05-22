import React from 'react';
import { Animated } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';

type SkeletonBoxProps = {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  pulse: Animated.Value;
};

/**
 * Reusable pulsing skeleton block.
 * Pass the shared `pulse` animated value from parent skeleton components.
 */
export default function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
  pulse,
}: SkeletonBoxProps) {
  const bg = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ECECEC', '#D5D5D5'],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bg },
        style,
      ]}
    />
  );
}
