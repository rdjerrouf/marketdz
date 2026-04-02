import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
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

const META: Record<string, { title: string; description: string }> = {
  ar: {
    title: 'دلالة دي زد - سوق الجزائر الرقمي',
    description: 'تسوّق وبيع بسهولة في الجزائر — إعلانات البيع والإيجار والوظائف والخدمات'
  },
  fr: {
    title: 'DlalaDZ - Marketplace Algérie',
    description: 'Achetez et vendez facilement en Algérie — annonces, emplois, services, locations'
  },
  en: {
    title: 'DlalaDZ - Algeria\'s Digital Marketplace',
    description: 'Buy and sell with ease in Algeria — listings, jobs, services, rentals'
  }
}

const MANIFEST: Record<string, string> = {
  ar: '/manifest-ar.json',
  fr: '/manifest-fr.json',
  en: '/manifest.json'
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const meta = META[locale] ?? META.ar
  const baseUrl = 'https://dlaladz.com'

  return {
    title: meta.title,
    description: meta.description,
    manifest: MANIFEST[locale] ?? '/manifest-ar.json',
    alternates: {
      canonical: locale === 'ar' ? baseUrl : `${baseUrl}/${locale}`,
      languages: {
        'ar': baseUrl,
        'fr': `${baseUrl}/fr`,
        'en': `${baseUrl}/en`,
        'x-default': baseUrl
      }
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'fr' ? 'fr_DZ' : 'en_US',
      alternateLocale: locale === 'ar' ? ['fr_DZ', 'en_US'] : locale === 'fr' ? ['ar_DZ', 'en_US'] : ['ar_DZ', 'fr_DZ']
    }
  }
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
          {children}
          <BottomNavigation />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
