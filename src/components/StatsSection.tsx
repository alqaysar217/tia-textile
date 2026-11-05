
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Users, History, Scissors, Heart } from 'lucide-react';

export function StatsSection() {
  const { lang, t } = useTranslation();

  const stats = [
    {
      icon: <History className="h-8 w-8 text-primary" />,
      value: '1973',
      labelAr: 'سنة التأسيس',
      labelEn: 'Founded Year'
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: '3,000+',
      labelAr: 'عضو تعاوني',
      labelEn: 'Cooperative Members'
    },
    {
      icon: <Scissors className="h-8 w-8 text-primary" />,
      value: '500k',
      labelAr: 'إنتاج سنوي (معوز)',
      labelEn: 'Annual Production'
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      value: '60%',
      labelAr: 'مشاركة نسائية',
      labelEn: 'Women Participation'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center space-y-4 p-8 bg-background rounded-2xl shadow-sm border border-border/50 hover:border-primary transition-colors">
              <div className="flex justify-center">{stat.icon}</div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">
                {lang === 'ar' ? stat.labelAr : stat.labelEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
