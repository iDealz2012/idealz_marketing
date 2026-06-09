/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  // Removes Supabase auth dev widget
  env: {
    NEXT_PUBLIC_SUPABASE_AUTH_ENABLED: 'false'
  }
}
module.exports = nextConfig