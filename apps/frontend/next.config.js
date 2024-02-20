/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    
  }
}

if (process && process.env.NODE_ENV !== 'development') {
  nextConfig.images = { unoptimized: true }
}

module.exports = nextConfig
