import type { NextConfig } from "next";

const remotePublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(remotePublicUrl
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(remotePublicUrl).hostname,
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "**.r2.dev",
      },
      {
        protocol: "https" as const,
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
  compress: true,
};

export default nextConfig;
