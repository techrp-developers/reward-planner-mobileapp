import api from '../../common/auth/api/axios';
import type {
  StatusFeedGroup,
  StatusMediaInput,
  StatusType,
  StatusVisibility,
  StatusAudienceCompany,
  StatusAudiencePerson,
  StatusViewer,
  UserStatus,
} from '../types';

type DataResponse<T> = { success: boolean; data: T; message?: string };

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
  await api.post(`/v1/status/${statusId}/view`);
}

export async function fetchStatusViewers(statusId: number) {
  const response = await api.get<DataResponse<StatusViewer[]>>(`/v1/status/${statusId}/views`);
  return response.data.data ?? [];
}

export async function deleteStatus(statusId: number) {
  await api.delete(`/v1/status/${statusId}`);
}
