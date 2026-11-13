'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import { Users, History, Scissors, Heart, BarChart3 } from 'lucide-react';

export function StatsSection() {
  const { lang } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      icon: <History className="h-4 w-4 md:h-5 md:w-5 text-primary" />,
      value: '1973',
      labelAr: 'سنة التأسيس',
      labelEn: 'Founded Year'
    },
    {
      icon: <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />,
      value: '3,000+',
      labelAr: 'عضو تعاوني',
      labelEn: 'Cooperative Members'
    },
    {
      icon: <Scissors className="h-4 w-4 md:h-5 md:w-5 text-primary" />,
      value: '500,000',
      labelAr: 'إنتاج سنوي',
      labelEn: 'Annual Production'
    },
    {
      icon: <Heart className="h-4 w-4 md:h-5 md:w-5 text-primary" />,
      value: '60%',
      labelAr: 'مشاركة نسائية',
      labelEn: 'Women Participation'
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 md:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <BarChart3 className="h-3 w-3" />
            {lang === 'ar' ? 'إنجازاتنا بالأرقام' : 'OUR ACHIEVEMENTS'}
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-foreground">
            {lang === 'ar' ? 'الجمعية في أرقام' : 'The Association in Figures'}
          </h2>
          <div className="w-16 h-1 bg-secondary rounded-full" />
          <p className="text-muted-foreground text-xs md:text-base font-medium">
            {lang === 'ar' 
              ? 'نفتخر بمسيرتنا التعاونية الحافلة بالعطاء والتي امتدت لأكثر من نصف قرن في خدمة حرفة النسيج والجمعية.' 
              : 'We are proud of our cooperative journey full of giving that has spanned over half a century in serving the weaving craft.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="group text-center space-y-2 md:space-y-4 p-6 md:p-10 bg-background rounded-2xl shadow-sm border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <BarChart3 className="w-24 h-24" />
              </div>
              
              <div className="flex justify-center relative z-10">
                <div className="p-3 md:p-4 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                  {stat.icon}
                </div>
              </div>
              
              <div className="space-y-1 relative z-10">
                <div className="text-2xl md:text-4xl font-black text-foreground tabular-nums tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                  {lang === 'ar' ? stat.labelAr : stat.labelEn}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
