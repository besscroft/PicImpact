import createNextIntlPlugin from 'next-intl/plugin'
import bundleAnalyzer from '@next/bundle-analyzer'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
let nextConfig = {
  output: "standalone",
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
};

if (process.env.ANALYZE === 'true') {
  nextConfig = bundleAnalyzer({
    enabled: true,
  })(nextConfig)
}

export default withNextIntl(nextConfig);
