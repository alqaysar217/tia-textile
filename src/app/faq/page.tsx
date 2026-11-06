
'use client';

import React from 'react';
import { FAQ } from '@/components/FAQ';
import { useTranslation } from '@/components/LanguageProvider';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const { lang, t } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -z-10 -ml-64 -mb-64" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none textile-pattern" />

      {/* Hero Header */}
      <div className="py-20 md:py-32 bg-primary relative text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20 textile-pattern" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border border-white/10 mb-2">
            <HelpCircle className="w-4 h-4" />
            {lang === 'ar' ? 'مركز المساعدة' : 'HELP CENTER'}
          </div>
          <h1 className="text-4xl md:text-7xl font-black leading-tight">
            {t.faq.title}
          </h1>
          <p className="text-base md:text-xl opacity-80 max-w-2xl mx-auto font-medium leading-relaxed">
            {lang === 'ar' 
              ? 'كل ما تحتاج معرفته عن جمعية الصناعات النسيجية ومنتجاتنا، جمعنا لك أهم التساؤلات في مكان واحد.' 
              : 'Everything you need to know about the Textile Industries Association and our products, collected in one place.'}
          </p>
        </div>
      </div>

      {/* FAQ Component */}
      <div className="py-12 md:py-24">
        <FAQ />
      </div>

      {/* Bottom Pattern */}
      <div className="h-24 bg-gradient-to-t from-muted/50 to-transparent" />
    </div>
  );
}
