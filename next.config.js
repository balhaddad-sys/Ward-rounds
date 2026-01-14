/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Ensure the PWA works with your GitHub Pages subpath
  sw: '/Ward-rounds/sw.js', 
  publicExcludes: ['!nprogress/nprogress.css'],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-image-assets', expiration: { maxEntries: 64 } }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-assets', expiration: { maxEntries: 32 } }
    },
    {
      // Cache the Google Apps Script responses if needed, or use NetworkFirst
      urlPattern: /^https:\/\/script\.google\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-script-api',
        networkTimeoutSeconds: 15,
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 }
      }
    }
  ]
});

const nextConfig = {
  // Required for GitHub Pages Static Deployment
  output: 'export',
  distDir: 'docs',
  reactStrictMode: true,
  swcMinify: true,
  
  // Base path must match your GitHub repository name
  basePath: '/Ward-rounds',
  assetPrefix: '/Ward-rounds/',
  trailingSlash: true,

  images: {
    // Required for 'output: export' as Next.js Image Optimization needs a server
    unoptimized: true,
    domains: ['drive.google.com', 'lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp']
  },

  /* NOTE: 'async headers()' is removed because it is ignored by 'output: export'.
     To fix CORS with Google Apps Script, you must use 'Content-Type': 'text/plain' 
     in your frontend fetch calls.
  */

  webpack: (config, { isServer }) => {
    // Better-sqlite3 fix for static builds
    if (isServer) {
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3'
      });
    }
    return config;
  }
};

module.exports = withPWA(nextConfig);
