
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
import { Testimonials } from '@/components/Testimonials';

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
      
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 space-y-2 md:space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-primary">{t.products.title}</h2>
            <p className="text-muted-foreground text-xs md:text-lg font-medium">{t.products.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 md:mt-12 text-center">
            <Button size="lg" variant="outline" className="w-full md:w-auto px-10 rounded-full h-12 md:h-14 text-base font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-lg" asChild>
              <Link href="/products">{t.products.viewAll}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="bg-muted/30">
        <Features />
      </div>

      <section className="py-12 md:py-20 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="relative aspect-video md:aspect-[4/3] max-w-xl mx-auto overflow-hidden rounded-xl md:rounded-2xl shadow-xl">
              <img 
                src="https://picsum.photos/seed/association/800/600" 
                alt="Association Heritage" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
            </div>
            <div className="space-y-4 md:space-y-6 text-center lg:text-right rtl:lg:text-right ltr:lg:text-left">
              <h2 className="text-2xl md:text-5xl font-black leading-tight">
                {t.about.historyTitle}
              </h2>
              <div className="space-y-3 md:space-y-4 text-sm md:text-lg text-muted-foreground leading-relaxed">
                <p>{t.about.content}</p>
                <p>{t.about.historyContent}</p>
              </div>
              <Button size="lg" className="w-full md:w-auto px-10 rounded-full h-12 md:h-14 text-base font-bold shadow-xl hover:scale-105 transition-transform" asChild>
                <Link href="/about">تعرف على قصتنا الكاملة</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-muted/30">
        <CategoriesSection />
      </div>

      <Testimonials showViewMore={true} limit={3} />
      
      <div className="bg-background">
        <FAQ showViewMore={true} />
      </div>

      <FloatingWhatsApp />
    </div>
  );
}
