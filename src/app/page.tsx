'use client';

import { Hero } from '@/components/Hero';
import { StatsSection } from '@/components/StatsSection';
import { Features } from '@/components/Features';
import { CategoriesSection } from '@/components/CategoriesSection';
import { useTranslation } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { FAQ } from '@/components/FAQ';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';

export default function Home() {
  const { lang, t } = useTranslation();

  // Featured Maawiz products
  const featuredProducts = [
    {
      id: '1',
      nameAr: 'معوز ملكي فاخر - نقشة خاصة',
      nameEn: 'Premium Royal Maawiz - Special Pattern',
      price: 15000,
      originalPrice: 18000,
      categoryAr: 'ملكي',
      categoryEn: 'Royal',
      image: 'https://picsum.photos/seed/m1/600/800',
      status: 'available',
      isNew: true
    },
    {
      id: '2',
      nameAr: 'معوز حليسي كلاسيك - يدوي',
      nameEn: 'Classic Halisi Maawiz - Handmade',
      price: 12000,
      categoryAr: 'حليسي',
      categoryEn: 'Halisi',
      image: 'https://picsum.photos/seed/m2/600/800',
      status: 'available'
    },
    {
      id: '3',
      nameAr: 'معوز بيضاني - شغل ممتاز',
      nameEn: 'Baidani Maawiz - Excellent Work',
      price: 14000,
      categoryAr: 'بيضاني',
      categoryEn: 'Baidani',
      image: 'https://picsum.photos/seed/m3/600/800',
      status: 'available'
    },
    {
      id: '5',
      nameAr: 'معوز سلاطيني - نخب أول',
      nameEn: 'Salateeni Maawiz - Grade A',
      price: 18000,
      categoryAr: 'سلاطيني',
      categoryEn: 'Salateeni',
      image: 'https://picsum.photos/seed/m5/600/800',
      status: 'available',
      isNew: true
    }
  ];

  return (
    <div className="space-y-0">
      <Hero />
      
      <StatsSection />
      
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-primary">{t.products.title}</h2>
            <p className="text-muted-foreground text-base md:text-xl font-medium">{t.products.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 md:mt-16 text-center">
            <Button size="lg" variant="outline" className="px-12 rounded-full h-14 md:h-16 text-lg font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-xl" asChild>
              <Link href="/products">{t.products.viewAll}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="bg-muted/30">
        <Features />
      </div>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="relative aspect-video lg:aspect-square overflow-hidden rounded-3xl shadow-2xl">
              <img 
                src="https://picsum.photos/seed/association/1000/1000" 
                alt="Association Heritage" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
            </div>
            <div className="space-y-8 text-center lg:text-right rtl:lg:text-right ltr:lg:text-left">
              <h2 className="text-4xl md:text-6xl font-black leading-tight">
                {t.about.historyTitle}
              </h2>
              <div className="space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                <p>{t.about.content}</p>
                <p>{t.about.historyContent}</p>
              </div>
              <Button size="lg" className="px-12 rounded-full h-14 md:h-16 text-lg font-bold shadow-2xl hover:scale-105 transition-transform" asChild>
                <Link href="/about">تعرف على قصتنا الكاملة</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-muted/30">
        <CategoriesSection />
      </div>
      
      <div className="bg-background">
        <FAQ />
      </div>

      <FloatingWhatsApp />
    </div>
  );
}
