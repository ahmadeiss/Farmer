/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  i18n: {
    locales: ["ar"],
    defaultLocale: "ar",
  },

  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      { source: "/api/:path*",   destination: `${backend}/api/:path*` },
      { source: "/media/:path*", destination: `${backend}/media/:path*` },
    ];
  },

  // All headers merged into a single function (duplicate causes silent override)
  async headers() {
    return [
      {
        // Service Worker: no cache, correct MIME, full scope
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Long-lived cache for immutable static assets
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost",    port: "8000", pathname: "/media/**" },
      { protocol: "http",  hostname: "127.0.0.1",    port: "8000", pathname: "/media/**" },
      { protocol: "http",  hostname: "192.168.1.75", port: "8000", pathname: "/media/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      "@tanstack/react-query",
      "date-fns",
      "react-hot-toast",
      "qrcode.react",
    ],
  },
};

module.exports = nextConfig;
