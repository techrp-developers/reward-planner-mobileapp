import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ViewType } from 'react-native-video';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../../query/queryClient';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import {
  createStatus,
  deleteStatus,
  fetchStatusAudienceOptions,
  fetchMyStatuses,
  fetchStatusFeed,
  fetchStatusViewers,
  markStatusViewed,
} from '../api/statusApi';
import type { StatusFeedGroup, StatusMediaInput, StatusType, StatusViewer, StatusVisibility } from '../types';

const STATUS_COLORS = ['#202C33', '#6D28D9', '#BE123C', '#0369A1', '#047857', '#B45309'];
const AUDIENCES: Array<{ value: StatusVisibility; label: string }> = [
  { value: 'same_company', label: 'My company' },
  { value: 'all_except_companies', label: 'All except selected companies' },
  { value: 'custom_people', label: 'Selected people only' },
];

function initials(name?: string | null) {
  return (name || 'U').trim().slice(0, 1).toUpperCase();
}

function messageFrom(error: any) {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
}

function Avatar({ uri, name, size = 54 }: { uri?: string | null; name?: string | null; size?: number }) {
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
  const [audienceVisible, setAudienceVisible] = useState(false);
  const [visibility, setVisibility] = useState<StatusVisibility>('same_company');
  const [excludedCompanyIds, setExcludedCompanyIds] = useState<number[]>([]);
  const [allowedUserIds, setAllowedUserIds] = useState<number[]>([]);
  const audienceQuery = useQuery({
    queryKey: ['statuses', 'audience-options'],
    queryFn: () => fetchStatusAudienceOptions(),
    enabled: visible && audienceVisible,
    staleTime: 60000,
  });

  const reset = useCallback(() => {
    setText(''); setMedia(null); setType('text'); setBackgroundColor(STATUS_COLORS[0]);
    setVisibility('same_company'); setExcludedCompanyIds([]); setAllowedUserIds([]); setAudienceVisible(false);
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
    if (visibility === 'all_except_companies' && !excludedCompanyIds.length) return Alert.alert('Choose companies', 'Select at least one company to exclude.');
    if (visibility === 'custom_people' && !allowedUserIds.length) return Alert.alert('Choose people', 'Select at least one person.');
    setSubmitting(true);
    try {
      await createStatus({ type, text, backgroundColor: type === 'text' ? backgroundColor : undefined, media: media || undefined, visibility, excludedCompanyIds, allowedUserIds });
      reset(); onCreated(); onClose();
    } catch (error) {
      Alert.alert('Could not publish status', messageFrom(error));
    } finally {
      setSubmitting(false);
    }
  }, [allowedUserIds, backgroundColor, excludedCompanyIds, media, onClose, onCreated, reset, text, type, visibility]);

  const toggleId = useCallback((id: number, values: number[], update: React.Dispatch<React.SetStateAction<number[]>>) => {
    update(values.includes(id) ? values.filter(value => value !== id) : [...values, id]);
  }, []);

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
        <Pressable onPress={() => setAudienceVisible(true)} style={styles.audienceButton}>
          <MaterialCommunityIcons name="shield-account-outline" color="#FFF" size={20} />
          <Text style={styles.audienceButtonText}>{AUDIENCES.find(item => item.value === visibility)?.label}</Text>
          <MaterialCommunityIcons name="chevron-up" color="#FFF" size={20} />
        </Pressable>
        <Pressable onPress={publish} disabled={submitting} style={styles.publishButton}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <><Text style={styles.publishText}>Publish</Text><MaterialCommunityIcons name="send" color="#FFF" size={20} /></>}
        </Pressable>
        <Modal visible={audienceVisible} transparent animationType="slide" onRequestClose={() => setAudienceVisible(false)}>
          <View style={styles.audienceBackdrop}>
            <SafeAreaView style={styles.audienceSheet}>
              <View style={styles.audienceHeader}>
                <Text style={styles.audienceTitle}>Who can see this?</Text>
                <Pressable onPress={() => setAudienceVisible(false)}><MaterialCommunityIcons name="close" size={26} color="#18181B" /></Pressable>
              </View>
              {AUDIENCES.map(item => <Pressable key={item.value} onPress={() => setVisibility(item.value)} style={styles.audienceOption}><Text style={styles.audienceOptionText}>{item.label}</Text><MaterialCommunityIcons name={visibility === item.value ? 'radiobox-marked' : 'radiobox-blank'} size={23} color="#7C3AED" /></Pressable>)}
              {(visibility === 'all_except_companies' || visibility === 'custom_people') && <ScrollView style={styles.audienceList}>
                {audienceQuery.isLoading && <ActivityIndicator color="#7C3AED" />}
                {audienceQuery.isError && <Text style={styles.audienceError}>Could not load audience options</Text>}
                {visibility === 'all_except_companies' && audienceQuery.data?.companies.map(company => <Pressable key={company.id} onPress={() => toggleId(company.id, excludedCompanyIds, setExcludedCompanyIds)} style={styles.audienceRow}><Text style={styles.audienceRowText}>{company.name}</Text><MaterialCommunityIcons name={excludedCompanyIds.includes(company.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color="#7C3AED" /></Pressable>)}
                {visibility === 'custom_people' && audienceQuery.data?.people.map(person => <Pressable key={person.id} onPress={() => toggleId(person.id, allowedUserIds, setAllowedUserIds)} style={styles.audienceRow}><Avatar uri={person.image_url} name={person.name} size={36} /><View style={styles.audiencePerson}><Text style={styles.audienceRowText}>{person.name}</Text><Text style={styles.audienceCompanyText}>{person.company.name}</Text></View><MaterialCommunityIcons name={allowedUserIds.includes(person.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color="#7C3AED" /></Pressable>)}
              </ScrollView>}
              <Pressable onPress={() => setAudienceVisible(false)} style={styles.audienceDone}><Text style={styles.audienceDoneText}>Done</Text></Pressable>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

function ViewerList({ viewers }: { viewers: StatusViewer[] }) {
  return <FlatList data={viewers} keyExtractor={item => String(item.user_id)} ListEmptyComponent={<Text style={styles.emptyViewers}>No views yet</Text>} renderItem={({ item }) => <View style={styles.viewerRow}><Avatar uri={item.image_url} name={item.name} size={42} /><View><Text style={styles.viewerName}>{item.name || 'User'}</Text><Text style={styles.viewerTime}>{new Date(item.viewed_at).toLocaleString()}</Text></View></View>} />;
}

function StatusViewerModal({ group, own, visible, onClose, onFinished, onChanged }: {
  group: StatusFeedGroup | null;
  own: boolean;
  visible: boolean;
  onClose: () => void;
  onFinished: () => void;
  onChanged: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [viewers, setViewers] = useState<StatusViewer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const videoTouchStart = useRef({ x: 0, y: 0 });
  const videoTouchWidth = useRef(0);
  const status = group?.statuses[index];

  useEffect(() => { setIndex(0); setViewers(null); setVideoError(false); setVideoPaused(false); }, [group, visible]);
  useEffect(() => { setVideoError(false); setVideoPaused(false); }, [status?.id]);
  useEffect(() => {
    if (!visible || !status || own) return;
    markStatusViewed(status.id).catch(() => {});
  }, [own, status, visible]);

  const next = useCallback(() => {
    if (!group) return;
    if (index < group.statuses.length - 1) { setIndex(value => value + 1); setViewers(null); }
    else onFinished();
  }, [group, index, onFinished]);

  const previous = useCallback(() => { if (index > 0) { setIndex(value => value - 1); setViewers(null); } }, [index]);

  const finishVideoGesture = useCallback((x: number, y: number, localX: number) => {
    const deltaX = x - videoTouchStart.current.x;
    const deltaY = y - videoTouchStart.current.y;
    if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) next();
      else previous();
      return;
    }
    if (localX >= videoTouchWidth.current * 0.7) { next(); return; }
    if (localX <= videoTouchWidth.current * 0.3) { previous(); return; }
    setVideoPaused(value => !value);
  }, [next, previous]);

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
              <View
                style={styles.viewerMedia}
              >
                <Video
                  key={status.id}
                  source={{ uri: status.media_url }}
                  style={styles.viewerMedia}
                  resizeMode="contain"
                  viewType={ViewType.TEXTURE}
                  paused={!visible || videoPaused}
                  playInBackground={false}
                  playWhenInactive={false}
                  onEnd={next}
                  onError={() => setVideoError(true)}
                  pointerEvents="none"
                />
                <View
                  style={styles.videoTouchLayer}
                  onLayout={event => { videoTouchWidth.current = event.nativeEvent.layout.width; }}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderTerminationRequest={() => false}
                  onResponderGrant={event => { videoTouchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }; }}
                  onResponderRelease={event => finishVideoGesture(event.nativeEvent.pageX, event.nativeEvent.pageY, event.nativeEvent.locationX)}
                />
              </View>
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
  const [composerVisible, setComposerVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState<StatusFeedGroup | null>(null);
  const [viewingOwn, setViewingOwn] = useState(false);
  const enabled = isAuthenticated;
  const mineQuery = useQuery({ queryKey: ['statuses', 'mine'], queryFn: fetchMyStatuses, enabled, staleTime: 15000 });
  const feedQuery = useQuery({ queryKey: ['statuses', 'feed'], queryFn: () => fetchStatusFeed(), enabled, staleTime: 15000 });
  const feed = feedQuery.data ?? [];
  const visibleFeed = useMemo(() => feed.filter(group => Number(group.user.id) !== Number(user?.user_id)), [feed, user?.user_id]);

  const myGroup = useMemo<StatusFeedGroup | null>(() => {
    const mine = mineQuery.data ?? [];
    return mine.length
      ? { user: mine[0].user, has_unviewed: false, statuses: mine }
      : null;
  }, [mineQuery.data]);
  const refresh = useCallback(() => { queryClient.invalidateQueries({ queryKey: ['statuses'] }); }, []);
  const finishViewer = useCallback(() => {
    if (!activeGroup) { setActiveGroup(null); refresh(); return; }
    if (viewingOwn) {
      if (visibleFeed[0]) { setViewingOwn(false); setActiveGroup(visibleFeed[0]); }
      else { setActiveGroup(null); refresh(); }
      return;
    }
    const currentIndex = visibleFeed.findIndex(group => Number(group.user.id) === Number(activeGroup.user.id));
    const followingGroup = visibleFeed[currentIndex + 1];
    if (followingGroup) setActiveGroup(followingGroup);
    else { setActiveGroup(null); refresh(); }
  }, [activeGroup, refresh, viewingOwn, visibleFeed]);

  if (!isAuthenticated) return null;
  return (
    <View style={styles.tray}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayContent}>
        <View style={styles.storyItem}>
          <Pressable onPress={() => myGroup ? (setViewingOwn(true), setActiveGroup(myGroup)) : setComposerVisible(true)} onLongPress={() => setComposerVisible(true)} style={[styles.storyRing, myGroup && styles.storyRingActive]}>
            <Avatar uri={myGroup?.user.image_url} name={user?.name} />
            <Pressable onPress={() => setComposerVisible(true)} style={styles.addBadge}><MaterialCommunityIcons name="plus" color="#FFF" size={16} /></Pressable>
          </Pressable>
          <Text numberOfLines={1} style={[styles.storyName, { color: '#FFFFFF' }]}>My status</Text>
        </View>
        {visibleFeed.map(group => (
          <Pressable key={group.user.id} style={styles.storyItem} onPress={() => { setViewingOwn(false); setActiveGroup(group); }}>
            <View style={[styles.storyRing, group.has_unviewed ? styles.storyRingActive : styles.storyRingViewed]}><Avatar uri={group.user.image_url} name={group.user.name} /></View>
            <Text numberOfLines={1} style={[styles.storyName, { color: '#FFFFFF' }]}>{group.user.name || 'User'}</Text>
          </Pressable>
        ))}
        {(mineQuery.isFetching || feedQuery.isFetching) && <ActivityIndicator size="small" color="#A5B4FC" />}
      </ScrollView>
      <StatusComposer visible={composerVisible} onClose={() => setComposerVisible(false)} onCreated={refresh} />
      <StatusViewerModal group={activeGroup} own={viewingOwn} visible={!!activeGroup} onClose={() => { setActiveGroup(null); refresh(); }} onFinished={finishViewer} onChanged={refresh} />
    </View>
  );
}

export default memo(StatusTray);

const styles = StyleSheet.create({
  tray: { marginTop: 8, marginBottom: 6 },
  trayContent: { paddingHorizontal: 0, gap: 16, alignItems: 'center' }, storyItem: { width: 64, alignItems: 'center' },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 3, borderWidth: 2, borderColor: '#D4D4D8' }, storyRingActive: { borderColor: '#7C3AED' }, storyRingViewed: { borderColor: '#A1A1AA' },
  storyName: { fontSize: 11, marginTop: 5, width: 64, textAlign: 'center' }, addBadge: { position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarFallback: { backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' }, avatarInitial: { color: '#FFF', fontWeight: '800' },
  composer: { flex: 1 }, composerHeader: { height: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, composerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' }, composerBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusInput: { width: '88%', color: '#FFF', fontSize: 30, lineHeight: 40, fontWeight: '700', maxHeight: '70%' }, composerImage: { width: '100%', height: '100%' }, videoSelected: { alignItems: 'center', padding: 24 }, videoSelectedText: { color: '#FFF', marginTop: 14, fontSize: 16, fontWeight: '600', textAlign: 'center' }, videoHint: { color: '#A1A1AA', marginTop: 7 },
  colorRow: { paddingHorizontal: 18, gap: 12, paddingVertical: 12 }, colorDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,.5)' }, colorDotSelected: { borderWidth: 4, borderColor: '#FFF' }, captionInput: { marginHorizontal: 18, marginBottom: 10, borderRadius: 20, paddingHorizontal: 16, color: '#FFF', backgroundColor: '#27272A' }, publishButton: { alignSelf: 'flex-end', margin: 18, borderRadius: 24, minWidth: 116, height: 48, paddingHorizontal: 20, backgroundColor: '#7C3AED', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, publishText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  audienceButton: { position: 'absolute', left: 18, bottom: 18, minHeight: 48, maxWidth: '58%', paddingHorizontal: 14, borderRadius: 24, backgroundColor: 'rgba(39,39,42,.92)', flexDirection: 'row', alignItems: 'center', gap: 7 }, audienceButtonText: { color: '#FFF', fontWeight: '700', flexShrink: 1 },
  audienceBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.55)' }, audienceSheet: { maxHeight: '82%', padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFF' }, audienceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, audienceTitle: { color: '#18181B', fontSize: 20, fontWeight: '800' }, audienceOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E4E4E7' }, audienceOptionText: { color: '#27272A', fontSize: 15, fontWeight: '600' }, audienceList: { maxHeight: 270, marginTop: 8, borderRadius: 12, backgroundColor: '#F4F4F5' }, audienceRow: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D4D4D8' }, audienceRowText: { color: '#18181B', fontWeight: '600' }, audiencePerson: { flex: 1 }, audienceCompanyText: { color: '#71717A', fontSize: 11, marginTop: 2 }, audienceError: { color: '#B91C1C', padding: 14, textAlign: 'center' }, audienceDone: { height: 48, marginTop: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED' }, audienceDoneText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  viewer: { flex: 1 }, viewerSafe: { flex: 1 }, progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingTop: 8 }, progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.35)', overflow: 'hidden' }, progressFill: { height: 3, backgroundColor: '#FFF' }, viewerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 }, viewerIdentity: { flex: 1 }, viewerHeaderName: { color: '#FFF', fontWeight: '700', fontSize: 15 }, viewerHeaderTime: { color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 2 },
  statusStage: { flex: 1, alignItems: 'center', justifyContent: 'center' }, viewerText: { color: '#FFF', fontSize: 32, lineHeight: 42, fontWeight: '700', paddingHorizontal: 30, textAlign: 'center' }, viewerMedia: { width: '100%', height: '100%' }, viewerCaption: { position: 'absolute', bottom: 24, left: 18, right: 18, color: '#FFF', textAlign: 'center', fontSize: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.55)' }, videoOpen: { alignItems: 'center' }, videoOpenText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 8 }, previousArea: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%' }, nextArea: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '32%' },
  videoTouchLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  viewsButton: { height: 52, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, viewsText: { color: '#FFF', fontWeight: '600' }, viewersSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', padding: 18, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }, sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D4D4D8', alignSelf: 'center', marginBottom: 12 }, viewersTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#18181B' }, viewerRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 9 }, viewerName: { color: '#18181B', fontWeight: '700' }, viewerTime: { color: '#71717A', fontSize: 11, marginTop: 3 }, emptyViewers: { color: '#71717A', textAlign: 'center', marginTop: 35 },
});
