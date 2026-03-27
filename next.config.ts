const isProd = process.env.NODE_ENV === 'production';
const repoName = 'FaithCore';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Si el repositorio se llama 'faithcore', el basePath será /faithcore
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}` : '',
};

module.exports = nextConfig;