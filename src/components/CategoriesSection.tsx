
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function CategoriesSection() {
  const { lang, dir } = useTranslation();

  const categories = [
    { nameAr: 'المعاوز الحليسـي', nameEn: 'Al-Halisi Maawiz', image: 'textile-1' },
    { nameAr: 'المعاوز الملكي', nameEn: 'Al-Maliki Maawiz', image: 'textile-2' },
    { nameAr: 'المعاوز البيضاني', nameEn: 'Al-Baidani Maawiz', image: 'textile-3' },
    { nameAr: 'الشمزان', nameEn: 'Traditional Shirts', image: 'textile-4' },
    { nameAr: 'الشيلان', nameEn: 'Traditional Shawls', image: 'textile-5' },
    { nameAr: 'أخرى', nameEn: 'Others', image: 'textile-6' }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              {lang === 'ar' ? 'فئات المنتجات' : 'Product Categories'}
            </h2>
            <p className="text-muted-foreground max-w-lg">
              {lang === 'ar' 
                ? 'تصفح مجموعتنا الواسعة من المنسوجات المصنفة حسب النوع.' 
                : 'Browse our wide range of textiles categorized by type.'}
            </p>
          </div>
          <Link href="/products" className="flex items-center gap-2 text-primary font-bold hover:underline">
            {lang === 'ar' ? 'مشاهدة الكل' : 'View All'}
            {dir === 'rtl' ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/products?category=${cat.nameAr}`}
              className="group relative h-80 overflow-hidden rounded-2xl"
            >
              <img 
                src={`https://picsum.photos/seed/${cat.image}/800/800`}
                alt={cat.nameAr}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{lang === 'ar' ? cat.nameAr : cat.nameEn}</h3>
                <p className="text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang === 'ar' ? 'اكتشف المزيد' : 'Discover More'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
