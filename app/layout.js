// import { Inter } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { ErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { PostHogDebugPanel } from '@/components/analytics/PostHogDebugPanel';

// const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MedWard - Medical Report Interpreter',
  description: 'AI-powered medical report interpretation for ward presentations',
  manifest: '/Ward-rounds/manifest.json',
  themeColor: '#0066CC',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MedWard'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/Ward-rounds/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans">
        <ErrorBoundary>
          <PostHogProvider>
            {children}
            <PostHogDebugPanel />
          </PostHogProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
