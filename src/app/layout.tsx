import type { Metadata, Viewport } from "next";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import "./globals.css";

export const metadata: Metadata = {
  title: "DlalaDZ - Marketplace Algeria",
  description: "Comprehensive marketplace for Algeria - Buy, Sell, Jobs, Services, Rentals",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-precomposed.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DlalaDZ",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "DlalaDZ",
    title: "DlalaDZ - Marketplace Algeria",
    description: "Comprehensive marketplace for Algeria - Buy, Sell, Jobs, Services, Rentals",
  },
  twitter: {
    card: "summary",
    title: "DlalaDZ - Marketplace Algeria",
    description: "Comprehensive marketplace for Algeria - Buy, Sell, Jobs, Services, Rentals",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F4F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang/dir are set by the [locale]/layout.tsx — this shell has no lang attribute
    // so Next.js will merge the locale layout's <html> attributes correctly
    <html suppressHydrationWarning>
      <body>
        <AuthProvider>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
