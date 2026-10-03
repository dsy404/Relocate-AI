import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/intro',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
