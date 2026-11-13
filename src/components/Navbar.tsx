
'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Menu, 
  Globe, 
  Phone, 
  Home, 
  Package, 
  Info, 
  Image as ImageIcon, 
  MessageSquare, 
  Tag, 
  HelpCircle, 
  LayoutDashboard, 
  LogIn,
  MapPin,
  Star
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Navbar() {
  const { lang, setLang, t, dir } = useTranslation();
  const { totalItems } = useCart();

  const navLinks = [
    { name: t.nav.home, href: '/', icon: <Home className="h-4 w-4" /> },
    { name: t.nav.products, href: '/products', icon: <Package className="h-4 w-4" /> },
    { name: t.nav.about, href: '/about', icon: <Info className="h-4 w-4" /> },
    { name: t.nav.gallery, href: '/gallery', icon: <ImageIcon className="h-4 w-4" /> },
    { name: t.nav.offers, href: '/offers', icon: <Tag className="h-4 w-4" /> },
    { name: t.nav.contact, href: '/contact', icon: <MessageSquare className="h-4 w-4" /> },
    { name: t.nav.faq, href: '/faq', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const mobileNavLinks = [
    { name: t.nav.home, href: '/', icon: <Home className="h-5 w-5" /> },
    { name: t.nav.products, href: '/products', icon: <Package className="h-5 w-5" /> },
    { name: t.nav.branches, href: '/branches', icon: <MapPin className="h-5 w-5" /> },
    { name: t.nav.about, href: '/about', icon: <Info className="h-5 w-5" /> },
    { name: t.nav.gallery, href: '/gallery', icon: <ImageIcon className="h-5 w-5" /> },
    { name: t.testimonials.title, href: '/testimonials', icon: <Star className="h-5 w-5" /> },
    { name: t.nav.faq, href: '/faq', icon: <HelpCircle className="h-5 w-5" /> },
    { name: t.nav.contact, href: '/contact', icon: <MessageSquare className="h-5 w-5" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-primary/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-2xl bg-muted/30 p-0 flex items-center justify-center border border-primary/5">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[10px] md:text-sm font-black leading-tight text-primary uppercase tracking-tighter">
              {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Cooperative'}
            </h1>
            <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold opacity-60 uppercase tracking-widest">
              {lang === 'ar' ? 'اليمن - شبوة' : 'Shabwa - Yemen'}
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:text-primary transition-colors py-2 relative group"
            >
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">{link.icon}</span>
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-2">
          {/* ERP Entry Point */}
          <Link href="/production" className="hidden xl:flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-primary transition-colors border-r border-border/50 pe-4 me-2">
            <LayoutDashboard className="w-3 h-3" />
            {lang === 'ar' ? 'نظام إدارة الإنتاج' : 'Production Management'}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="rounded-full hover:bg-primary/5"
          >
            <Globe className="h-5 w-5" />
          </Button>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/5">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Button className="hidden md:flex gap-2 rounded-full px-6 h-10 shadow-sm hover:shadow-md transition-all active:scale-95" asChild>
            <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
              <Phone className="h-4 w-4" />
              {t.nav.orderWhatsApp}
            </a>
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-[320px] border-none rounded-3xl flex flex-col p-0 overflow-hidden">
              <SheetHeader className="p-6 border-b border-border/50 bg-muted/20">
                <SheetTitle className="flex items-center gap-3 justify-end rtl:flex-row-reverse">
                  <div className="text-right rtl:text-right">
                    <h1 className="text-xs font-black leading-tight text-primary uppercase tracking-tighter">
                      {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Cooperative'}
                    </h1>
                    <p className="text-[9px] text-muted-foreground font-bold opacity-60 uppercase tracking-widest">
                      {lang === 'ar' ? 'اليمن - شبوة' : 'Shabwa - Yemen'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm p-0 flex items-center justify-center border border-primary/5 shrink-0">
                    <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  </div>
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-1">
                  {mobileNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-end gap-4 text-sm font-black p-4 rounded-2xl hover:bg-primary/5 transition-all active:scale-95 text-foreground/80 hover:text-primary rtl:flex-row-reverse"
                    >
                      {link.name}
                      <span className="text-primary/60">{link.icon}</span>
                    </Link>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 border-t border-border/50 bg-background flex gap-3 rtl:flex-row-reverse">
                <Button variant="outline" className="flex-1 gap-2 h-12 rounded-xl text-[10px] font-black rtl:flex-row-reverse" asChild>
                  <Link href="/production">
                    <LogIn className="w-4 h-4" />
                    {lang === 'ar' ? 'نظام الإنتاج' : 'ERP Login'}
                  </Link>
                </Button>
                <Button className="flex-1 gap-2 h-12 rounded-xl text-[10px] font-black shadow-lg shadow-primary/20 rtl:flex-row-reverse" asChild>
                  <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
                    <Phone className="h-4 w-4" />
                    {lang === 'ar' ? 'اطلب واتساب' : 'WhatsApp'}
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
