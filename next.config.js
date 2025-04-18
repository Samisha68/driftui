const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['rpc-websockets'],
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }

    // Force resolution of @solana/web3.js to the project's version
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/web3.js': path.resolve('./node_modules/@solana/web3.js'),
    };

    return config;
  },
};

module.exports = nextConfig; 