/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.theconversation.com',
      'global.ariseplay.com',
      'newmail-ng.com', // Add the new hostname
    ],
  },
};

module.exports = nextConfig;