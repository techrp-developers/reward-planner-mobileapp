import axios from 'axios';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';
import { API_V1_URL } from '../../../config/apiConfig';

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
