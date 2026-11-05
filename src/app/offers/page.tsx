'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { ProductCard } from '@/components/ProductCard';

export default function OffersPage() {
  const { lang, t } = useTranslation();

  const salesProducts = [
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
      id: '3',
      nameAr: 'شال يمني يدوي',
      nameEn: 'Handmade Yemeni Shawl',
      price: 8000,
      originalPrice: 10000,
      categoryAr: 'شيلان',
      categoryEn: 'Shawls',
      image: 'https://picsum.photos/seed/p3/600/800',
      status: 'limited'
    }
  ];

  return (
    <div className="py-12 md:py-20 min-h-screen bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-12 md:mb-16 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">{t.nav.offers}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {lang === 'ar' 
              ? 'استمتع بأفضل العروض والخصومات على أجود أنواع المنسوجات اليمنية.' 
              : 'Enjoy the best offers and discounts on the finest Yemeni textiles.'}
          </p>
        </div>

        {salesProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
            {salesProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-background rounded-3xl border shadow-sm">
            <p className="text-xl text-muted-foreground">
              {lang === 'ar' ? 'لا توجد عروض نشطة حالياً.' : 'No active offers at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
