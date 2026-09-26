/** @type {import('next').NextConfig} */

const API_PROXY_TARGET = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

const configuredDomain = (process.env.DOMAIN_NAME || process.env.NEXT_PUBLIC_DOMAIN_NAME || "").trim();

const remotePatterns = [
  // Local development
  { protocol: "http", hostname: "localhost" },
  { protocol: "https", hostname: "localhost" },
  { protocol: "http", hostname: "localhost", port: "8000" },
  { protocol: "http", hostname: "localhost", port: "3000" },
  { protocol: "http", hostname: "127.0.0.1" },
  { protocol: "https", hostname: "127.0.0.1" },
  { protocol: "http", hostname: "127.0.0.1", port: "8000" },
  { protocol: "http", hostname: "127.0.0.1", port: "3000" },
  { protocol: "http", hostname: "0.0.0.0" },
  { protocol: "https", hostname: "0.0.0.0" },

  // Placeholders & image stock
  { protocol: "https", hostname: "placehold.co" },
  { protocol: "http", hostname: "placehold.co" },
  { protocol: "https", hostname: "via.placeholder.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "plus.unsplash.com" },
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "fastly.picsum.photos" },
  { protocol: "https", hostname: "avatars.githubusercontent.com" },

  // Cloud object storage
  { protocol: "https", hostname: "storage.yandexcloud.net" },
  { protocol: "https", hostname: "**.storage.yandexcloud.net" },
  { protocol: "https", hostname: "s3.amazonaws.com" },
  { protocol: "https", hostname: "**.s3.amazonaws.com" },
  { protocol: "https", hostname: "**.s3.*.amazonaws.com" },

  // Production domains
  { protocol: "https", hostname: "eda-pobeda.ru" },
  { protocol: "https", hostname: "www.eda-pobeda.ru" },
  { protocol: "https", hostname: "api.eda-pobeda.ru" },
];

if (configuredDomain) {
  remotePatterns.push(
    { protocol: "https", hostname: configuredDomain },
    { protocol: "https", hostname: "www." + configuredDomain },
    { protocol: "http", hostname: configuredDomain }
  );
}

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
if (publicApiUrl) {
  try {
    const parsed = new URL(publicApiUrl);
    if (parsed.hostname && !remotePatterns.some((item) => item.hostname === parsed.hostname)) {
      remotePatterns.push({
        protocol: parsed.protocol.replace(":", "") || "https",
        hostname: parsed.hostname,
      });
      if (!parsed.hostname.startsWith("www.")) {
        remotePatterns.push({
          protocol: parsed.protocol.replace(":", "") || "https",
          hostname: "www." + parsed.hostname,
        });
      }
    }
  } catch {
  }
}

const nextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
