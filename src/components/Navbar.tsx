'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, Globe, Phone, Home, Package, Info, Image, MessageSquare, Tag, HelpCircle } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">T</div>';
              }}
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold leading-tight">
              {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Cooperative'}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Shabwa - Yemen
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors py-2 px-1"
            >
              <span className="text-primary/60">{link.icon}</span>
              {link.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="rounded-full"
            title="Switch Language"
          >
            <Globe className="h-5 w-5" />
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Button className="hidden md:flex gap-2 rounded-full px-6" asChild>
            <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
              <Phone className="h-4 w-4" />
              {t.nav.orderWhatsApp}
            </a>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-right flex items-center gap-2">
                  <img src="/images/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                  {lang === 'ar' ? 'القائمة' : 'Menu'}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 text-lg font-medium p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <span className="text-primary">{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
                <Button className="mt-6 gap-2 h-12 rounded-xl" asChild>
                  <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
                    <Phone className="h-4 w-4" />
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