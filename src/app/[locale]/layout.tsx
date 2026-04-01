import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navigation from '@/components/common/Navigation';
import BottomNavigation from '@/components/common/BottomNavigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as 'ar' | 'fr' | 'en')) {
    notFound()
  }

  const messages = await getMessages()
  const isRtl = locale === 'ar'

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${geistSans.variable} ${geistMono.variable} ${isRtl ? cairo.variable : ''}`}
    >
      <body className={isRtl ? 'font-cairo' : ''}>
        <NextIntlClientProvider messages={messages}>
          <Navigation />
          {children}
          <BottomNavigation />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
