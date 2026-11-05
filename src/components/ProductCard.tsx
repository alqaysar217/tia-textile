'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye, Tag } from 'lucide-react';
import Link from 'next/link';

export function ProductCard({ product }: { product: any }) {
  const { lang, t } = useTranslation();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusMap: any = {
    available: { labelAr: 'متوفر', labelEn: 'Available', variant: 'default' },
    out_of_stock: { labelAr: 'نفذت', labelEn: 'Out of Stock', variant: 'destructive' },
    limited: { labelAr: 'محدود', labelEn: 'Limited', variant: 'secondary' },
    soon: { labelAr: 'قريباً', labelEn: 'Soon', variant: 'outline' },
  };

  const status = statusMap[product.status] || statusMap.available;

  const formattedPrice = mounted 
    ? product.price.toLocaleString('en-US') 
    : product.price.toString();

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img 
          src={product.image} 
          alt={lang === 'ar' ? product.nameAr : product.nameEn}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 right-2 left-2 flex justify-between items-start gap-2">
          <Badge variant={status.variant} className="shadow-lg backdrop-blur-md bg-opacity-90 rounded-lg text-[10px] md:text-xs py-0.5 md:py-1">
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </Badge>
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground shadow-lg rounded-lg text-[10px] md:text-xs py-0.5 md:py-1">
              {lang === 'ar' ? 'جديد' : 'New'}
            </Badge>
          )}
        </div>
        
        {/* Desktop Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-3">
          <Button variant="secondary" size="icon" className="rounded-full shadow-xl hover:scale-110 transition-transform bg-white/90" asChild title={t.products.quickView}>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-5 w-5 text-primary" />
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-full shadow-xl hover:scale-110 transition-transform"
            onClick={() => addToCart({ ...product, quantity: 1 })}
            title={t.products.addToCart}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 md:p-5 flex flex-col flex-grow space-y-2 md:space-y-3">
        <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-primary/70 font-black uppercase tracking-widest">
          <Tag className="h-3 w-3" />
          {lang === 'ar' ? product.categoryAr : product.categoryEn}
        </div>
        
        <h3 className="text-sm md:text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.5em] md:min-h-0">
          {lang === 'ar' ? product.nameAr : product.nameEn}
        </h3>
        
        <div className="pt-auto space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-base md:text-2xl font-black text-primary tabular-nums">
              {formattedPrice}
            </span>
            <span className="text-[10px] md:text-xs font-bold opacity-60">
              {lang === 'ar' ? 'ريال' : 'YER'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-xl text-[10px] md:text-xs font-bold h-9 md:h-11 border-primary/20 hover:bg-primary hover:text-white transition-all gap-2"
              asChild
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="h-3.5 w-3.5" />
                {lang === 'ar' ? 'التفاصيل' : 'Details'}
              </Link>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full rounded-xl text-[10px] md:text-xs font-bold h-9 md:h-11 gap-2"
              onClick={() => addToCart({ ...product, quantity: 1 })}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {t.products.addToCart}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
