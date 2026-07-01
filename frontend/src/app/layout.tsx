import type { Metadata } from 'next';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MultiGame Arena - Multiplayer Gaming Platform',
  description: 'The ultimate multiplayer gaming platform. Play Tic Tac Toe, Connect Four, Chess, and more with players worldwide.',
  keywords: ['multiplayer', 'games', 'gaming', 'chess', 'tic-tac-toe', 'connect-four', 'online'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
