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

// --- Expired / invalid session handling -------------------------------------
// The sign-out itself (clear cache, navigate) lives in lib/session.ts, which
// registers here. Keeping it as a registered handler avoids a circular import
// between this module and the router / React Query client.

type UnauthorizedHandler = () => Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let signingOut = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

const AUTH_ROUTES = ["/auth/login", "/auth/register"];

function isAuthRoute(url: string | undefined) {
  return !!url && AUTH_ROUTES.some((route) => url.endsWith(route));
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  // Only a real 401 from the API counts. Network errors (offline, API down)
  // have no response and must never sign the user out.
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    const { config } = error;
    const sentAuth = config?.headers?.Authorization;
    if (!signingOut && unauthorizedHandler && !isAuthRoute(config?.url) && sentAuth) {
      // Only sign out if the token that was rejected is still the stored one.
      // Requests still in flight with an old token (after a sign-out or a fresh
      // login) then can't trigger a second sign-out.
      const current = await TOKEN.get();
      if (!signingOut && current && sentAuth === `Bearer ${current}`) {
        signingOut = true;
        try {
          await unauthorizedHandler();
        } finally {
          signingOut = false;
        }
      }
    }
  }
  return Promise.reject(error);
});
