/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/graph-api/:path*",
        destination: `${process.env.GRAPH_API_INTERNAL_URL || "http://127.0.0.1:8003"}/:path*`,
      },
    ]
  },
}

export default nextConfig
