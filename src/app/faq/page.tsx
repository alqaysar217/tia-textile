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
      
      {/* Organized Hexagonal Pattern for the main background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 104l-30-17.321L0 104V69.359L30 52l30 17.359V104zm0-69.359L30 17.321 0 34.641V0l30 17.321L60 0v34.641z' fill='%23065F34' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 104px'
        }} 
      />

      {/* Hero Header with Organized Hexagonal Patterns - Reduced Height */}
      <div className="py-12 md:py-20 bg-primary relative text-primary-foreground overflow-hidden">
        {/* Organized Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* Hexagonal Overlay Pattern */}
          <div className="absolute inset-0 opacity-10" 
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 104l-30-17.321L0 104V69.359L30 52l30 17.359V104zm0-69.359L30 17.321 0 34.641V0l30 17.321L60 0v34.641z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '80px 138px'
            }} 
          />
          
          {/* Subtle Geometric accents */}
          <svg className="absolute top-0 right-0 h-full w-1/3 opacity-10 text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="0,0 100,0 100,100" fill="currentColor" />
          </svg>
          
          {/* Regulated Hexagonal accents */}
          <div className="absolute top-10 left-10 w-20 h-20 opacity-10 border border-white/40" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
          <div className="absolute bottom-10 right-10 w-32 h-32 opacity-10 border border-white/40" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-4">
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-2xl">
            {t.faq.title}
          </h1>
          <p className="text-sm md:text-lg opacity-80 max-w-2xl mx-auto font-medium leading-relaxed">
            {lang === 'ar' 
              ? 'كل ما تحتاج معرفته عن جمعية الصناعات النسيجية ومنتجاتنا، جمعنا لك أهم التساؤلات في مكان واحد.' 
              : 'Everything you need to know about the Textile Industries Association and our products, collected in one place.'}
          </p>
        </div>
      </div>

      {/* FAQ Component */}
      <div className="py-8 md:py-20 relative">
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
