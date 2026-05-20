import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : undefined;

// Production images come from the project's own Supabase Storage bucket.
// In development we also allow a couple of public CDNs so the dev seed
// (packages/shared/seed/dev.sql) renders real images without needing the
// admin upload pipeline. These dev hosts are guarded on NODE_ENV so they
// don't widen the production whitelist.
const isDev = process.env.NODE_ENV !== "production";
const devImageHosts = isDev
  ? [
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      { protocol: "https" as const, hostname: "picsum.photos" },
    ]
  : [];

const nextConfig: NextConfig = {
  transpilePackages: ["@armal/shared"],
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      ...devImageHosts,
    ],
  },
};

export default nextConfig;
