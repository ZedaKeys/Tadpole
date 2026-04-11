import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_TAGLINE, DISCLAIMER, VERSION } from '@/lib/version';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: `${APP_TAGLINE}. A mobile-first companion app for Baldur's Gate 3 with spell reference, build planner, companion guide, and more.`,
  manifest: '/manifest.json',
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <meta name="disclaimer" content={DISCLAIMER} />
      </head>
      <body className="font-sans safe-top">
        <div className="min-h-dvh flex flex-col">
          {children}
        </div>
        <footer className="text-center py-3 px-4" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {DISCLAIMER} · v{VERSION}
        </footer>
      </body>
    </html>
  );
}
