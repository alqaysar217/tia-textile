'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useCart } from '@/components/CartProvider';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, Phone, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { lang, t, dir } = useTranslation();
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPrice = (price: number) => {
    return mounted ? price.toLocaleString('en-US') : price.toString();
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
    <div className="py-8 md:py-16 bg-muted/5 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black text-foreground">{t.cart.title}</h1>
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {totalItems} {lang === 'ar' ? 'منتجات في سلتك' : 'Items in your cart'}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-black gap-2 w-fit" asChild>
            <Link href="/products">
              {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {t.cart.continue}
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cart Items List - Row Style */}
          <div className="lg:col-span-8 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="group relative flex items-center gap-3 md:gap-6 p-3 md:p-4 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                {/* Compact Image */}
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 bg-muted/20 border border-border/10">
                  <img src={item.image} alt={item.nameAr} className="w-full h-full object-cover" />
                </div>
                
                {/* Compact Info Section */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
                  <div className="space-y-0.5">
                    <h3 className="text-sm md:text-lg font-black leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {lang === 'ar' ? item.nameAr : item.nameEn}
                    </h3>
                    <p className="text-primary font-bold text-xs md:text-base tabular-nums">
                      {formatPrice(item.price)} <span className="text-[10px] opacity-60">{lang === 'ar' ? 'ريال' : 'YER'}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8">
                    {/* Compact Quantity Selector */}
                    <div className="flex items-center bg-muted/30 rounded-lg p-0.5 border border-border/50 scale-90 md:scale-100 origin-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 md:h-8 md:w-8 rounded-md hover:bg-background"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 md:w-10 text-center font-black text-sm md:text-base tabular-nums">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 md:h-8 md:w-8 rounded-md hover:bg-background"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{lang === 'ar' ? 'المجموع' : 'Subtotal'}</p>
                        <p className="text-sm md:text-lg font-black tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-full h-8 w-8"
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

          {/* Compact Summary Card */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-[#1D3323] text-[#F4F1E9] p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 textile-pattern opacity-[0.03] pointer-events-none" />
              
              <div className="relative z-10 space-y-5">
                <h2 className="text-xl md:text-2xl font-black border-b border-white/10 pb-4">
                  {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-white/50 text-xs font-bold">
                    <span>{lang === 'ar' ? 'عدد المنتجات' : 'Total Items'}</span>
                    <span className="tabular-nums text-white">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/50 text-xs font-bold">
                    <span>{lang === 'ar' ? 'رسوم التوصيل' : 'Shipping'}</span>
                    <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-full text-primary-foreground/80">
                      {lang === 'ar' ? 'تحدد لاحقاً' : 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-white/50 text-xs font-bold">{t.cart.total}</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-primary tabular-nums">
                    {formatPrice(totalPrice)}
                    <span className="text-[10px] font-bold text-white/30 ms-1.5 uppercase">{lang === 'ar' ? 'ريال يمني' : 'YER'}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    className="w-full h-14 rounded-xl text-base font-black gap-2 shadow-lg bg-[#25D366] hover:bg-[#128C7E] text-white border-none" 
                    onClick={handleWhatsAppCheckout}
                  >
                    <Phone className="h-5 w-5" />
                    {t.cart.checkout}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl text-xs font-bold bg-transparent border-white/10 hover:bg-white/5 text-white" 
                    asChild
                  >
                    <Link href="/products">{t.cart.continue}</Link>
                  </Button>
                </div>

                <p className="text-[9px] text-center text-white/30 leading-relaxed font-medium pt-2">
                  * {lang === 'ar' 
                    ? 'سيتم تحويلك إلى واتساب لتأكيد تفاصيل الاستلام.' 
                    : 'WhatsApp checkout for delivery confirmation.'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary opacity-40" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                {lang === 'ar' ? 'تسوق آمن ومباشر' : 'Secure Shopping'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
