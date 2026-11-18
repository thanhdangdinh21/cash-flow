import { router } from 'expo-router';
import { setUnauthorizedHandler, TOKEN } from './api';
import { queryClient } from './query-client';

/** Clears the stored token and cached data, then goes to the login screen. */
export async function signOut({ expired = false }: { expired?: boolean } = {}) {
  await TOKEN.clear();
  queryClient.clear();
  router.replace(
    expired ? { pathname: '/(auth)/login', params: { expired: '1' } } : '/(auth)/login'
  );
}

/** Wire the API's 401 handling to sign-out. Call once at app start. */
export function registerSessionHandling() {
  setUnauthorizedHandler(() => signOut({ expired: true }));
}
