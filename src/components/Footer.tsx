
'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const { lang, t } = useTranslation();

  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                T
              </div>
              <span className="font-bold text-lg">
                {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Cooperative'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.footer.description}
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/abwhaneg/" target="_blank" rel="noopener" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/g_s.n__inst/" target="_blank" rel="noopener" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-6 text-primary">{t.nav.home}</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">{t.nav.products}</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/gallery" className="hover:text-primary transition-colors">{t.nav.gallery}</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">{t.nav.faq}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold mb-6 text-primary">{t.nav.products}</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/products?category=ملكي" className="hover:text-primary transition-colors">المعاوز الملكي</Link></li>
              <li><Link href="/products?category=حليسي" className="hover:text-primary transition-colors">المعاوز الحليسي</Link></li>
              <li><Link href="/products?category=شمزان" className="hover:text-primary transition-colors">الشمزان</Link></li>
              <li><Link href="/products?category=شيلان" className="hover:text-primary transition-colors">الشيلان</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-6 text-primary">{t.contact.title}</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>{t.contact.location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr">0777 263 091</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>nseeg202020@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 text-center text-sm text-muted-foreground">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
