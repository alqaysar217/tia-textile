'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  HelpCircle, 
  LayoutDashboard, 
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
import { cn } from '@/lib/utils';

export function Navbar() {
  const { lang, setLang, t, dir } = useTranslation();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const isRtl = lang === 'ar';

  const navLinks = [
    { name: t.nav.home, href: '/', icon: <Home className="h-4 w-4" /> },
    { name: t.nav.products, href: '/products', icon: <Package className="h-4 w-4" /> },
    { name: t.nav.branches, href: '/branches', icon: <MapPin className="h-4 w-4" /> },
    { name: t.nav.about, href: '/about', icon: <Info className="h-4 w-4" /> },
    { name: t.nav.gallery, href: '/gallery', icon: <ImageIcon className="h-4 w-4" /> },
    { name: t.nav.contact, href: '/contact', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  // Mobile navigation includes more items
  const mobileLinks = [
    ...navLinks,
    { name: lang === 'ar' ? 'ماذا يقول عملاؤنا؟' : 'Testimonials', href: '/testimonials', icon: <Star className="h-4 w-4" /> },
    { name: t.nav.faq, href: '/faq', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-primary/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-lg bg-muted/30 p-0 flex items-center justify-center border border-primary/5">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="w-full h-full object-cover rounded-lg"
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

        {/* Desktop Nav Links - Main Navigation */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-5 mx-2 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 text-[10px] xl:text-xs font-black uppercase tracking-wider transition-colors py-2 relative group whitespace-nowrap",
                pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary"
              )}
            >
              {link.name}
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                pathname === link.href ? "w-full" : "w-0"
              )} />
            </Link>
          ))}
        </div>

        {/* Actions Menu - Ordered: Language -> Cart -> WhatsApp -> ERP */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* 1. Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="rounded-lg hover:bg-primary/5 h-10 w-10 shrink-0"
          >
            <Globe className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* 2. Cart Icon */}
          <Link href="/cart" className="shrink-0">
            <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-primary/5 h-10 w-10">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Buttons Group (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-2">
            {/* 3. WhatsApp Button */}
            <Button className="rounded-lg px-4 h-10 shadow-sm hover:shadow-md transition-all active:scale-95 text-[10px] xl:text-xs font-black shrink-0" asChild>
              <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
                < Phone className="h-4 w-4" />
                {t.nav.orderWhatsApp}
              </a>
            </Button>

            {/* 4. ERP Login Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 h-10 rounded-lg text-[10px] xl:text-xs font-black border-primary/20 text-primary hover:bg-primary/5 px-4 shrink-0"
              asChild
            >
              <Link href="/production">
                <LayoutDashboard className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'نظام الإنتاج' : 'ERP Login'}
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-lg h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? 'right' : 'left'} className="w-[320px] border-none flex flex-col p-0 overflow-hidden">
              <div className="flex flex-col h-full" dir={dir}>
                <SheetHeader className="p-6 border-b border-border/50 bg-muted/20 text-right">
                  <SheetTitle className={cn("flex items-center gap-3", isRtl ? "justify-end" : "justify-start")}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm p-0 flex items-center justify-center border border-primary/5 shrink-0">
                      <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-xs font-black leading-tight text-primary uppercase tracking-tighter">
                        {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Cooperative'}
                      </h1>
                      <p className="text-[9px] text-muted-foreground font-bold opacity-60 uppercase tracking-widest">
                        {lang === 'ar' ? 'اليمن - شبوة' : 'Shabwa - Yemen'}
                      </p>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="flex-1">
                  <div className="p-4 flex flex-col gap-1">
                    {mobileLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center gap-4 text-sm font-black p-4 rounded-lg transition-all active:scale-95 group",
                            isActive 
                              ? "bg-primary text-white" 
                              : "text-foreground/80 hover:bg-primary/5 hover:text-primary",
                            isRtl ? "flex-row-reverse text-right" : "text-left"
                          )}
                        >
                          <span className={cn(
                            "shrink-0",
                            isActive ? "text-white" : "text-primary/60 group-hover:text-primary"
                          )}>{link.icon}</span>
                          <span className="flex-1">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border/50 bg-background grid grid-cols-2 gap-3">
                  <Button variant="outline" className={cn("gap-2 h-12 rounded-lg text-[10px] font-black border-border/60", isRtl && "flex-row-reverse")} asChild>
                    <Link href="/production">
                      <LayoutDashboard className="w-4 h-4" />
                      {lang === 'ar' ? 'نظام الإنتاج' : 'ERP Login'}
                    </Link>
                  </Button>
                  <Button className={cn("gap-2 h-12 rounded-lg text-[10px] font-black shadow-lg shadow-primary/20", isRtl && "flex-row-reverse")} asChild>
                    <a href="https://wa.me/967771687041" target="_blank" rel="noopener noreferrer">
                      <Phone className="w-4 h-4" />
                      {lang === 'ar' ? 'واتساب' : 'WhatsApp'}
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}