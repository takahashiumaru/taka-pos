/** @type {import('next').NextConfig} */
const nextConfig = {
  // Full Next.js app — renders pages AND exposes /api/* routes that
  // connect to MySQL via Prisma. Run with `npm run dev` or `npm start`.
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: {
    // We lint in CI; don't block builds on lint rules during next build.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
