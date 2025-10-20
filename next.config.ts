/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.theconversation.com',
      'global.ariseplay.com',
      'newmail-ng.com', // Add the new hostname
    ],
  },
  webpack(config) {
    // Add alias for `@` to map to the `src` directory
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    
    return config;
  }
};

module.exports = nextConfig;
