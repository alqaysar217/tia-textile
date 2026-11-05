'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
  const { t, lang } = useTranslation();

  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden bg-muted">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
        style={{ backgroundImage: `url('https://picsum.photos/seed/textilehero/1920/1080')` }}
        data-ai-hint="yemeni textile artisan"
      >
        {/* Optimized Overlay for Clarity */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10 rtl:bg-gradient-to-l" />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {lang === 'ar' ? 'تراث الروضة - شبوة' : 'AL-RAWDAH HERITAGE'}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black leading-[1.1] text-foreground">
            {t.hero.title}
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="h-12 px-6 text-sm font-bold rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
              <Link href="/products">{t.hero.ctaPrimary}</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-6 text-sm font-bold rounded-full bg-background/40 backdrop-blur-sm border-white/20" asChild>
              <Link href="/contact">{t.hero.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 textile-pattern pointer-events-none z-15" />
    </section>
  );
}
