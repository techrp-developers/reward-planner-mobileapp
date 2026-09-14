export type StatusType = 'text' | 'image' | 'video';

export type StatusUser = {
  id: number;
  name?: string | null;
  image_url?: string | null;
};

export type UserStatus = {
  id: number;
  user: StatusUser;
  type: StatusType;
  text?: string | null;
  background_color?: string | null;
  font_style?: string | null;
  media_url?: string | null;
  media_mime_type?: string | null;
  duration_seconds?: number | null;
  viewed?: boolean;
  view_count?: number;
  created_at: string;
  expires_at: string;
};

export type StatusFeedGroup = {
  user: StatusUser;
  has_unviewed: boolean;
  statuses: UserStatus[];
};

export type StatusViewer = {
  user_id: number;
  name?: string | null;
  image_url?: string | null;
  viewed_at: string;
};

export type StatusMediaInput = {
  uri: string;
  type: string;
  fileName: string;
};
