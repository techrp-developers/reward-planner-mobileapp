import axios from 'axios';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';
import { API_V1_URL } from '../../../config/apiConfig';

export interface SendBirthdayWishResponse {
  success: boolean;
  alreadyWished?: boolean;
  message: string;
}

export const sendBirthdayWish = async (employeeId: string | number) => {
  const headers = await getAuthHeaders();
  const res = await axios.post<SendBirthdayWishResponse>(
    `${API_V1_URL}/auth/birthday-wish`,
    { employee_id: employeeId },
    { headers },
  );
  return res.data;
};
