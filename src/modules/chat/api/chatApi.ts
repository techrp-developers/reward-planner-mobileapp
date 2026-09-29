import api from '../../common/auth/api/axios';
import { CHAT_API_BASE_URL } from '../../../config/apiConfig';
import type { ChatConversation, ChatMessage, ChatPresence, ChatUser } from '../types';

type DataResponse<T> = { success: boolean; data: T; message?: string };
const chatUrl = (path: string) => `${CHAT_API_BASE_URL}/v1/chat${path}`;

export async function fetchChatUsers(search = ''): Promise<ChatUser[]> {
  const response = await api.get<DataResponse<ChatUser[]>>(chatUrl('/users'), {
    params: search ? { search } : undefined,
  });
  return response.data.data ?? [];
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  const response = await api.get<DataResponse<ChatConversation[]>>(chatUrl('/conversations'));
  return response.data.data ?? [];
}

export async function fetchChatPresence(userIds: number[]): Promise<ChatPresence[]> {
  if (!userIds.length) return [];
  const response = await api.get<DataResponse<ChatPresence[]>>(chatUrl('/presence'), {
    params: { user_ids: userIds.join(',') },
  });
  return response.data.data ?? [];
}

export type UploadedChatImage = {
  attachment_url: string;
  attachment_name: string;
  attachment_mime_type: string;
  size: number;
};

export async function uploadChatImage(asset: { uri: string; type?: string; fileName?: string }): Promise<UploadedChatImage> {
  const form = new FormData();
  form.append('image', {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `chat-${Date.now()}.jpg`,
  } as any);
  const response = await api.post<DataResponse<UploadedChatImage>>(chatUrl('/uploads/images'), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data.data;
}

export async function createConversation(memberIds: number[], name?: string): Promise<number> {
  const type = memberIds.length === 1 && !name ? 'direct' : 'group';
  const response = await api.post<DataResponse<{ conversation_id: number }>>(chatUrl('/conversations'), {
    type,
    name: type === 'group' ? name?.trim() : undefined,
    member_ids: memberIds,
  });
  return response.data.data.conversation_id;
}

export async function fetchMessages(conversationId: number, beforeId?: number): Promise<ChatMessage[]> {
  const response = await api.get<DataResponse<ChatMessage[]>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    { params: { limit: 40, before_id: beforeId } },
  );
  return response.data.data ?? [];
}

export async function sendTextMessage(
  conversationId: number,
  body: string,
  clientMessageId: string,
  replyToMessageId?: number,
): Promise<ChatMessage> {
  const response = await api.post<DataResponse<ChatMessage>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    {
      message_type: 'text',
      body,
      client_message_id: clientMessageId,
      reply_to_message_id: replyToMessageId,
    },
  );
  return response.data.data;
}

export async function sendImageMessage(
  conversationId: number,
  upload: UploadedChatImage,
  clientMessageId: string,
): Promise<ChatMessage> {
  const response = await api.post<DataResponse<ChatMessage>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    {
      message_type: 'image',
      client_message_id: clientMessageId,
      attachment_url: upload.attachment_url,
      attachment_name: upload.attachment_name,
      attachment_mime_type: upload.attachment_mime_type,
    },
  );
  return response.data.data;
}

export async function markConversationRead(conversationId: number, messageId: number) {
  await api.post(chatUrl(`/conversations/${conversationId}/read`), { message_id: messageId });
}
