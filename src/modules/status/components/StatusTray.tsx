import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../../query/queryClient';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import {
  createStatus,
  deleteStatus,
  fetchMyStatuses,
  fetchStatusFeed,
  fetchStatusViewers,
  markStatusViewed,
} from '../api/statusApi';
import type { StatusFeedGroup, StatusMediaInput, StatusType, StatusViewer } from '../types';

const STATUS_COLORS = ['#202C33', '#6D28D9', '#BE123C', '#0369A1', '#047857', '#B45309'];

function initials(name?: string | null) {
  return (name || 'U').trim().slice(0, 1).toUpperCase();
}

function messageFrom(error: any) {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
}

function Avatar({ uri, name, size = 58 }: { uri?: string | null; name?: string | null; size?: number }) {
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

function StatusComposer({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [text, setText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(STATUS_COLORS[0]);
  const [media, setMedia] = useState<StatusMediaInput | null>(null);
  const [type, setType] = useState<StatusType>('text');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setText(''); setMedia(null); setType('text'); setBackgroundColor(STATUS_COLORS[0]);
  }, []);

  const close = useCallback(() => { if (!submitting) { reset(); onClose(); } }, [onClose, reset, submitting]);

  const chooseMedia = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'mixed', selectionLimit: 1, quality: 0.8 });
    if (result.didCancel) return;
    if (result.errorCode) return Alert.alert('Unable to select media', result.errorMessage || result.errorCode);
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.type) return;
    const selectedType: StatusType = asset.type.startsWith('video/') ? 'video' : 'image';
    setType(selectedType);
    setMedia({ uri: asset.uri, type: asset.type, fileName: asset.fileName || `status-${Date.now()}.${selectedType === 'video' ? 'mp4' : 'jpg'}` });
  }, []);

  const publish = useCallback(async () => {
    if (type === 'text' && !text.trim()) return Alert.alert('Add some text', 'Write something before publishing.');
    if (type !== 'text' && !media) return Alert.alert('Select media', 'Choose a photo or video first.');
    setSubmitting(true);
    try {
      await createStatus({ type, text, backgroundColor: type === 'text' ? backgroundColor : undefined, media: media || undefined });
      reset(); onCreated(); onClose();
    } catch (error) {
      Alert.alert('Could not publish status', messageFrom(error));
    } finally {
      setSubmitting(false);
    }
  }, [backgroundColor, media, onClose, onCreated, reset, text, type]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={[styles.composer, { backgroundColor: type === 'text' ? backgroundColor : '#0B0B0D' }]}>
        <View style={styles.composerHeader}>
          <Pressable onPress={close} hitSlop={12}><MaterialCommunityIcons name="close" color="#FFF" size={28} /></Pressable>
          <Text style={styles.composerTitle}>New status</Text>
          <Pressable onPress={chooseMedia} hitSlop={12}><MaterialCommunityIcons name="image-multiple-outline" color="#FFF" size={26} /></Pressable>
        </View>
        <View style={styles.composerBody}>
          {media ? (
            media.type.startsWith('image/') ? <Image source={{ uri: media.uri }} style={styles.composerImage} resizeMode="contain" /> :
              <View style={styles.videoSelected}><MaterialCommunityIcons name="video" color="#FFF" size={64} /><Text style={styles.videoSelectedText}>{media.fileName}</Text><Text style={styles.videoHint}>Videos must be 30 seconds or shorter</Text></View>
          ) : (
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a status"
              placeholderTextColor="rgba(255,255,255,.62)"
              multiline
              maxLength={700}
              autoFocus
              style={styles.statusInput}
              textAlign="center"
            />
          )}
        </View>
        {type === 'text' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
            {STATUS_COLORS.map(color => <Pressable key={color} onPress={() => setBackgroundColor(color)} style={[styles.colorDot, { backgroundColor: color }, backgroundColor === color && styles.colorDotSelected]} />)}
          </ScrollView>
        )}
        {media && <TextInput value={text} onChangeText={setText} maxLength={700} placeholder="Add a caption…" placeholderTextColor="#A1A1AA" style={styles.captionInput} />}
        <Pressable onPress={publish} disabled={submitting} style={styles.publishButton}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <><Text style={styles.publishText}>Publish</Text><MaterialCommunityIcons name="send" color="#FFF" size={20} /></>}
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

