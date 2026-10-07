import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Dev only. Keeps the Next.js "N" badge off the SkillFlow wordmark and the mobile menu button.
  devIndicators: { position: "bottom-right" },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "45mb",
    },
    // The signed-in proxy reads the body. Its default 10mb cap was cutting video uploads short.
    proxyClientMaxBodySize: "45mb",
  },
};

export default nextConfig;
