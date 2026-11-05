'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Tag } from 'lucide-react';

export function CategoriesSection() {
  const { lang, dir } = useTranslation();

  const categories = [
    { nameAr: 'المعاوز الحليسـي', nameEn: 'Al-Halisi Maawiz', image: 'textile-1' },
    { nameAr: 'المعاوز الملكي', nameEn: 'Al-Maliki Maawiz', image: 'textile-2' },
    { nameAr: 'المعاوز البيضاني', nameEn: 'Al-Baidani Maawiz', image: 'textile-3' },
    { nameAr: 'المعاوز السلاطيني', nameEn: 'Al-Salateeni Maawiz', image: 'textile-4' },
    { nameAr: 'المعاوز الحديدي', nameEn: 'Al-Hadidi Maawiz', image: 'textile-5' },
    { nameAr: 'أنواع أخرى', nameEn: 'Other Types', image: 'textile-6' }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <Tag className="h-3 w-3" />
              {lang === 'ar' ? 'تشكيلتنا المتنوعة' : 'Our Diverse Collection'}
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              {lang === 'ar' ? 'أقسام المعاوز' : 'Maawiz Categories'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg">
              {lang === 'ar' 
                ? 'تصفح مجموعتنا من المعاوز اليمنية المصنفة حسب النوع والعراقة.' 
                : 'Browse our collection of Yemeni Maawiz categorized by type and heritage.'}
            </p>
          </div>
          <Link href="/products" className="flex items-center gap-2 text-primary text-lg font-black hover:underline group">
            {lang === 'ar' ? 'مشاهدة كل المعاوز' : 'View All Maawiz'}
            {dir === 'rtl' ? <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-2" /> : <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/products?category=${cat.nameAr}`}
              className="group relative h-96 overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              <img 
                src={`https://picsum.photos/seed/${cat.image}/800/800`}
                alt={cat.nameAr}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm text-[10px] font-black uppercase border border-white/10">
                  {lang === 'ar' ? 'صناعة يدوية' : 'Handmade'}
                </span>
                <h3 className="text-3xl font-black">{lang === 'ar' ? cat.nameAr : cat.nameEn}</h3>
                <div className="flex items-center gap-2 text-primary font-bold text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {lang === 'ar' ? 'تصفح هذه الفئة' : 'Browse Category'}
                  {dir === 'rtl' ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
