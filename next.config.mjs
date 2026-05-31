/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev server access from local network IP
  allowedDevOrigins: ['172.24.224.1'],
  reactStrictMode: true,
};
export default nextConfig;

