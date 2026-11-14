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
  title: 'جمعية الصناعات النسيجية | المعاوز الشبوانية الأصيلة',
  description: 'المنصة الرسمية لجمعية الصناعات النسيجية بالروضة، محافظة شبوة. نقدم أجود أنواع المعاوز اليمنية (ملكي، حليسي، بيضاني) المحاكة يدوياً بأيدي حرفيين مهرة. أصالة تتوارثها الأجيال.',
  keywords: [
    'معاوز يمنية', 'جمعية الصناعات النسيجية', 'الروضة شبوة', 'معوز ملكي', 
    'معوز حليسي', 'معوز بيضاني', 'صناعة يدوية يمنية', 'تراث شبوة', 
    'منسوجات الروضة', 'غزل ونسيج اليمن', 'شراء معاوز اونلاين'
  ],
  authors: [{ name: 'جمعية الصناعات النسيجية - الروضة' }],
  applicationName: 'جمعية المنسوجات',
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'جمعية المنسوجات',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'جمعية الصناعات النسيجية بالروضة | فخر الصناعة اليمنية',
    description: 'اكتشف تشكيلتنا الفاخرة من المعاوز اليدوية الشبوانية. جودة لا تضاهى وتصاميم تحاكي التراث الأصيل.',
    url: 'https://nseeg-shabwa.com',
    siteName: 'جمعية الصناعات النسيجية',
    images: [
      {
        url: '/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'شعار جمعية الصناعات النسيجية - الروضة',
      },
    ],
    locale: 'ar_YE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'جمعية الصناعات النسيجية - الروضة، شبوة',
    description: 'أصالة المنسوجات اليمنية المحاكة يدوياً. اطلب أفضل المعاوز الشبوانية الآن.',
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
