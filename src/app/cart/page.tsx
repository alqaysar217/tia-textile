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
        {/* Decorative background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground animate-pulse">
          <ShoppingBag className="w-12 h-12" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-black">{t.cart.title}</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium">
            {t.cart.empty}
          </p>
        </div>
        
        <Button size="lg" className="rounded-full h-14 px-10 text-lg shadow-xl hover:scale-105 transition-transform" asChild>
          <Link href="/products">{t.products.viewAll}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20 bg-muted/5 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-10 md:mb-16">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black text-foreground">{t.cart.title}</h1>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {totalItems} {lang === 'ar' ? 'منتجات في سلتك' : 'Items in your cart'}
            </div>
          </div>
          <Button variant="ghost" className="text-primary font-black gap-2 hidden md:flex" asChild>
            <Link href="/products">
              {dir === 'rtl' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
              {t.cart.continue}
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="group relative flex flex-col sm:flex-row gap-4 md:gap-8 p-4 md:p-6 bg-background rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                {/* Image Section */}
                <div className="w-full sm:w-40 md:w-48 aspect-square rounded-2xl overflow-hidden shrink-0 bg-muted/20 border border-border/20">
                  <img src={item.image} alt={item.nameAr} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                
                {/* Details Section */}
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-lg md:text-2xl font-black leading-tight group-hover:text-primary transition-colors">
                        {lang === 'ar' ? item.nameAr : item.nameEn}
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 md:h-10 md:w-10 shrink-0"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </div>
                    <p className="text-primary font-black text-lg md:text-xl tabular-nums">
                      {formatPrice(item.price)} <span className="text-xs font-bold opacity-60 ms-1">{lang === 'ar' ? 'ريال' : 'YER'}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center bg-muted/20 rounded-xl p-1 border border-border/50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg hover:bg-background shadow-none"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <span className="w-10 md:w-14 text-center font-black text-lg tabular-nums">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg hover:bg-background shadow-none"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{lang === 'ar' ? 'المجموع' : 'Subtotal'}</p>
                      <p className="text-lg md:text-2xl font-black tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Side Card */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-[#1D3323] text-[#F4F1E9] p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-primary/20 space-y-8 relative overflow-hidden group">
              {/* Pattern overlay */}
              <div className="absolute inset-0 textile-pattern opacity-[0.05] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl md:text-3xl font-black border-b border-white/10 pb-6">
                  {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-white/60 font-bold">
                    <span>{lang === 'ar' ? 'عدد المنتجات' : 'Total Items'}</span>
                    <span className="tabular-nums text-white text-lg">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60 font-bold">
                    <span>{lang === 'ar' ? 'رسوم التوصيل' : 'Shipping'}</span>
                    <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-primary-foreground">
                      {lang === 'ar' ? 'تحدد لاحقاً' : 'To be calculated'}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-white/60 font-bold">{t.cart.total}</span>
                  </div>
                  <div className="text-3xl md:text-5xl font-black text-primary tabular-nums">
                    {formatPrice(totalPrice)}
                    <span className="text-xs font-bold text-white/40 ms-2 uppercase">{lang === 'ar' ? 'ريال يمني' : 'YER'}</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
                  <p className="text-[10px] md:text-xs text-white/50 leading-relaxed font-medium">
                    * {lang === 'ar' 
                      ? 'سيتم تحويلك إلى واتساب للتواصل مع فريق المبيعات لتأكيد التوفر وطرق الاستلام.' 
                      : 'You will be redirected to WhatsApp to confirm availability and delivery details.'}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    className="w-full h-16 rounded-2xl text-lg font-black gap-3 shadow-xl hover:scale-[1.02] transition-all bg-[#25D366] hover:bg-[#128C7E] text-white border-none" 
                    onClick={handleWhatsAppCheckout}
                  >
                    <Phone className="h-6 w-6" />
                    {t.cart.checkout}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl text-base font-bold bg-transparent border-white/20 hover:bg-white/10 text-white" 
                    asChild
                  >
                    <Link href="/products">{t.cart.continue}</Link>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Safe Shopping Badge */}
            <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                {lang === 'ar' ? 'تسوق آمن ومباشر' : 'Secure & Direct Shopping'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
