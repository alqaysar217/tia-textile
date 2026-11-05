
'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingWhatsApp() {
  return (
    <div className="fixed bottom-8 right-8 z-[60] rtl:left-8 rtl:right-auto">
      <Button 
        className="h-16 w-16 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#128C7E] text-white p-0 group"
        asChild
      >
        <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
          <Phone className="h-8 w-8 group-hover:scale-110 transition-transform" />
        </a>
      </Button>
      <div className="absolute top-0 right-0 -mr-2 -mt-2 flex h-6 w-6">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-6 w-6 bg-[#25D366]"></span>
      </div>
    </div>
  );
}
