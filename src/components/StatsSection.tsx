'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import { Users, History, Scissors, Heart } from 'lucide-react';

export function StatsSection() {
  const { lang } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      icon: <History className="h-5 w-5 md:h-6 md:w-6 text-primary" />,
      value: '1973',
      labelAr: 'سنة التأسيس',
      labelEn: 'Founded Year'
    },
    {
      icon: <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />,
      value: '3,000+',
      labelAr: 'عضو تعاوني',
      labelEn: 'Cooperative Members'
    },
    {
      icon: <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary" />,
      value: '500,000',
      labelAr: 'إنتاج سنوي',
      labelEn: 'Annual Production'
    },
    {
      icon: <Heart className="h-5 w-5 md:h-6 md:w-6 text-primary" />,
      value: '60%',
      labelAr: 'مشاركة نسائية',
      labelEn: 'Women Participation'
    }
  ];

  return (
    <section className="py-8 md:py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="group text-center space-y-2 md:space-y-3 p-3 md:p-6 bg-background rounded-2xl shadow-sm border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-500">
              <div className="flex justify-center transform group-hover:scale-105 transition-transform duration-300">
                <div className="p-2 md:p-3 rounded-xl bg-primary/10 text-primary">
                  {stat.icon}
                </div>
              </div>
              <div className="text-lg md:text-2xl font-black text-foreground tabular-nums">
                {stat.value}
              </div>
              <div className="text-[9px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider line-clamp-1">
                {lang === 'ar' ? stat.labelAr : stat.labelEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
