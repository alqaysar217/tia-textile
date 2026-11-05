
'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('https://picsum.photos/seed/textilehero/1920/1080')` }}
        data-ai-hint="yemeni textile"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t.nav.home}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground textile-pattern p-2">
            {t.hero.title}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t.hero.subtitle}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link href="/products">{t.hero.ctaPrimary}</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-background/50" asChild>
              <Link href="/contact">{t.hero.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Textile Pattern */}
      <div className="absolute bottom-0 right-0 w-1/3 h-full textile-pattern -z-10 opacity-10" />
    </section>
  );
}
