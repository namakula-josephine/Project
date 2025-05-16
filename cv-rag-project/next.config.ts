/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: import('webpack').Configuration, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Ensure externals is an array before pushing
      if (!Array.isArray(config.externals)) {
        config.externals = [];
      }

      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
