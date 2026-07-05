import axios from "axios";
import { authStore } from "./auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(undefined, (error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401 && typeof window !== "undefined") {
    const { pathname } = window.location;
    const onLogin = pathname === "/login" || pathname.startsWith("/login/");
    if (!onLogin) {
      authStore.clearToken();
      window.location.href = "/login";
    }
  }
  return Promise.reject(error);
});
