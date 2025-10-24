/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.theconversation.com',
      'global.ariseplay.com',
      'newmail-ng.com',
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;