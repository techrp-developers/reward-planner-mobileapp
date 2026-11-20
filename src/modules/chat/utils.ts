import { normalizeLocalCmsImageUrl } from '../../config/apiConfig';
import type { ChatConversation, ChatMember } from './types';
import i18n from '../../i18n';
import { formatDisplayTime, getAppLocale } from '../../i18n/format';

export const chatImageUrl = (value?: string | null) => normalizeLocalCmsImageUrl(value) ?? undefined;

export function otherMember(conversation: ChatConversation, currentUserId?: number): ChatMember | undefined {
  return conversation.members.find(member => Number(member.user_id) !== Number(currentUserId));
}

export function conversationTitle(conversation: ChatConversation, currentUserId?: number, language?: string) {
  return conversation.type === 'group'
    ? conversation.name || i18n.t('chat:groupChat', { lng: language })
    : otherMember(conversation, currentUserId)?.name || i18n.t('common:chat', { lng: language });
}

export function initials(name?: string | null) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export function chatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return formatDisplayTime(date, { hour: '2-digit' });
  }
  return date.toLocaleDateString(getAppLocale(), { day: '2-digit', month: 'short' });
}

// WhatsApp-style status: "last seen today at 4:05 pm", "yesterday at …", "on 12 Oct at …".
export function lastSeenLabel(value?: string | null) {
  if (!value) return i18n.t('chat:presenceUnavailable');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return i18n.t('chat:presenceUnavailable');
  const time = formatDisplayTime(date, { hour: '2-digit' });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return i18n.t('chat:lastSeenToday', { time });
  if (date.toDateString() === yesterday.toDateString()) return i18n.t('chat:lastSeenYesterday', { time });
  const day = date.toLocaleDateString(getAppLocale(), {
    day: '2-digit',
    month: 'short',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  });
  return i18n.t('chat:lastSeenDate', { date: day, time });
}

export function chatError(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}
