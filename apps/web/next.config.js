/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // The on-disk dev cache grew stale across branches and took the machine
    // down with unbounded Turbopack memory; keep dev compiles in-memory only.
    turbopackFileSystemCacheForDev: false,
    // Hard ceiling (bytes) so Turbopack evicts instead of swapping the OS to death.
    turbopackMemoryLimit: 4 * 1024 ** 3,
  },
};

export default nextConfig;
