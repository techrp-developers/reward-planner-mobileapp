import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import { fetchConversations } from '../api/chatApi';
import ChatAvatar from '../components/ChatAvatar';
import { chatError, chatTime, conversationTitle, otherMember } from '../utils';
import type { ChatConversation, ChatStackParamList } from '../types';
import { chatSocket } from '../services/chatSocket';
import BottomTabs, { TAB_BAR_HEIGHT, type TabKey } from '../../../bottombar/BottomTabs';

type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function ChatInboxScreen() {
  const { t: translateUi, i18n } = useTranslation(['common', 'chat']);
  const language = i18n.language;
  const navigation = useNavigation<Navigation>();
  const { user, accessToken } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  // Bumped on presence changes so rows re-read chatSocket.isUserOnline().
  const [presenceVersion, setPresenceVersion] = useState(0);
  const appNavigation = navigation.getParent<any>();
  const handleFooterPress = (tab: TabKey) => {
    if (tab === 'Notes') appNavigation?.navigate('TodoList');
  };

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try { setItems(await fetchConversations()); setError(''); }
    catch (e) { setError(chatError(e, 'Unable to load conversations.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Fallback while the socket is unavailable: poll the list while it is on screen.
    const poll = setInterval(() => {
      if (!chatSocket.isConnected()) load(true);
    }, 10000);
    return () => clearInterval(poll);
  }, [load]));
  useEffect(() => {
    if (accessToken) chatSocket.connect(accessToken);
    return chatSocket.subscribe(event => {
      if (event.type === 'connected' || event.type === 'presence' || event.type === 'disconnected') {
        setPresenceVersion(version => version + 1);
        return;
      }
      if (event.type === 'conversation:theme') {
        setItems(current => current.map(item => Number(item.conversation_id) === Number(event.data?.conversation_id) ? { ...item, theme_key: event.data.theme_key } : item));
        return;
      }
      if (event.type === 'conversation:updated') {
        setItems(current => current.map(item => Number(item.conversation_id) === Number(event.data?.conversation_id) ? { ...item, image_url: event.data.image_url } : item));
        return;
      }
      if (event.type === 'message:new' || event.type === 'message:deleted' || event.type === 'conversation:available' || event.type === 'resync') load(true);
    });
  }, [accessToken, load]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter(conversation => {
      const title = conversationTitle(conversation, user?.user_id);
      const memberNames = conversation.members.map(member => member.name).join(' ');
      return `${title} ${memberNames} ${conversation.description || ''}`.toLowerCase().includes(normalized);
    });
  }, [items, query, user?.user_id, language]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={translateUi('common:back')}
          onPress={() => (appNavigation?.canGoBack() ? appNavigation.goBack() : appNavigation?.navigate('Dashboard'))}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerText}><Text style={[styles.title, { color: theme.text }]}>{translateUi('chat:chats')}</Text><Text style={[styles.subtitle, { color: theme.secondaryText }]}>{translateUi('chat:companyConversations')}</Text></View>
      </View>
      <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="magnify" size={22} color={theme.secondaryText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={translateUi('chat:searchPeople')}
          placeholderTextColor={theme.secondaryText}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={translateUi('common:clearSearch')} onPress={() => setQuery('')} style={styles.clearSearch}><MaterialCommunityIcons name="close-circle" size={20} color={theme.secondaryText} /></TouchableOpacity> : null}
      </View>
      {loading && !items.length ? <View style={styles.center}><ActivityIndicator color={theme.primary} size="large" /></View> : null}
      {!loading && error && !items.length ? <View style={styles.center}><MaterialCommunityIcons name="message-alert-outline" size={42} color={theme.secondaryText} /><Text style={[styles.emptyTitle, { color: theme.text }]}>{translateUi('chat:loadFailed')}</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>{error}</Text><TouchableOpacity onPress={() => load()} style={styles.retry}><Text style={styles.retryText}>{translateUi('common:tryAgainSentence')}</Text></TouchableOpacity></View> : null}
      {!loading && !error && !items.length ? <View style={styles.center}><MaterialCommunityIcons name="message-text-outline" size={48} color={theme.primary} /><Text style={[styles.emptyTitle, { color: theme.text }]}>{translateUi('chat:startConversation')}</Text><Text style={[styles.emptyText, { color: theme.secondaryText }]}>{translateUi('chat:chatPrivately')}</Text></View> : null}
      <FlatList
        data={filteredItems}
        scrollEnabled
        showsVerticalScrollIndicator
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={9}
        removeClippedSubviews
        keyExtractor={item => String(item.conversation_id)}
        extraData={`${presenceVersion}:${language}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + 12 }]}
        renderItem={({ item }) => {
          const title = conversationTitle(item, user?.user_id);
          const member = otherMember(item, user?.user_id);
          const preview = item.last_message_type === 'image' ? translateUi('chat:photoPreview') : item.last_message_type === 'file' ? translateUi('chat:filePreview') : item.last_message || translateUi('common:noMessages');
          return <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]} onPress={() => navigation.navigate('ChatConversation', { conversation: item })}>
            <ChatAvatar name={title} uri={item.type === 'direct' ? member?.user_image : item.image_url} online={item.type === 'direct' && chatSocket.isUserOnline(member?.user_id)} />
            <View style={styles.rowBody}><View style={styles.rowTop}><Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>{title}</Text><Text style={[styles.time, { color: item.unread_count ? theme.primary : theme.secondaryText }]}>{chatTime(item.last_message_at || item.updated_at)}</Text></View><View style={styles.rowBottom}><Text numberOfLines={1} style={[styles.preview, { color: theme.secondaryText }, item.unread_count > 0 && { color: theme.text, fontWeight: '700' }]}>{preview}</Text>{item.unread_count > 0 ? <View style={[styles.badge, { backgroundColor: theme.primary }]}><Text style={styles.badgeText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text></View> : null}</View></View>
          </TouchableOpacity>;
        }}
        ListEmptyComponent={!loading && !error && items.length > 0 && query.trim() ? <View style={styles.searchEmpty}><MaterialCommunityIcons name="account-search-outline" size={38} color={theme.secondaryText} /><Text style={[styles.searchEmptyTitle, { color: theme.text }]}>{translateUi('chat:noChats')}</Text><Text style={[styles.searchEmptyText, { color: theme.secondaryText }]}>{translateUi('chat:searchAnother')}</Text></View> : null}
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={translateUi('chat:startChat')}
        onPress={() => navigation.navigate('NewChat')}
        style={[styles.newButton, { bottom: TAB_BAR_HEIGHT + 14 }]}
      >
        <MaterialCommunityIcons name="message-plus-outline" size={27} color="#FFFFFF" />
      </TouchableOpacity>
      <BottomTabs
        isDashboard
        activeTabKey="Chat"
        onTabPress={handleFooterPress}
        onCenterPress={() => appNavigation?.navigate('Dashboard')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1 },
  title: { fontSize: 30, fontWeight: '800' }, subtitle: { marginTop: 3, fontSize: 13 }, newButton: { position: 'absolute', right: 22, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', elevation: 10, shadowColor: '#4C1D95', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, zIndex: 10 },
  search: { marginHorizontal: 18, marginBottom: 8, height: 48, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, height: 46, paddingVertical: 0, fontSize: 15 },
  clearSearch: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchEmpty: { alignItems: 'center', paddingTop: 70 }, searchEmptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '800' }, searchEmptyText: { marginTop: 5, fontSize: 13 },
  list: { paddingHorizontal: 18, paddingBottom: 24 }, row: { flexDirection: 'row', gap: 13, alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth }, rowBody: { flex: 1 }, rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }, name: { flex: 1, fontSize: 16, fontWeight: '700' }, time: { fontSize: 11 }, preview: { flex: 1, fontSize: 13 }, badge: { minWidth: 21, height: 21, borderRadius: 11, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 38 }, emptyTitle: { marginTop: 14, fontSize: 19, fontWeight: '800' }, emptyText: { marginTop: 7, textAlign: 'center', lineHeight: 20 }, retry: { marginTop: 18, backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }, retryText: { color: '#FFF', fontWeight: '700' },
});
