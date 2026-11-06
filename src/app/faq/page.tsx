
'use client';

import React from 'react';
import { FAQ } from '@/components/FAQ';
import { useTranslation } from '@/components/LanguageProvider';
import { HelpCircle, Sparkles } from 'lucide-react';

export default function FAQPage() {
  const { lang, t } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Geometric Elements for the whole page */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 -mr-64 -mt-64 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] -z-10 -ml-64 -mb-64" />
      
      {/* Abstract Grid & Lines Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(30deg, var(--primary) 12%, transparent 12.5%, transparent 87%, var(--primary) 87.5%, var(--primary)),
                            linear-gradient(150deg, var(--primary) 12%, transparent 12.5%, transparent 87%, var(--primary) 87.5%, var(--primary)),
                            linear-gradient(30deg, var(--primary) 12%, transparent 12.5%, transparent 87%, var(--primary) 87.5%, var(--primary)),
                            linear-gradient(150deg, var(--primary) 12%, transparent 12.5%, transparent 87%, var(--primary) 87.5%, var(--primary)),
                            linear-gradient(60deg, var(--primary) 25%, transparent 25.5%, transparent 75%, var(--primary) 75%, var(--primary)),
                            linear-gradient(60deg, var(--primary) 25%, transparent 25.5%, transparent 75%, var(--primary) 75%, var(--primary))`,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
        }} 
      />

      {/* Hero Header with "Wow" Patterns */}
      <div className="py-20 md:py-32 bg-primary relative text-primary-foreground overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="absolute top-0 right-0 w-1/2 h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
          </svg>
          <div className="absolute top-1/4 left-10 w-24 h-24 border-4 border-white/10 rounded-full animate-bounce duration-[3000ms]" />
          <div className="absolute bottom-1/4 right-20 w-32 h-32 border-2 border-white/5 rotate-45" />
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-secondary rounded-full animate-ping" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border border-white/10 mb-2">
            <Sparkles className="w-3 h-3 text-secondary" />
            {lang === 'ar' ? 'مركز المساعدة المتطور' : 'ADVANCED HELP CENTER'}
          </div>
          <h1 className="text-4xl md:text-7xl font-black leading-tight drop-shadow-2xl">
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
      <div className="py-12 md:py-24 relative">
        {/* Subtle decorative circles in the content area */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/2 blur-3xl" />
        
        <FAQ />
      </div>

      {/* Bottom Pattern */}
      <div className="h-24 bg-gradient-to-t from-muted/50 to-transparent" />
    </div>
  );
}
