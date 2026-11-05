'use client';

import React from 'react';
import { FAQ } from '@/components/FAQ';
import { useTranslation } from '@/components/LanguageProvider';

export default function FAQPage() {
  const { lang, t } = useTranslation();

  return (
    <div className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">{t.nav.faq}</h1>
          <p className="text-muted-foreground">
            {lang === 'ar' 
              ? 'كل ما تحتاج معرفته عن جمعية الصناعات النسيجية ومنتجاتنا.' 
              : 'Everything you need to know about the Textile Industries Association and our products.'}
          </p>
        </div>
        <FAQ />
      </div>
    </div>
  );
}
