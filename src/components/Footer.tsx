'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const { lang, t } = useTranslation();

  return (
    <footer className="bg-[#1D3323] text-[#F4F1E9] pt-24 pb-12 overflow-hidden relative border-t border-white/5">
      <div className="absolute inset-0 opacity-[0.03] textile-pattern pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Identity */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-0 backdrop-blur-sm border border-white/10">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-cover rounded-2xl" 
                />
              </div>
              <div>
                <span className="block font-black text-lg leading-tight uppercase tracking-tighter">
                  {lang === 'ar' ? 'جمعية الصناعات' : 'Textile'}
                </span>
                <span className="block font-black text-lg leading-tight opacity-50 uppercase tracking-tighter">
                  {lang === 'ar' ? 'النسيجية' : 'Cooperative'}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#F4F1E9]/60 leading-relaxed font-medium max-w-xs">
              {t.footer.description}
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-all">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary/80">{lang === 'ar' ? 'روابط هامة' : 'Useful Links'}</h3>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link href="/products" className="text-[#F4F1E9]/40 hover:text-white transition-colors">{t.nav.products}</Link></li>
              <li><Link href="/about" className="text-[#F4F1E9]/40 hover:text-white transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/gallery" className="text-[#F4F1E9]/40 hover:text-white transition-colors">{t.nav.gallery}</Link></li>
              <li><Link href="/faq" className="text-[#F4F1E9]/40 hover:text-white transition-colors">{t.nav.faq}</Link></li>
            </ul>
          </div>

          {/* Categories Quick Access */}
          <div className="space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary/80">{lang === 'ar' ? 'فئات المعاوز' : 'Maawiz Types'}</h3>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link href="/products?category=ملكي" className="text-[#F4F1E9]/40 hover:text-white transition-colors">المعاوز الملكي</Link></li>
              <li><Link href="/products?category=حليسي" className="text-[#F4F1E9]/40 hover:text-white transition-colors">المعاوز الحليسي</Link></li>
              <li><Link href="/products?category=بيضاني" className="text-[#F4F1E9]/40 hover:text-white transition-colors">المعاوز البيضاني</Link></li>
              <li><Link href="/products?category=سلاطيني" className="text-[#F4F1E9]/40 hover:text-white transition-colors">المعاوز السلاطيني</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary/80">{t.contact.title}</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="text-[#F4F1E9]/60 font-medium leading-relaxed">{t.contact.location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr" className="tabular-nums font-black text-lg">0777 263 091</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-[#F4F1E9]/60 font-medium">nseeg202020@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4F1E9]/20">
            {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
