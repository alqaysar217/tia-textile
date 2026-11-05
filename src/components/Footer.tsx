'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const { lang, t } = useTranslation();

  return (
    <footer className="bg-[#1D3323] text-[#F4F1E9] pt-24 pb-12 overflow-hidden relative">
      {/* Decorative Textural Pattern */}
      <div className="absolute inset-0 opacity-5 textile-pattern pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="w-16 h-16 object-contain brightness-0 invert" 
              />
              <div>
                <span className="block font-black text-xl leading-tight">
                  {lang === 'ar' ? 'جمعية الصناعات' : 'Textile'}
                </span>
                <span className="block font-black text-xl leading-tight opacity-70">
                  {lang === 'ar' ? 'النسيجية' : 'Cooperative'}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#F4F1E9]/60 leading-relaxed font-medium">
              {t.footer.description}
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">{lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/products" className="text-[#F4F1E9]/60 hover:text-white transition-colors">{t.nav.products}</Link></li>
              <li><Link href="/about" className="text-[#F4F1E9]/60 hover:text-white transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/gallery" className="text-[#F4F1E9]/60 hover:text-white transition-colors">{t.nav.gallery}</Link></li>
              <li><Link href="/faq" className="text-[#F4F1E9]/60 hover:text-white transition-colors">{t.nav.faq}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">{t.nav.products}</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link href="/products?category=ملكي" className="text-[#F4F1E9]/60 hover:text-white transition-colors">المعاوز الملكي</Link></li>
              <li><Link href="/products?category=حليسي" className="text-[#F4F1E9]/60 hover:text-white transition-colors">المعاوز الحليسي</Link></li>
              <li><Link href="/products?category=شمزان" className="text-[#F4F1E9]/60 hover:text-white transition-colors">الشمزان</Link></li>
              <li><Link href="/products?category=شيلان" className="text-[#F4F1E9]/60 hover:text-white transition-colors">الشيلان</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">{t.contact.title}</h3>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="text-[#F4F1E9]/60 font-medium leading-relaxed">{t.contact.location}</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr" className="tabular-nums font-black text-lg">0777 263 091</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-[#F4F1E9]/60 font-medium">nseeg202020@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4F1E9]/30">
            {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
