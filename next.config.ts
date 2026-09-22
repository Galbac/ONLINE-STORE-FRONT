import type { NextConfig } from "next";

const API_PROXY_TARGET = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

const configuredDomain = (process.env.DOMAIN_NAME || process.env.NEXT_PUBLIC_DOMAIN_NAME || "").trim();
const remotePatterns: Array<{ protocol: "http" | "https"; hostname: string }> = [
  { protocol: "http", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "plus.unsplash.com" },
  { protocol: "https", hostname: "via.placeholder.com" },
  { protocol: "https", hostname: "*.storage.yandexcloud.net" },
  { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
];

if (configuredDomain) {
  remotePatterns.push(
    { protocol: "https", hostname: configuredDomain },
    { protocol: "https", hostname: "www." + configuredDomain }
  );
}

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
if (publicApiUrl) {
  try {
    const parsed = new URL(publicApiUrl);
    if (parsed.hostname && !remotePatterns.some((item) => item.hostname === parsed.hostname)) {
      remotePatterns.push({
        protocol: (parsed.protocol.replace(":", "") || "https") as "http" | "https",
        hostname: parsed.hostname,
      });
      if (!parsed.hostname.startsWith("www.")) {
        remotePatterns.push({
          protocol: (parsed.protocol.replace(":", "") || "https") as "http" | "https",
          hostname: "www." + parsed.hostname,
        });
      }
    }
  } catch {
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: API_PROXY_TARGET + "/api/:path*",
      },
      {
        source: "/health",
        destination: API_PROXY_TARGET + "/health",
      },
      {
        source: "/media/:path*",
        destination: API_PROXY_TARGET + "/media/:path*",
      },
    ];
  },
};

export default nextConfig;
