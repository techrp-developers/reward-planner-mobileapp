// Login and user-info use userId; older responses use user_id.
export const normalizeAuthUser = (payload: any) => {
  const user = payload?.user || payload?.data?.user || payload?.data || null;
  if (!user) return null;
  const userId = Number(user.user_id ?? user.userId);
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;
  return { ...user, user_id: userId };
};
