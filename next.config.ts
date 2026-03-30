import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.aifx.kr" }],
        destination: "https://aifx.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
