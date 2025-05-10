module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: false // Отключаем Turbopack
  },
  images: {
    domains: ['unpkg.com', 'placehold.co'],
  },
}