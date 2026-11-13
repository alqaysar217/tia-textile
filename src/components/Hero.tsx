'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
  const { t, lang } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#022c22]">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 animate-in fade-in zoom-in duration-1000"
        style={{ 
          backgroundImage: `url('/images/hero.png')`,
          filter: 'brightness(0.7)'
        }}
        data-ai-hint="yemeni weaver workshop"
      >
        {/* Advanced Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#022c22] md:bg-gradient-to-r md:from-black/80 md:via-black/20 md:to-transparent z-10 rtl:md:bg-gradient-to-l" />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-3xl space-y-6 md:space-y-10 text-center lg:text-right rtl:lg:text-right ltr:lg:text-left">
          {/* Unique Heritage Badge - Sharp one side, curved other side */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-e-xl rounded-s-none bg-primary/20 text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] border-y border-e border-emerald-500/30 border-s-4 border-s-emerald-500 backdrop-blur-md w-fit animate-in slide-in-from-top duration-700 mx-auto lg:mx-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            {lang === 'ar' ? 'تراث الروضة - شبوة' : 'AL-RAWDAH HERITAGE'}
          </div>
          
          <div className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-200">
            <h1 className="text-4xl md:text-7xl font-black leading-[1.05] text-white drop-shadow-2xl">
              {t.hero.title}
            </h1>
            <div className="w-24 h-2 bg-secondary rounded-full mx-auto lg:mx-0" />
          </div>
          
          <p className="text-lg md:text-2xl text-white/80 leading-relaxed max-w-xl font-medium animate-in slide-in-from-bottom duration-700 delay-300 mx-auto lg:mx-0">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-6 animate-in slide-in-from-bottom duration-700 delay-500">
            <Button size="lg" className="h-14 md:h-16 w-full sm:w-auto px-10 md:px-12 text-base md:text-lg font-black rounded-xl shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] transition-all bg-primary hover:bg-emerald-700 border-none" asChild>
              <Link href="/products">{t.hero.ctaPrimary}</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 md:h-16 w-full sm:w-auto px-10 md:px-12 text-base md:text-lg font-black rounded-xl bg-white/5 backdrop-blur-xl border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all" asChild>
              <Link href="/contact">{t.hero.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Elegant Textile Texture Overlay */}
      <div className="absolute inset-0 textile-pattern pointer-events-none z-15 opacity-20 mix-blend-overlay" />
    </section>
  );
}
