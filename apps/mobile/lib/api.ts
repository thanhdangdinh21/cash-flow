import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "access_token";

export const TOKEN = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api",
});

api.interceptors.request.use(async (config) => {
  const token = await TOKEN.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
