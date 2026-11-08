
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
  description: 'جمعية الصناعات النسيجية للمعاوز والغزل – الروضة، محافظة شبوة، اليمن. أصالة تُنسج بإتقان وتراث يمتد عبر الأجيال.',
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
