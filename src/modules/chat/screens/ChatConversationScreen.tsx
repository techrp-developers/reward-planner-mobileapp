import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import { fetchMessages, markConversationRead, sendTextMessage } from '../api/chatApi';
import ChatAvatar from '../components/ChatAvatar';
import { chatError, chatTime, conversationTitle, otherMember } from '../utils';
import { chatSocket } from '../services/chatSocket';
import type { ChatMessage, ChatStackParamList } from '../types';

type Route = NativeStackScreenProps<ChatStackParamList, 'ChatConversation'>['route'];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function ChatConversationScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const conversation = params.conversation;
  const { user, accessToken } = useAuth();
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const title = conversationTitle(conversation, user?.user_id);
  const peer = otherMember(conversation, user?.user_id);

  const markLatestRead = useCallback((list: ChatMessage[]) => {
    const latest = [...list].reverse().find(item => Number(item.sender_id) !== Number(user?.user_id));
    if (latest) markConversationRead(conversation.conversation_id, latest.message_id).catch(() => {});
  }, [conversation.conversation_id, user?.user_id]);

  useEffect(() => {
    let active = true;
    fetchMessages(conversation.conversation_id).then(data => { if (active) { setMessages(data); markLatestRead(data); } }).catch(error => Alert.alert('Messages unavailable', chatError(error, 'Unable to load messages.'))).finally(() => active && setLoading(false));
    if (accessToken) chatSocket.connect(accessToken);
    const unsubscribe = chatSocket.subscribe(event => {
      const eventConversationId = Number(event.data?.conversation_id);
      if (eventConversationId !== Number(conversation.conversation_id)) return;
      if (event.type === 'message:new') setMessages(current => { if (current.some(item => item.message_id === event.data.message_id)) return current; const next = [...current, event.data]; markLatestRead(next); return next; });
      if ((event.type === 'typing:start' || event.type === 'typing:stop') && Number(event.data?.user_id) !== Number(user?.user_id)) setTyping(event.type === 'typing:start');
      if (event.type === 'presence' && Number(event.data?.user_id) === Number(peer?.user_id)) setOnline(Boolean(event.data.online));
    });
    return () => { active = false; unsubscribe(); if (typingTimer.current) clearTimeout(typingTimer.current); chatSocket.send('typing:stop', conversation.conversation_id); };
  }, [accessToken, conversation.conversation_id, markLatestRead, peer?.user_id, user?.user_id]);

  const onChangeText = (value: string) => {
    setText(value);
    chatSocket.send('typing:start', conversation.conversation_id);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => chatSocket.send('typing:stop', conversation.conversation_id), 1200);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText(''); setSending(true); chatSocket.send('typing:stop', conversation.conversation_id);
    try {
      const id = `${user?.user_id || 'user'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const message = await sendTextMessage(conversation.conversation_id, body, id);
      setMessages(current => current.some(item => item.message_id === message.message_id) ? current : [...current, message]);
    } catch (error) { setText(body); Alert.alert('Message not sent', chatError(error, 'Please try again.')); }
    finally { setSending(false); }
  };

  return <KeyboardAvoidingView style={[styles.screen, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.header, { paddingTop: insets.top + 7, borderBottomColor: theme.border, backgroundColor: theme.card }]}><TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={25} color={theme.text} /></TouchableOpacity><ChatAvatar name={title} uri={conversation.type === 'direct' ? peer?.user_image : undefined} size={42} online={online} /><View style={styles.headerText}><Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text><Text style={[styles.status, { color: typing || online ? '#22C55E' : theme.secondaryText }]}>{typing ? 'typing…' : online ? 'online' : conversation.type === 'group' ? `${conversation.members.length} members` : 'company chat'}</Text></View></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={theme.primary} /></View> : <FlatList ref={listRef} data={messages} keyExtractor={item => String(item.message_id || item.client_message_id)} contentContainerStyle={styles.messages} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} renderItem={({ item, index }) => {
      const mine = Number(item.sender_id) === Number(user?.user_id); const showName = conversation.type === 'group' && !mine && messages[index - 1]?.sender_id !== item.sender_id;
      return <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirWrap]}>{showName ? <Text style={[styles.sender, { color: theme.primary }]}>{item.sender_name}</Text> : null}<View style={[styles.bubble, mine ? styles.mine : { backgroundColor: isDark ? '#27272A' : '#F3F4F6' }]}><Text style={[styles.messageText, { color: mine ? '#FFFFFF' : theme.text }]}>{item.deleted_at ? 'This message was deleted' : item.body}</Text><Text style={[styles.messageTime, { color: mine ? 'rgba(255,255,255,.72)' : theme.secondaryText }]}>{chatTime(item.created_at)}</Text></View></View>;
    }} ListEmptyComponent={<View style={styles.empty}><MaterialCommunityIcons name="hand-wave-outline" size={32} color={theme.primary} /><Text style={[styles.emptyText, { color: theme.secondaryText }]}>Say hello to start the conversation</Text></View>} />}
    <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 9), borderTopColor: theme.border, backgroundColor: theme.card }]}><View style={[styles.composer, { backgroundColor: theme.background, borderColor: theme.border }]}><TextInput value={text} onChangeText={onChangeText} placeholder="Message" placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text }]} multiline maxLength={5000} /><TouchableOpacity onPress={send} disabled={!text.trim() || sending} style={[styles.send, { backgroundColor: text.trim() ? theme.primary : theme.border }]}>{sending ? <ActivityIndicator size="small" color="#FFF" /> : <MaterialCommunityIcons name="send" size={20} color="#FFF" />}</TouchableOpacity></View></View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth }, back: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1, marginLeft: 10 }, title: { fontSize: 16, fontWeight: '800' }, status: { fontSize: 11, marginTop: 2 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, messages: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 13, paddingVertical: 16 }, bubbleWrap: { maxWidth: '84%', marginVertical: 3 }, mineWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' }, theirWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' }, sender: { fontSize: 11, fontWeight: '700', marginLeft: 9, marginBottom: 2 }, bubble: { borderRadius: 18, paddingHorizontal: 13, paddingTop: 9, paddingBottom: 6 }, mine: { backgroundColor: '#7C3AED', borderBottomRightRadius: 5 }, messageText: { fontSize: 15, lineHeight: 20 }, messageTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 3 }, empty: { alignItems: 'center', paddingBottom: 120 }, emptyText: { marginTop: 10 }, composerWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingTop: 8 }, composer: { minHeight: 48, maxHeight: 120, borderWidth: 1, borderRadius: 25, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 16, paddingRight: 5, paddingVertical: 4 }, input: { flex: 1, maxHeight: 105, paddingVertical: 8, fontSize: 15 }, send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
