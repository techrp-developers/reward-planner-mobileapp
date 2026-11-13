import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import ChatAvatar from '../components/ChatAvatar';
import { removeGroupImage, uploadGroupImage } from '../api/chatApi';
import { chatSocket } from '../services/chatSocket';
import { chatError } from '../utils';
import type { ChatMember, ChatStackParamList } from '../types';

type Route = NativeStackScreenProps<ChatStackParamList, 'GroupInfo'>['route'];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function GroupInfoScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const { conversation } = params;
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [imageUrl, setImageUrl] = useState(conversation.image_url || null);
  const [imageSaving, setImageSaving] = useState(false);

  useEffect(() => chatSocket.subscribe(event => {
    if (event.type === 'conversation:updated' && Number(event.data?.conversation_id) === Number(conversation.conversation_id)) {
      setImageUrl(event.data.image_url || null);
    }
  }), [conversation.conversation_id]);

  const pickGroupImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) return;
    setImageSaving(true);
    try {
      const updated = await uploadGroupImage(conversation.conversation_id, { uri: asset.uri, type: asset.type, fileName: asset.fileName });
      setImageUrl(updated.image_url);
    } catch (error) {
      Alert.alert('Photo not updated', chatError(error, 'Please try again.'));
    } finally {
      setImageSaving(false);
    }
  };

  const deleteGroupImage = async () => {
    setImageSaving(true);
    try {
      await removeGroupImage(conversation.conversation_id);
      setImageUrl(null);
    } catch (error) {
      Alert.alert('Photo not removed', chatError(error, 'Please try again.'));
    } finally {
      setImageSaving(false);
    }
  };

  const changeGroupImage = () => {
    if (imageSaving) return;
    Alert.alert('Group photo', undefined, [
      { text: 'Choose from gallery', onPress: () => { pickGroupImage(); } },
      ...(imageUrl ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => { deleteGroupImage(); } }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const members = useMemo(() => [...conversation.members].sort((left, right) => {
    const roleOrder = Number(right.role === 'admin') - Number(left.role === 'admin');
    return roleOrder || left.name.localeCompare(right.name);
  }), [conversation.members]);

  const renderMember = ({ item }: { item: ChatMember }) => {
    const isMe = Number(item.user_id) === Number(user?.user_id);
    const isAdmin = item.role === 'admin';
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}'s profile`}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MemberProfile', { member: item })}
        style={[styles.memberRow, { borderBottomColor: theme.border }]}
      >
        <ChatAvatar name={item.name} uri={item.user_image} size={48} />
        <View style={styles.memberText}>
          <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
            {item.name}{isMe ? ' (You)' : ''}
          </Text>
          <Text style={[styles.memberMeta, { color: theme.secondaryText }]} numberOfLines={1}>
            {[item.department, item.job_role].filter(Boolean).join(' · ') || 'Group member'}
          </Text>
        </View>
        {isAdmin ? <View style={[styles.adminBadge, { borderColor: theme.primary }]}><Text style={[styles.adminText, { color: theme.primary }]}>Group admin</Text></View> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 7, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Group info</Text>
      </View>
      <FlatList
        data={members}
        scrollEnabled
        showsVerticalScrollIndicator
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={9}
        removeClippedSubviews
        keyExtractor={item => String(item.user_id)}
        renderItem={renderMember}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.groupSummary}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Change group photo"
                activeOpacity={0.8}
                onPress={changeGroupImage}
                disabled={imageSaving}
              >
                <ChatAvatar name={conversation.name || 'Group'} uri={imageUrl} size={88} />
                {imageSaving ? (
                  <View style={styles.imageOverlay}><ActivityIndicator color="#FFF" /></View>
                ) : null}
                <View style={[styles.cameraBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
                  <MaterialCommunityIcons name="camera" size={15} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.groupName, { color: theme.text }]}>{conversation.name || 'Group chat'}</Text>
              <Text style={[styles.memberCount, { color: theme.secondaryText }]}>{members.length} members</Text>
              {conversation.description ? <Text style={[styles.description, { color: theme.secondaryText }]}>{conversation.description}</Text> : null}
            </View>
            <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{members.length} participants</Text>
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', marginLeft: 6 },
  content: { paddingBottom: 30 },
  groupSummary: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 44, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  groupName: { marginTop: 14, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  memberCount: { marginTop: 5, fontSize: 13 },
  description: { marginTop: 13, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  memberRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  memberText: { flex: 1, marginLeft: 13, marginRight: 8 },
  memberName: { fontSize: 15, fontWeight: '700' },
  memberMeta: { marginTop: 4, fontSize: 12 },
  adminBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 },
  adminText: { fontSize: 9, fontWeight: '800' },
});
