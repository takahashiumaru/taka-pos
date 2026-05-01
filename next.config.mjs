/** @type {import('next').NextConfig} */
const nextConfig = {
  // Full Next.js app — renders pages AND exposes /api/* routes that
  // connect to MySQL via Prisma. Run with `npm run dev` or `npm start`.
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
