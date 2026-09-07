import type { Metadata } from 'next';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'GAMEHUB — Multiplayer Gaming Platform',
  description: 'Play. Compete. Connect. Ranked matches, live rooms, tournaments, and friends on GAMEHUB.',
  keywords: ['multiplayer', 'games', 'gaming', 'chess', 'tic-tac-toe', 'connect-four', 'online'],
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('multigame-theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.setAttribute('data-theme',
        window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
      );
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased bg-theme-primary text-theme-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
