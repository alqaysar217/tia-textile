'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, Globe, Phone, Home, Package, Info, Image, MessageSquare, Tag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Navbar() {
  const { lang, setLang, t, dir } = useTranslation();
  const { totalItems } = useCart();

  const navLinks = [
    { name: t.nav.home, href: '/', icon: <Home className="h-4 w-4" /> },
    { name: t.nav.products, href: '/products', icon: <Package className="h-4 w-4" /> },
    { name: t.nav.about, href: '/about', icon: <Info className="h-4 w-4" /> },
    { name: t.nav.gallery, href: '/gallery', icon: <Image className="h-4 w-4" /> },
    { name: t.nav.offers, href: '/offers', icon: <Tag className="h-4 w-4" /> },
    { name: t.nav.contact, href: '/contact', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-primary/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative w-14 h-14 transition-transform duration-500 group-hover:scale-105">
            <img 
              src="/images/logo.png" 
              alt="Textile Industries Cooperative Association" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-black leading-tight tracking-tight text-primary">
              {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Cooperative'}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-70">
              Shabwa - Yemen
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-all duration-300 relative group py-2"
            >
              <span className="text-primary/40 group-hover:text-primary transition-colors">{link.icon}</span>
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="rounded-full hover:bg-primary/10 transition-colors"
          >
            <Globe className="h-5 w-5" />
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/10 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Button className="hidden md:flex gap-2 rounded-full px-8 h-11 shadow-md hover:shadow-xl transition-all duration-300 active:scale-95" asChild>
            <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
              <Phone className="h-4 w-4" />
              {t.nav.orderWhatsApp}
            </a>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full hover:bg-primary/10 transition-colors">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-[320px] rounded-l-3xl rtl:rounded-r-3xl border-none">
              <SheetHeader className="mb-8">
                <SheetTitle className="text-right flex items-center gap-4">
                  <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                  <div className="text-right">
                    <div className="text-sm font-black">{lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}</div>
                    <div className="text-[10px] opacity-50 uppercase tracking-widest font-bold">Navigation</div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 text-lg font-bold p-4 rounded-2xl hover:bg-primary/5 transition-all duration-300 group"
                  >
                    <span className="text-primary group-hover:scale-110 transition-transform">{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
                <Button className="mt-8 gap-3 h-14 rounded-2xl text-lg font-bold shadow-lg" asChild>
                  <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
                    <Phone className="h-5 w-5" />
                    {t.nav.orderWhatsApp}
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
