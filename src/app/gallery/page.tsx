'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';

export default function GalleryPage() {
  const { lang, t } = useTranslation();

  const galleryItems = [
    { id: '1', titleAr: 'حياكة يدوية تقليدية', titleEn: 'Traditional Hand Weaving', image: 'https://picsum.photos/seed/g1/800/600', categoryAr: 'الإنتاج', categoryEn: 'Production' },
    { id: '2', titleAr: 'نقوش المعوز الملكي', titleEn: 'Royal Maawiz Patterns', image: 'https://picsum.photos/seed/g2/800/600', categoryAr: 'التفاصيل', categoryEn: 'Details' },
    { id: '3', titleAr: 'معرض الجمعية الرئيسي', titleEn: 'Main Association Showroom', image: 'https://picsum.photos/seed/g3/800/600', categoryAr: 'المعرض', categoryEn: 'Showroom' },
    { id: '4', titleAr: 'خيوط القطن الطبيعي', titleEn: 'Natural Cotton Threads', image: 'https://picsum.photos/seed/g4/800/600', categoryAr: 'المواد', categoryEn: 'Materials' },
    { id: '5', titleAr: 'حرفيين من مديرية الروضة', titleEn: 'Artisans from Al-Rawdah', image: 'https://picsum.photos/seed/g5/800/600', categoryAr: 'الحرفيين', categoryEn: 'Artisans' },
    { id: '6', titleAr: 'تغليف الهدايا التراثي', titleEn: 'Heritage Gift Packaging', image: 'https://picsum.photos/seed/g6/800/600', categoryAr: 'الخدمات', categoryEn: 'Services' },
  ];

  return (
    <div className="py-20 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-16 space-y-4">
          <h1 className="text-4xl font-bold">{t.nav.gallery}</h1>
          <p className="text-muted-foreground text-lg">
            {lang === 'ar' 
              ? 'رحلة بصرية داخل عالم الحياكة اليدوية وتراثنا النسيجي الأصيل.' 
              : 'A visual journey into the world of hand weaving and our authentic textile heritage.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl aspect-square border shadow-sm">
              <img 
                src={item.image} 
                alt={lang === 'ar' ? item.titleAr : item.titleEn}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8 text-white">
                <span className="text-primary font-bold text-sm mb-2">
                  {lang === 'ar' ? item.categoryAr : item.categoryEn}
                </span>
                <h3 className="text-xl font-bold">
                  {lang === 'ar' ? item.titleAr : item.titleEn}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
