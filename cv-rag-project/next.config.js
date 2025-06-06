/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint warnings during build
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    // Your webpack configuration here
    return config;
  },
  // Other Next.js configuration options
};

module.exports = nextConfig;
