
'use client';

import React from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { Testimonials } from '@/components/Testimonials';
import { Quote, Star } from 'lucide-react';

export default function TestimonialsPage() {
  const { lang, t } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      
      {/* Page Header with Geometric Shapes */}
      <div className="py-20 md:py-32 bg-primary relative overflow-hidden text-primary-foreground">
        {/* SVG Decorative Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="0.1" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="white" strokeWidth="0.1" />
          <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.05" fill="none" />
          <path d="M10 10 L20 10 L15 20 Z" fill="white" />
          <path d="M80 80 L90 80 L85 90 Z" fill="white" />
        </svg>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-secondary text-secondary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <h1 className="text-4xl md:text-7xl font-black drop-shadow-xl">{t.testimonials.title}</h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto font-medium leading-relaxed">
            {t.testimonials.subtitle}
          </p>
        </div>
      </div>

      {/* Main Reviews Section */}
      <div className="py-12 md:py-24">
        <Testimonials />
      </div>

      {/* Trust Quote with Advanced Design */}
      <div className="py-20 md:py-32 bg-muted/30 relative">
        <div className="absolute inset-0 opacity-5 textile-pattern" />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-12 md:p-20 bg-background rounded-[3rem] border border-border/50 shadow-2xl relative text-center overflow-hidden group">
            {/* Hover decorative shapes */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/5 rotate-45 group-hover:scale-150 transition-transform duration-700" />
            
            <Quote className="h-16 w-16 md:h-24 md:w-24 text-primary/5 absolute top-10 left-10 pointer-events-none" />
            
            <p className="text-xl md:text-4xl font-black text-foreground leading-relaxed italic relative z-10">
              {lang === 'ar' 
                ? 'ثقتكم هي وقودنا للاستمرار في الحفاظ على هذا التراث النسيجي العريق وتطويره للأجيال القادمة.' 
                : 'Your trust is our fuel to continue preserving and developing this ancient textile heritage for future generations.'}
            </p>
            <div className="mt-12 flex items-center justify-center gap-6 relative z-10">
              <div className="w-16 h-1 bg-secondary rounded-full" />
              <span className="font-black text-primary text-xs md:text-base uppercase tracking-[0.4em]">
                {lang === 'ar' ? 'إدارة الجمعية' : 'Association Management'}
              </span>
              <div className="w-16 h-1 bg-secondary rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
