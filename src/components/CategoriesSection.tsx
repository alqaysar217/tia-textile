'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Tag } from 'lucide-react';

export function CategoriesSection() {
  const { lang, dir } = useTranslation();

  const categories = [
    { nameAr: 'المعوز الشبواني', nameEn: 'Shabwani Maawiz', image: 'shabwa-textile' },
    { nameAr: 'المعاوز الملكي', nameEn: 'Royal Maawiz', image: 'textile-1' },
    { nameAr: 'المعاوز الحليسي', nameEn: 'Halisi Maawiz', image: 'textile-2' },
    { nameAr: 'المعاوز الشحري', nameEn: 'Shihri Maawiz', image: 'textile-3' },
    { nameAr: 'المعاوز اللحجي', nameEn: 'Lahji Maawiz', image: 'textile-4' },
    { nameAr: 'المعاوز الحضرمي', nameEn: 'Hadhrami Maawiz', image: 'textile-5' }
  ];

  return (
    <section className="py-12 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* رأس القسم الموحد والمحاذى للمنتصف */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <Tag className="h-3 w-3" />
            {lang === 'ar' ? 'تشكيلتنا المتنوعة' : 'OUR DIVERSE COLLECTION'}
          </div>
          <h2 className="text-2xl md:text-5xl font-black text-foreground">
            {lang === 'ar' ? 'أقسام المعاوز' : 'Maawiz Categories'}
          </h2>
          <div className="w-20 h-1.5 bg-secondary rounded-full mx-auto" />
          <p className="text-muted-foreground text-sm md:text-lg font-medium max-w-2xl">
            {lang === 'ar' 
              ? 'تصفح مجموعتنا من المعاوز اليمنية المصنفة حسب النوع والعراقة التي تميز كل منطقة.' 
              : 'Browse our collection of Yemeni Maawiz categorized by type and heritage that distinguishes each region.'}
          </p>
          
          <Link href="/products" className="flex items-center gap-2 text-primary text-sm md:text-lg font-black hover:underline group mt-2">
            {lang === 'ar' ? 'مشاهدة كل المعاوز' : 'View All Maawiz'}
            {dir === 'rtl' ? <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {categories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/products?category=${cat.nameAr}`}
              className="group relative h-48 md:h-80 overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500"
            >
              <img 
                src={`https://picsum.photos/seed/${cat.image}/600/600`}
                alt={cat.nameAr}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-sm text-[8px] font-black uppercase border border-white/10">
                  {lang === 'ar' ? 'صناعة يدوية' : 'Handmade'}
                </span>
                <h3 className="text-sm md:text-2xl font-black">{lang === 'ar' ? cat.nameAr : cat.nameEn}</h3>
                <div className="flex items-center gap-2 text-primary font-bold text-[8px] md:text-sm transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {lang === 'ar' ? 'تصفح' : 'Browse'}
                  {dir === 'rtl' ? <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" /> : <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
