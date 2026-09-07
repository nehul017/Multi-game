/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/images/games/snake.png', destination: '/images/games/snake.jpg' },
      { source: '/images/games/quiz.png', destination: '/images/games/quiz.jpg' },
      { source: '/images/games/:name.png', destination: '/images/games/:name.jpg' },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'MultiGame Arena',
  },
};

module.exports = nextConfig;
