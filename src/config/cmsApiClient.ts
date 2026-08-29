import axios from "axios";
import { CMS_API_BASE_URL } from "./apiConfig";

// Shared client for CMS-resolved content endpoints (navbar background,
// promotional banner, offers banner, module icons). Always points at
// CMS_API_BASE_URL (the local CMS preview server), independent of whether
// the rest of the app is pointed at live or local via API_ENVIRONMENT.
export const cmsApi = axios.create({
  baseURL: CMS_API_BASE_URL,
  timeout: 20000,
});
