import createNextIntlPlugin from 'next-intl/plugin'
import bundleAnalyzer from '@next/bundle-analyzer'
import withPWA from 'next-pwa'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
let nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  serverExternalPackages: ['pg'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Intentionally permissive: PicImpact is a self-hosted photo portfolio
    // where users configure their own storage backends (S3, R2, etc.), so
    // we cannot predict which image domains will be used at build time.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

if (process.env.ANALYZE === 'true') {
  nextConfig = bundleAnalyzer({
    enabled: true,
  })(nextConfig)
}

// 添加 PWA 配置
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})(nextConfig)

export default withNextIntl(pwaConfig)
