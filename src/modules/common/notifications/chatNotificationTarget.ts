import { fetchConversations } from "../../chat/api/chatApi";
import type { ChatConversation } from "../../chat/types";

const LOOKUP_TIMEOUT_MS = 5000;

// Resolves a pushed conversation id to the full object ChatConversation needs.
// Only the signed-in user's own list (scoped by the backend) is searched, so a
// push can never open a thread the user is not a member of.
export const findOwnConversation = async (
  conversationId: number,
): Promise<ChatConversation | null> => {
  try {
    const conversations = await Promise.race([
      fetchConversations(),
      new Promise<ChatConversation[]>(resolve => setTimeout(() => resolve([]), LOOKUP_TIMEOUT_MS)),
    ]);
    return conversations.find(c => c.conversation_id === conversationId) ?? null;
  } catch {
    return null;
  }
};

type Navigate = (route: string, params?: Record<string, unknown>) => void;

// Called after the Chat inbox is already open, so a slow or failed lookup
// simply leaves the user on the inbox.
export const openConversationIfOwned = async (
  conversationId: number,
  navigate: Navigate,
  isStillRelevant: () => boolean = () => true,
) => {
  const conversation = await findOwnConversation(conversationId);
  if (!conversation || !isStillRelevant()) return false;
  navigate("Chat", { screen: "ChatConversation", params: { conversation } });
  return true;
};
