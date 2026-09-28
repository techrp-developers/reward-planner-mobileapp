import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

export const cmsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});
