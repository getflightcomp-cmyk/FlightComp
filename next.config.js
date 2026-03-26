/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow jsPDF to be used client-side only (it references browser globals)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas'];
    }
    return config;
  },
};

module.exports = nextConfig;
