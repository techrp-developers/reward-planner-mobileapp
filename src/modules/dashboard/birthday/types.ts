export interface BirthdayEmployee {
  id: string | number;
  name: string;
  designation: string;
  department: string;
  photo?: string | null;
  message?: string | null;
  isSelf?: boolean;
  wished?: boolean;
}

export interface BirthdayWishesReceived {
  count: number;
  // Most recent senders first, at most 3
  senders: string[];
}

export interface BirthdayAPIResponse {
  success: boolean;
  data: BirthdayEmployee[];
}
