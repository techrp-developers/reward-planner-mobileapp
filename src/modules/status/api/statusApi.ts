import api from '../../common/auth/api/axios';
import type {
  StatusFeedGroup,
  StatusMediaInput,
  StatusType,
  StatusVisibility,
  StatusAudienceCompany,
  StatusAudiencePerson,
  StatusViewer,
  StatusComment,
  UserStatus,
} from '../types';

type DataResponse<T> = { success: boolean; data: T; message?: string };

export type StatusViewResult = {
  id: number;
  viewed: boolean;
  view_count: number;
};

export type StatusViewersResult = {
  viewers: StatusViewer[];
  viewCount: number;
};

export type StatusLikeResult = {
  liked: boolean;
  like_count: number;
};

export type StatusCommentsResult = {
  comments: StatusComment[];
  nextBeforeId: number | null;
};

export async function fetchMyStatuses() {
  const response = await api.get<DataResponse<UserStatus[]>>('/v1/status/mine');
  return response.data.data ?? [];
}

export async function fetchStatusFeed(userIds?: number[]) {
  const response = await api.get<DataResponse<StatusFeedGroup[]>>('/v1/status/feed', {
    params: userIds?.length ? { user_ids: userIds.join(',') } : undefined,
  });
  return response.data.data ?? [];
}

export async function createStatus(input: {
  type: StatusType;
  text?: string;
  backgroundColor?: string;
  fontStyle?: string;
  media?: StatusMediaInput;
  visibility: StatusVisibility;
  excludedCompanyIds?: number[];
  allowedUserIds?: number[];
}) {
  const form = new FormData();
  form.append('type', input.type);
  if (input.text?.trim()) form.append('text', input.text.trim());
  if (input.backgroundColor) form.append('background_color', input.backgroundColor);
  if (input.fontStyle) form.append('font_style', input.fontStyle);
  form.append('visibility', input.visibility);
  form.append('excluded_company_ids', JSON.stringify(input.excludedCompanyIds ?? []));
  form.append('allowed_user_ids', JSON.stringify(input.allowedUserIds ?? []));
  if (input.media) {
    // React Native's multipart implementation expects uploaded files to use
    // `name`. ImagePicker calls the same value `fileName`; appending its asset
    // object directly makes Multer receive `media` as a normal text field.
    form.append('media', {
      uri: input.media.uri,
      type: input.media.type,
      name: input.media.fileName,
    } as any);
  }

  const response = await api.post<DataResponse<UserStatus>>('/v1/status', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data.data;
}

export async function fetchStatusAudienceOptions(search?: string) {
  const response = await api.get<DataResponse<{
    companies: StatusAudienceCompany[];
    people: StatusAudiencePerson[];
  }>>('/v1/status/audience-options', { params: search ? { q: search } : undefined });
  return response.data.data;
}

export async function markStatusViewed(statusId: number) {
  const response = await api.post<DataResponse<StatusViewResult>>(`/v1/status/${statusId}/view`);
  return response.data.data;
}

export async function fetchStatusViewers(statusId: number): Promise<StatusViewersResult> {
  const response = await api.get<DataResponse<StatusViewer[]> & { view_count?: number }>(
    `/v1/status/${statusId}/views`,
  );
  const viewers = response.data.data ?? [];
  return {
    viewers,
    viewCount: Number(response.data.view_count ?? viewers.length),
  };
}

export async function deleteStatus(statusId: number) {
  await api.delete(`/v1/status/${statusId}`);
}

export async function toggleStatusLike(statusId: number) {
  const response = await api.post<DataResponse<StatusLikeResult>>(`/v1/status/${statusId}/like`);
  return response.data.data;
}

export async function fetchStatusComments(
  statusId: number,
  beforeId?: number | null,
): Promise<StatusCommentsResult> {
  const response = await api.get<DataResponse<StatusComment[]> & {
    pagination?: { next_before_id?: number | null };
  }>(`/v1/status/${statusId}/comments`, {
    params: { limit: 50, ...(beforeId ? { before_id: beforeId } : {}) },
  });
  return {
    comments: response.data.data ?? [],
    nextBeforeId: response.data.pagination?.next_before_id ?? null,
  };
}

export async function addStatusComment(statusId: number, text: string) {
  const response = await api.post<DataResponse<StatusComment>>(
    `/v1/status/${statusId}/comments`,
    { text },
  );
  return response.data.data;
}

export async function deleteStatusComment(statusId: number, commentId: number) {
  await api.delete(`/v1/status/${statusId}/comments/${commentId}`);
}
