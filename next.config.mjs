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
  // Route the Data Cache (unstable_cache in server/lib/cache.ts) through a
  // PostgreSQL-backed handler so tag invalidation propagates across replicas
  // (see docs/multi-replica.md). cacheMaxMemorySize: 0 disables Next's own
  // per-instance in-memory cache in front of the handler — the handler keeps
  // its own bounded module-level L1 and Postgres is the shared source of truth.
  cacheHandler: new URL('./server/lib/pg-cache-handler.cjs', import.meta.url).pathname,
  cacheMaxMemorySize: 0,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Aligned with the preprocessing pipeline's variant tier ladder
    // (server/lib/image-variants.ts VARIANT_TIER_WIDTHS) so every width
    // next/image requests maps onto a width the pipeline actually generates.
    // imageSizes covers the small fixed-width tiers, deviceSizes the rest.
    imageSizes: [320, 480],
    deviceSizes: [640, 800, 1080, 1280, 1920, 2560],
    // PicImpact is a self-hosted photo portfolio where users configure their
    // own storage backends (S3, R2, Open List, etc.), so image domains
    // cannot be predicted at build time.
    //
    // SECURITY NOTE: Allowing any hostname is intentional for this use case.
    // For production deployments, consider restricting to trusted storage
    // domains via environment-driven configuration if your threat model requires it.
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
