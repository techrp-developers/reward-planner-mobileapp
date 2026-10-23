import axios from 'axios';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';
import { API_V1_URL } from '../../../config/apiConfig';
import type { BirthdayWishesReceived } from './types';

export interface SendBirthdayWishResponse {
  success: boolean;
  data: {
    message_id: number;
    conversation_id: number;
    body: string;
  };
}

// Posts a birthday wish straight into the direct chat with the employee.
// The server allows one wish per recipient per day, so retries are safe.
export const sendBirthdayWish = async (employeeId: string | number) => {
  const headers = await getAuthHeaders();
  const res = await axios.post<SendBirthdayWishResponse>(
    `${API_V1_URL}/chat/birthday-wishes`,
    { employee_id: employeeId },
    { headers },
  );
  return res.data;
};

// Wishes the logged-in user received today; polled by the dashboard celebration.
export const fetchTodayBirthdayWishes = async (): Promise<BirthdayWishesReceived> => {
  const headers = await getAuthHeaders();
  const res = await axios.get<{ success: boolean; data: BirthdayWishesReceived }>(
    `${API_V1_URL}/auth/birthday-wishes/today`,
    { headers },
  );
  const data = res.data?.data;
  return {
    count: Number(data?.count) || 0,
    senders: Array.isArray(data?.senders) ? data.senders : [],
  };
};
