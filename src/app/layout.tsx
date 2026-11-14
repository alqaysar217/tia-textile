import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/components/LanguageProvider';
import { CartProvider } from '@/components/CartProvider';
import { MainLayoutWrapper } from '@/components/MainLayoutWrapper';
import { FirebaseClientProvider } from '@/firebase';
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'جمعية الصناعات النسيجية | Textile Association',
  description: 'جمعية الصناعات النسيجية للمعاوز والغزل – الروضة، محافظة شبوة، اليمن. أصالة تُنسج بإتقان وتراث يمتد عبر الأجيال وبأيدي حرفيين مهرة.',
  keywords: ['معاوز', 'معاوز يمنية', 'الروضة', 'شبوة', 'صناعات نسيجية', 'حياكة يدوية', 'تراث يمني', 'معوز ملكي', 'معوز حليسي', 'منسوجات شبوة'],
  authors: [{ name: 'جمعية الصناعات النسيجية' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'جمعية الصناعات النسيجية | أصالة وتراث يمني',
    description: 'نقدم أجود أنواع المعاوز اليمنية المحاكة يدوياً بمديرية الروضة - شبوة. جودة نثق بها وتراث نفخر به.',
    url: 'https://nseeg-shabwa.com',
    siteName: 'جمعية الصناعات النسيجية',
    images: [
      {
        url: '/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'لوجو جمعية الصناعات النسيجية - الروضة',
      },
    ],
    locale: 'ar_YE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'جمعية الصناعات النسيجية | أصالة وتراث يمني',
    description: 'أجود المعاوز اليدوية من قلب الروضة - شبوة.',
    images: ['/web-app-manifest-512x512.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexSansArabic.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen flex flex-col selection:bg-primary/20">
        <LanguageProvider>
          <FirebaseClientProvider>
            <CartProvider>
              <MainLayoutWrapper>
                {children}
              </MainLayoutWrapper>
              <Toaster />
            </CartProvider>
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
