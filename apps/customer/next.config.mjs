/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship plain TSX/TS source (not pre-compiled), so
  // Next's SWC compiler needs to be told to transpile them like first-party
  // code.
  transpilePackages: ['@arghya/ui', '@arghya/api-client', '@arghya/utils'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Every local import uses the TS "bundler" moduleResolution convention
  // (`'./foo.js'` resolving to `foo.ts`/`foo.tsx`, the way `tsc` itself
  // resolves it) — Webpack doesn't do that mapping unless told to.
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
