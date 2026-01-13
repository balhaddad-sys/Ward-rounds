// import { Inter } from 'next/font/google';
import './globals.css';

// const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MedWard - Medical Report Interpreter',
  description: 'AI-powered medical report interpretation for ward presentations',
  manifest: '/manifest.json',
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
