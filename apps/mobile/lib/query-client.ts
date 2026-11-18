import { QueryClient } from '@tanstack/react-query';

// Single app-wide client, so code outside React (e.g. the sign-out in
// lib/session.ts) can clear the cache.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});
