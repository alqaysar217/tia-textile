
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if we are in the production dashboard route
  const isProduction = pathname?.startsWith('/production');

  if (isProduction) {
    return (
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
