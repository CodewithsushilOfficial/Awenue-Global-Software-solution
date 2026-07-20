import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [40, 75, 80, 85, 90],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
  turbopack: {
    root: __dirname,
  },
  // Compression & performance
  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