function ViewerList({ viewers }: { viewers: StatusViewer[] }) {
  return <FlatList data={viewers} keyExtractor={item => String(item.user_id)} ListEmptyComponent={<Text style={styles.emptyViewers}>No views yet</Text>} renderItem={({ item }) => <View style={styles.viewerRow}><Avatar uri={item.image_url} name={item.name} size={42} /><View><Text style={styles.viewerName}>{item.name || 'User'}</Text><Text style={styles.viewerTime}>{new Date(item.viewed_at).toLocaleString()}</Text></View></View>} />;
}

function StatusViewerModal({ group, own, visible, onClose, onChanged }: {
  group: StatusFeedGroup | null;
  own: boolean;
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [viewers, setViewers] = useState<StatusViewer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const status = group?.statuses[index];

  useEffect(() => { setIndex(0); setViewers(null); setVideoError(false); }, [group, visible]);
  useEffect(() => { setVideoError(false); }, [status?.id]);
  useEffect(() => {
    if (!visible || !status || own) return;
    markStatusViewed(status.id).catch(() => {});
  }, [own, status, visible]);

  const next = useCallback(() => {
    if (!group) return;
    if (index < group.statuses.length - 1) { setIndex(value => value + 1); setViewers(null); }
    else onClose();
  }, [group, index, onClose]);

  const previous = useCallback(() => { if (index > 0) { setIndex(value => value - 1); setViewers(null); } }, [index]);

  const showViewers = useCallback(async () => {
    if (!status) return;
    setBusy(true);
    try { setViewers(await fetchStatusViewers(status.id)); }
    catch (error) { Alert.alert('Could not load views', messageFrom(error)); }
    finally { setBusy(false); }
  }, [status]);

  const remove = useCallback(() => {
    if (!status) return;
    Alert.alert('Delete status?', 'This status will be removed immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await deleteStatus(status.id); onChanged(); onClose(); }
        catch (error) { Alert.alert('Could not delete status', messageFrom(error)); }
        finally { setBusy(false); }
      } },
    ]);
  }, [onChanged, onClose, status]);

  if (!group || !status) return null;
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.viewer, { backgroundColor: status.background_color || '#050505' }]}>
        <SafeAreaView style={styles.viewerSafe}>
          <View style={styles.progressRow}>{group.statuses.map((item, position) => <View key={item.id} style={styles.progressTrack}><View style={[styles.progressFill, { width: position <= index ? '100%' : '0%' }]} /></View>)}</View>
          <View style={styles.viewerHeader}><Avatar uri={group.user.image_url} name={group.user.name} size={40} /><View style={styles.viewerIdentity}><Text style={styles.viewerHeaderName}>{own ? 'My status' : group.user.name || 'Status'}</Text><Text style={styles.viewerHeaderTime}>{new Date(status.created_at).toLocaleString()}</Text></View>{own && <Pressable onPress={remove} hitSlop={10}><MaterialCommunityIcons name="delete-outline" color="#FFF" size={25} /></Pressable>}<Pressable onPress={onClose} hitSlop={10}><MaterialCommunityIcons name="close" color="#FFF" size={27} /></Pressable></View>
          <View style={styles.statusStage}>
            {status.type === 'text' && <Text style={[styles.viewerText, status.font_style === 'italic' && { fontStyle: 'italic' }]}>{status.text}</Text>}
            {status.type === 'image' && status.media_url && <Image source={{ uri: status.media_url }} style={styles.viewerMedia} resizeMode="contain" />}
            {status.type === 'video' && status.media_url && !videoError && (
              <Video
                source={{ uri: status.media_url }}
                style={styles.viewerMedia}
                resizeMode="contain"
                controls
                paused={!visible}
                playInBackground={false}
                playWhenInactive={false}
                onError={() => setVideoError(true)}
              />
            )}
            {status.type === 'video' && (!status.media_url || videoError) && (
              <View style={styles.videoOpen}>
                <MaterialCommunityIcons name="alert-circle-outline" color="#FFF" size={54} />
                <Text style={styles.videoOpenText}>Unable to play this video</Text>
              </View>
            )}
            {status.type !== 'text' && !!status.text && <Text style={styles.viewerCaption}>{status.text}</Text>}
            {status.type !== 'video' && <><Pressable style={styles.previousArea} onPress={previous} /><Pressable style={styles.nextArea} onPress={next} /></>}
          </View>
          {own && <Pressable onPress={showViewers} style={styles.viewsButton}>{busy ? <ActivityIndicator color="#FFF" /> : <><MaterialCommunityIcons name="eye-outline" color="#FFF" size={20} /><Text style={styles.viewsText}>{status.view_count || 0} views</Text></>}</Pressable>}
          {viewers && <View style={styles.viewersSheet}><View style={styles.sheetHandle} /><Text style={styles.viewersTitle}>Viewed by</Text><ViewerList viewers={viewers} /></View>}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function StatusTray() {
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useAppTheme();
  const [composerVisible, setComposerVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState<StatusFeedGroup | null>(null);
  const [viewingOwn, setViewingOwn] = useState(false);
  const enabled = isAuthenticated;
  const mineQuery = useQuery({ queryKey: ['statuses', 'mine'], queryFn: fetchMyStatuses, enabled, staleTime: 15000 });
  const feedQuery = useQuery({ queryKey: ['statuses', 'feed'], queryFn: () => fetchStatusFeed(), enabled, staleTime: 15000 });
  const feed = feedQuery.data ?? [];

  const myGroup = useMemo<StatusFeedGroup | null>(() => {
    const mine = mineQuery.data ?? [];
    return mine.length
      ? { user: mine[0].user, has_unviewed: false, statuses: mine }
      : null;
  }, [mineQuery.data]);
  const refresh = useCallback(() => { queryClient.invalidateQueries({ queryKey: ['statuses'] }); }, []);

  if (!isAuthenticated) return null;
  return (
    <View style={[styles.tray, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
      <View style={styles.trayHeader}><Text style={[styles.trayTitle, { color: isDark ? '#FAFAFA' : '#18181B' }]}>Updates</Text>{(mineQuery.isFetching || feedQuery.isFetching) && <ActivityIndicator size="small" color="#7C3AED" />}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayContent}>
        <View style={styles.storyItem}>
          <Pressable onPress={() => myGroup ? (setViewingOwn(true), setActiveGroup(myGroup)) : setComposerVisible(true)} onLongPress={() => setComposerVisible(true)} style={[styles.storyRing, myGroup && styles.storyRingActive]}>
            <Avatar uri={myGroup?.user.image_url} name={user?.name} />
            <Pressable onPress={() => setComposerVisible(true)} style={styles.addBadge}><MaterialCommunityIcons name="plus" color="#FFF" size={16} /></Pressable>
          </Pressable>
          <Text numberOfLines={1} style={[styles.storyName, { color: isDark ? '#E4E4E7' : '#27272A' }]}>My status</Text>
        </View>
        {feed.filter(group => Number(group.user.id) !== Number(user?.user_id)).map(group => (
          <Pressable key={group.user.id} style={styles.storyItem} onPress={() => { setViewingOwn(false); setActiveGroup(group); }}>
            <View style={[styles.storyRing, group.has_unviewed ? styles.storyRingActive : styles.storyRingViewed]}><Avatar uri={group.user.image_url} name={group.user.name} /></View>
            <Text numberOfLines={1} style={[styles.storyName, { color: isDark ? '#E4E4E7' : '#27272A' }]}>{group.user.name || 'User'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <StatusComposer visible={composerVisible} onClose={() => setComposerVisible(false)} onCreated={refresh} />
      <StatusViewerModal group={activeGroup} own={viewingOwn} visible={!!activeGroup} onClose={() => { setActiveGroup(null); refresh(); }} onChanged={refresh} />
    </View>
  );
}

export default memo(StatusTray);

const styles = StyleSheet.create({
  tray: { marginHorizontal: 16, marginTop: 14, borderRadius: 20, paddingVertical: 13, elevation: 5, shadowColor: '#000', shadowOpacity: .12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  trayHeader: { paddingHorizontal: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  trayTitle: { fontSize: 16, fontWeight: '800' }, trayContent: { paddingHorizontal: 12, gap: 12 }, storyItem: { width: 70, alignItems: 'center' },
  storyRing: { width: 66, height: 66, borderRadius: 33, padding: 3, borderWidth: 2, borderColor: '#D4D4D8' }, storyRingActive: { borderColor: '#7C3AED' }, storyRingViewed: { borderColor: '#A1A1AA' },
  storyName: { fontSize: 11, marginTop: 5, width: 70, textAlign: 'center' }, addBadge: { position: 'absolute', right: -2, bottom: -2, width: 23, height: 23, borderRadius: 12, backgroundColor: '#7C3AED', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarFallback: { backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' }, avatarInitial: { color: '#FFF', fontWeight: '800' },
  composer: { flex: 1 }, composerHeader: { height: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, composerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' }, composerBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusInput: { width: '88%', color: '#FFF', fontSize: 30, lineHeight: 40, fontWeight: '700', maxHeight: '70%' }, composerImage: { width: '100%', height: '100%' }, videoSelected: { alignItems: 'center', padding: 24 }, videoSelectedText: { color: '#FFF', marginTop: 14, fontSize: 16, fontWeight: '600', textAlign: 'center' }, videoHint: { color: '#A1A1AA', marginTop: 7 },
  colorRow: { paddingHorizontal: 18, gap: 12, paddingVertical: 12 }, colorDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,.5)' }, colorDotSelected: { borderWidth: 4, borderColor: '#FFF' }, captionInput: { marginHorizontal: 18, marginBottom: 10, borderRadius: 20, paddingHorizontal: 16, color: '#FFF', backgroundColor: '#27272A' }, publishButton: { alignSelf: 'flex-end', margin: 18, borderRadius: 24, minWidth: 116, height: 48, paddingHorizontal: 20, backgroundColor: '#7C3AED', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, publishText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  viewer: { flex: 1 }, viewerSafe: { flex: 1 }, progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingTop: 8 }, progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.35)', overflow: 'hidden' }, progressFill: { height: 3, backgroundColor: '#FFF' }, viewerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 }, viewerIdentity: { flex: 1 }, viewerHeaderName: { color: '#FFF', fontWeight: '700', fontSize: 15 }, viewerHeaderTime: { color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 2 },
  statusStage: { flex: 1, alignItems: 'center', justifyContent: 'center' }, viewerText: { color: '#FFF', fontSize: 32, lineHeight: 42, fontWeight: '700', paddingHorizontal: 30, textAlign: 'center' }, viewerMedia: { width: '100%', height: '100%' }, viewerCaption: { position: 'absolute', bottom: 24, left: 18, right: 18, color: '#FFF', textAlign: 'center', fontSize: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.55)' }, videoOpen: { alignItems: 'center' }, videoOpenText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 8 }, previousArea: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%' }, nextArea: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '32%' },
  viewsButton: { height: 52, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, viewsText: { color: '#FFF', fontWeight: '600' }, viewersSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', padding: 18, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }, sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D4D4D8', alignSelf: 'center', marginBottom: 12 }, viewersTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#18181B' }, viewerRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 9 }, viewerName: { color: '#18181B', fontWeight: '700' }, viewerTime: { color: '#71717A', fontSize: 11, marginTop: 3 }, emptyViewers: { color: '#71717A', textAlign: 'center', marginTop: 35 },
});
