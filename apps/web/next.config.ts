import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js/Webpack to transpile workspace packages (TypeScript source,
  // not pre-compiled dist) so they aren't treated as opaque node_modules.
  transpilePackages: ["@chainwork/shared", "@chainwork/firebase-client", "@chainwork/core"],

  // Acknowledges that Turbopack is the active build runtime so Next.js
  // doesn't warn when a webpack() callback is also present.
  turbopack: {},

  // Allow Cloudinary CDN + legacy Firebase Storage URLs (for gigs created
  // before the Cloudinary migration).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  // Project lives on an exFAT volume which doesn't support symlinks/junctions.
  // These webpack settings keep webpack happy when --webpack is used.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.symlinks = false;
    config.cache = false;
    config.snapshot = {
      ...(config.snapshot ?? {}),
      managedPaths: [],
      immutablePaths: [],
    };
    return config;
  },
};

export default nextConfig;
