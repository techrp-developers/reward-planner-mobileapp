import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { CmsZoneEntry } from './cmsContentApi';
import { parseCmsBackground } from './cmsColors';

export default function CmsBannerCopy({ banner, clickable }: {
  banner: CmsZoneEntry;
  clickable: boolean;
}) {
  const background = React.useMemo(() => parseCmsBackground(banner.color_value), [banner.color_value]);
  const showColor = banner.content_type === 'color';
  const cta = clickable ? banner.cta_text?.trim() : null;
  if (!showColor && !cta) return null;
  const textColor = banner.text_color || '#FFFFFF';

  return (
    <View pointerEvents="none" style={[styles.copy, showColor && styles.colorCopy, showColor && background && { backgroundColor: background.color }]}>
      {showColor && background?.gradient ? (
        <LinearGradient {...background.gradient} style={StyleSheet.absoluteFill} />
      ) : null}
      {showColor && banner.title ? (
        <Text numberOfLines={2} style={[styles.title, { color: textColor }]}>{banner.title}</Text>
      ) : null}
      {cta ? <Text numberOfLines={2} style={[styles.cta, { color: textColor }]}>{cta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 18, paddingBottom: 23 },
  colorCopy: { justifyContent: 'center', backgroundColor: '#211B2B' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  cta: { fontSize: 13, fontWeight: '700', borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.68)', paddingHorizontal: 10, paddingVertical: 6 },
});
