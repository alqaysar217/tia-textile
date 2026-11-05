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

  // Demo products
  const featuredProducts = [
    {
      id: '1',
      nameAr: 'معوز ملكي فاخر',
      nameEn: 'Premium Royal Maawiz',
      price: 15000,
      originalPrice: 18000,
      categoryAr: 'ملكي',
      categoryEn: 'Royal',
      image: 'https://picsum.photos/seed/p1/600/800',
      status: 'available',
      isNew: true
    },
    {
      id: '2',
      nameAr: 'معوز حليسي كلاسيك',
      nameEn: 'Classic Halisi Maawiz',
      price: 12000,
      categoryAr: 'حليسي',
      categoryEn: 'Halisi',
      image: 'https://picsum.photos/seed/p2/600/800',
      status: 'available'
    },
    {
      id: '3',
      nameAr: 'شال يمني يدوي',
      nameEn: 'Handmade Yemeni Shawl',
      price: 8000,
      originalPrice: 10000,
      categoryAr: 'شيلان',
      categoryEn: 'Shawls',
      image: 'https://picsum.photos/seed/p3/600/800',
      status: 'limited'
    },
    {
      id: '4',
      nameAr: 'قميص شعبي قطني',
      nameEn: 'Cotton Traditional Shirt',
      price: 5000,
      categoryAr: 'شمزان',
      categoryEn: 'Shirts',
      image: 'https://picsum.photos/seed/p4/600/800',
      status: 'available'
    }
  ];

  return (
    <div className="space-y-0">
      <Hero />
      
      <StatsSection />
      
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black">{t.products.title}</h2>
            <p className="text-muted-foreground text-base md:text-lg">{t.products.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 md:mt-16 text-center">
            <Button size="lg" variant="outline" className="px-10 rounded-full h-12 md:h-14" asChild>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative aspect-video lg:aspect-square overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src="https://picsum.photos/seed/association/1000/1000" 
                alt="Association Heritage" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/5" />
            </div>
            <div className="space-y-6 md:space-y-8 text-center lg:text-right rtl:lg:text-right ltr:lg:text-left">
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                {t.about.historyTitle}
              </h2>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
                <p>{t.about.content}</p>
                <p>{t.about.historyContent}</p>
              </div>
              <Button size="lg" className="px-10 rounded-full h-12 md:h-14 text-base md:text-lg" asChild>
                <Link href="/about">تعرف على قصتنا</Link>
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
