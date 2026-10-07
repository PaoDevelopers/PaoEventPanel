import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log out if the rejected token is still the current one, so a late 401 for an old token can't end a newer session
    const sentAuth = error.config?.headers?.Authorization;
    const currentToken = localStorage.getItem("token");
    if (error.response?.status === 401 && currentToken && sentAuth === `Bearer ${currentToken}`) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
