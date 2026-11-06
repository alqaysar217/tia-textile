
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { Facebook, Instagram, Mail, Phone, MapPin, Package, Info, Image as ImageIcon, HelpCircle, Tag } from 'lucide-react';

export function Footer() {
  const { lang, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const usefulLinks = [
    { name: t.nav.products, href: '/products', icon: <Package className="h-4 w-4" /> },
    { name: t.nav.about, href: '/about', icon: <Info className="h-4 w-4" /> },
    { name: t.nav.gallery, href: '/gallery', icon: <ImageIcon className="h-4 w-4" /> },
    { name: t.nav.faq, href: '/faq', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const categoryLinks = [
    { name: 'المعاوز الملكي', href: '/products?category=ملكي' },
    { name: 'المعاوز الحليسي', href: '/products?category=حليسي' },
    { name: 'المعاوز البيضاني', href: '/products?category=بيضاني' },
    { name: 'المعاوز السلاطيني', href: '/products?category=سلاطيني' },
  ];

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
              <a href="https://wa.me/967771687041" target="_blank" rel="noopener" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#25D366] transition-all">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary/80">
              {lang === 'ar' ? 'روابط هامة' : 'Useful Links'}
            </h3>
            <ul className="space-y-4 text-sm font-bold">
              {usefulLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="flex items-center gap-3 text-[#F4F1E9]/40 hover:text-white transition-colors group">
                    <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                      {link.icon}
                    </span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Quick Access */}
          <div className="space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary/80">
              {lang === 'ar' ? 'فئات المعاوز' : 'Maawiz Types'}
            </h3>
            <ul className="space-y-4 text-sm font-bold">
              {categoryLinks.map((cat, idx) => (
                <li key={idx}>
                  <Link href={cat.href} className="flex items-center gap-3 text-[#F4F1E9]/40 hover:text-white transition-colors group">
                    <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                      <Tag className="h-4 w-4" />
                    </span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details & Mini Map */}
          <div className="space-y-6">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary/80">{t.contact.title}</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-white/5 shrink-0 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-[#F4F1E9]/60 font-medium leading-relaxed">{t.contact.location}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-white/5 shrink-0 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <span dir="ltr" className="tabular-nums font-black text-lg">0777 263 091</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-white/5 shrink-0 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-[#F4F1E9]/60 font-medium">nseeg202020@gmail.com</span>
              </li>
            </ul>
            
            {/* Mini Map Container - Height increased significantly to meet user request */}
            <div 
              className="mt-6 w-full h-52 md:h-64 rounded-2xl overflow-hidden border border-white/10 shadow-inner group relative"
              suppressHydrationWarning
            >
              {mounted ? (
                <>
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15456.985652514336!2d46.82025185!3d14.5245846!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x161c360938b8d96f%3A0x8e83b0f5b128704!2sAtaq!5e0!3m2!1sen!2sye!4v1715600000000!5m2!1sen!2sye" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                  ></iframe>
                  <Link 
                    href="/contact" 
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black uppercase tracking-widest text-white"
                  >
                    {lang === 'ar' ? 'عرض الخريطة الكاملة' : 'View Full Map'}
                  </Link>
                </>
              ) : (
                <div className="w-full h-full bg-white/5 animate-pulse" />
              )}
            </div>
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
