/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Your webpack configuration here
    return config;
  },
  // Other Next.js configuration options
};

module.exports = nextConfig;
