'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';

export default function NotFound() {
  const { lang } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-8 bg-background">
      <div className="space-y-4">
        <h1 className="text-8xl font-black text-primary/10">404</h1>
        <h2 className="text-4xl font-bold text-foreground">
          {lang === 'ar' ? 'غير جاهزه' : 'Not Ready'}
        </h2>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          {lang === 'ar' 
            ? 'عذراً، هذه الصفحة قيد التطوير حالياً أو لا يمكن العثور عليها.' 
            : 'Sorry, this page is currently under development or could not be found.'}
        </p>
      </div>
      
      <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg shadow-xl hover:scale-105 transition-transform">
        <Link href="/">
          {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </Button>

      {/* Decorative background element */}
      <div className="fixed inset-0 -z-10 opacity-[0.03] pointer-events-none textile-pattern" />
    </div>
  );
}
