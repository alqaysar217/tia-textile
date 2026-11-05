
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useCart } from '@/components/CartProvider';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, Phone } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { lang, t } = useTranslation();
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
      <div className="py-24 container mx-auto px-4 text-center space-y-8">
        <h1 className="text-4xl font-bold">{t.cart.title}</h1>
        <div className="py-12 bg-muted/20 rounded-2xl">
          <p className="text-xl text-muted-foreground">{t.cart.empty}</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/products">{t.products.viewAll}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-20 container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-12">{t.cart.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-background rounded-2xl border shadow-sm">
              <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0">
                <img src={item.image} alt={item.nameAr} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow space-y-2">
                <h3 className="text-xl font-bold">{lang === 'ar' ? item.nameAr : item.nameEn}</h3>
                <p className="text-primary font-bold tabular-nums">{formatPrice(item.price)} ريال</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center border rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-bold tabular-nums">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="text-right sm:text-left flex flex-col justify-between">
                <div className="text-lg font-bold tabular-nums">{formatPrice(item.price * item.quantity)} ريال</div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-foreground text-background p-8 rounded-2xl space-y-6">
            <h2 className="text-2xl font-bold border-b border-white/10 pb-4">ملخص الطلب</h2>
            <div className="flex justify-between text-lg">
              <span>عدد المنتجات</span>
              <span className="tabular-nums">{totalItems}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-primary pt-4 border-t border-white/10">
              <span>{t.cart.total}</span>
              <span className="tabular-nums">{formatPrice(totalPrice)} ريال</span>
            </div>
            <p className="text-xs text-muted-foreground">
              * سيتم التواصل معكم عبر واتساب لتأكيد توفر المنتجات وتكاليف الشحن إن وجدت.
            </p>
            <Button className="w-full h-14 text-lg gap-2" onClick={handleWhatsAppCheckout}>
              <Phone className="h-5 w-5" />
              {t.cart.checkout}
            </Button>
            <Button variant="outline" className="w-full bg-transparent border-white/20 hover:bg-white/10" asChild>
              <Link href="/products">{t.cart.continue}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
