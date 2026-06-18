import axios from "axios";
import { getToken } from "../auth/auth";

const api = axios.create({
  baseURL: "https://smart-voice-customer-feedback-production.up.railway.app",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
