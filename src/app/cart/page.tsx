
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useCart } from '@/components/CartProvider';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, Phone, ShoppingBag, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { lang, t, dir } = useTranslation();
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPrice = (price: number) => {
    // Return stable representation for hydration, then localized on client
    if (!mounted) return price.toString();
    return price.toLocaleString('en-US');
  };

  const handleWhatsAppCheckout = () => {
    const phone = '+967771687041';
    let message = `السلام عليكم ورحمة الله وبركاته،\n\nأرغب في طلب المنتجات التالية من جمعية الصناعات النسيجية:\n\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. اسم المنتج: ${lang === 'ar' ? item.nameAr : item.nameEn}\n`;
      message += `   الكمية: ${item.quantity}\n`;
      message += `   السعر: ${item.price.toLocaleString('en-US')} ريال\n\n`;
    });

    message += `--------------------\n`;
    message += `الإجمالي التقديري: ${totalPrice.toLocaleString('en-US')} ريال يمني.\n\n`;
    message += `أرجو تأكيد توفر المنتجات وتفاصيل استلام الطلب.\nشكراً لكم.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center space-y-8 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl md:text-4xl font-black">{t.cart.title}</h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto font-medium">
            {t.cart.empty}
          </p>
        </div>
        <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-xl" asChild>
          <Link href="/products">{t.products.viewAll}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-12 bg-muted/20 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb style navigation */}
        <div className="mb-6 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
          {dir === 'rtl' ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Link href="/products" className="hover:text-primary transition-colors">{t.nav.products}</Link>
          {dir === 'rtl' ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span className="text-primary">{t.cart.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black text-foreground">{t.cart.title}</h1>
                <p className="text-xs font-bold text-primary flex items-center gap-2">
                  <ShoppingBag className="h-3 w-3" />
                  {totalItems} {lang === 'ar' ? 'منتجات جاهزة للطلب' : 'Items ready to order'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground hover:text-primary font-black gap-2 transition-all" asChild>
                <Link href="/products">
                  {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  {t.cart.continue}
                </Link>
              </Button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="group relative flex items-center gap-3 md:gap-6 p-3 md:p-4 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                  {/* Compact Image */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 bg-muted/20 border border-border/10">
                    <img src={item.image} alt={item.nameAr} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Info Section */}
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                    <div className="md:col-span-5 space-y-0.5">
                      <h3 className="text-sm md:text-base font-black leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {lang === 'ar' ? item.nameAr : item.nameEn}
                      </h3>
                      <p className="text-primary font-bold text-[10px] md:text-sm tabular-nums opacity-70" suppressHydrationWarning>
                        {formatPrice(item.price)} <span className="text-[8px] opacity-60 uppercase">{lang === 'ar' ? 'ريال' : 'YER'}</span>
                      </p>
                    </div>
                    
                    <div className="md:col-span-7 flex items-center justify-between md:justify-end gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/20 scale-90 md:scale-100 origin-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-md hover:bg-background transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-black text-xs md:text-sm tabular-nums">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-md hover:bg-background transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4 md:gap-8 min-w-[80px] md:min-w-[120px] justify-end">
                        <div className="text-right">
                          <p className="text-sm md:text-base font-black tabular-nums" suppressHydrationWarning>{formatPrice(item.price * item.quantity)}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive/30 hover:text-destructive hover:bg-destructive/5 rounded-full h-8 w-8 transition-colors"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Continue Shopping */}
            <Button variant="outline" className="md:hidden w-full rounded-xl h-12 font-bold text-muted-foreground border-dashed" asChild>
              <Link href="/products">
                {t.cart.continue}
              </Link>
            </Button>
          </div>

          {/* Sidebar Summary Card */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-background border border-primary/10 p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -mr-12 -mt-12" />
              
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-black text-foreground">
                    {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                  </h2>
                  <div className="w-12 h-1 bg-secondary rounded-full" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-muted-foreground text-xs font-bold">
                    <span>{lang === 'ar' ? 'عدد المنتجات' : 'Total Items'}</span>
                    <span className="tabular-nums text-foreground bg-muted px-2 py-0.5 rounded-lg">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground text-xs font-bold">
                    <span>{lang === 'ar' ? 'رسوم التوصيل' : 'Shipping'}</span>
                    <span className="text-[9px] font-black text-secondary bg-secondary/5 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {lang === 'ar' ? 'تحدد لاحقاً' : 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{t.cart.total}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl md:text-4xl font-black text-primary tabular-nums" suppressHydrationWarning>
                      {formatPrice(totalPrice)}
                    </span>
                    <span className="text-[10px] md:text-xs font-black text-muted-foreground/60 uppercase">
                      {lang === 'ar' ? 'ريال يمني' : 'YER'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    className="w-full h-14 rounded-2xl text-base font-black gap-3 shadow-lg shadow-[#25D366]/20 bg-[#25D366] hover:bg-[#128C7E] text-white border-none hover:scale-[1.02] transition-all" 
                    onClick={handleWhatsAppCheckout}
                  >
                    <Phone className="h-5 w-5" />
                    {t.cart.checkout}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-2xl text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5" 
                    asChild
                  >
                    <Link href="/products" className="flex items-center justify-center gap-2">
                      {t.cart.continue}
                    </Link>
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    {lang === 'ar' ? 'تسوق آمن ومباشر' : 'Secure Shopping'}
                  </p>
                  <p className="text-[8px] text-muted-foreground/60 leading-relaxed font-medium">
                    * {lang === 'ar' 
                      ? 'سيتم تحويلك إلى واتساب لتأكيد تفاصيل الاستلام والدفع.' 
                      : 'You will be redirected to WhatsApp to confirm delivery details.'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col items-center gap-4 opacity-50">
              <img src="/images/logo.png" alt="Logo" className="w-12 h-12 grayscale" />
              <div className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">
                {lang === 'ar' ? 'جمعية الصناعات النسيجية' : 'Textile Association'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
