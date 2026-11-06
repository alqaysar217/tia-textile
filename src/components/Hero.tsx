'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
  const { t, lang } = useTranslation();

  return (
    <section className="relative min-h-[80vh] md:min-h-[85vh] flex items-center overflow-hidden bg-muted">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-100"
        style={{ backgroundImage: `url('https://picsum.photos/seed/textilehero/1280/720')` }}
        data-ai-hint="yemeni textile artisan"
      >
        {/* Optimized Overlay for Clarity - Darker on mobile for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background md:bg-gradient-to-r md:from-background md:via-background/60 md:to-transparent z-10 rtl:md:bg-gradient-to-l" />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-black uppercase tracking-widest border border-primary/10 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {lang === 'ar' ? 'تراث الروضة - شبوة' : 'AL-RAWDAH HERITAGE'}
          </div>
          
          <h1 className="text-3xl md:text-6xl font-black leading-[1.1] text-foreground">
            {t.hero.title}
          </h1>
          
          <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-lg font-medium">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="h-12 md:h-16 px-8 md:px-10 text-sm md:text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all" asChild>
              <Link href="/products">{t.hero.ctaPrimary}</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 md:h-16 px-8 md:px-10 text-sm md:text-lg font-bold rounded-full bg-background/40 backdrop-blur-md border-white/20 hover:bg-background transition-all" asChild>
              <Link href="/contact">{t.hero.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 textile-pattern pointer-events-none z-15 opacity-10" />
    </section>
  );
}
