/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    serverActions: { bodySizeLimit: '2mb' }
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Disable static page generation completely
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

export default nextConfig
