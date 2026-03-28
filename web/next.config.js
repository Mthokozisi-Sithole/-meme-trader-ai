/** @type {import('next').NextConfig} */
const INTERNAL_API = process.env.INTERNAL_API_URL || "http://api:8000";

const nextConfig = {
  output: "standalone",
  // Prevent Next.js from stripping trailing slashes before rewrite fires.
  // FastAPI uses trailing slashes and redirects without-slash → 307 (internal URL).
  // Proxy all /api/* calls to the backend — browser only ever talks to :3000
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${INTERNAL_API}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
