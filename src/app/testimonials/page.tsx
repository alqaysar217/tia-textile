
'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { Testimonials } from '@/components/Testimonials';
import { Quote } from 'lucide-react';

export default function TestimonialsPage() {
  const { lang, t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="py-20 bg-primary relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0 opacity-10 textile-pattern" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-4">
          <Quote className="h-16 w-16 mx-auto opacity-20" />
          <h1 className="text-4xl md:text-6xl font-black">{t.testimonials.title}</h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto font-medium">
            {t.testimonials.subtitle}
          </p>
        </div>
      </div>

      {/* Main Reviews Section */}
      <div className="py-12">
        <Testimonials />
      </div>

      {/* Trust Quote */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-12 bg-background rounded-[3rem] border border-border/50 shadow-2xl relative text-center">
            <div className="text-4xl md:text-6xl font-black text-primary/10 absolute top-10 left-10 pointer-events-none">"</div>
            <p className="text-xl md:text-3xl font-black text-foreground leading-relaxed italic relative z-10">
              {lang === 'ar' 
                ? 'ثقتكم هي وقودنا للاستمرار في الحفاظ على هذا التراث النسيجي العريق وتطويره للأجيال القادمة.' 
                : 'Your trust is our fuel to continue preserving and developing this ancient textile heritage for future generations.'}
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="w-12 h-1 bg-secondary rounded-full" />
              <span className="font-black text-primary uppercase tracking-[0.3em]">
                {lang === 'ar' ? 'إدارة الجمعية' : 'Association Management'}
              </span>
              <div className="w-12 h-1 bg-secondary rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
