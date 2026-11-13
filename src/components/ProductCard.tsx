'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye, Tag, Wallet } from 'lucide-react';
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
    <div className="group bg-card rounded-xl overflow-hidden border border-border/40 hover:shadow-md transition-all duration-500 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={product.image} 
          alt={lang === 'ar' ? product.nameAr : product.nameEn}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 right-2 left-2 flex justify-between items-start gap-1">
          <Badge variant={status.variant} className="shadow-sm backdrop-blur-md bg-opacity-90 rounded-md text-[8px] md:text-[9px] py-0 px-1.5">
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </Badge>
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground shadow-sm rounded-md text-[8px] md:text-[9px] py-0 px-1.5">
              {lang === 'ar' ? 'جديد' : 'New'}
            </Badge>
          )}
        </div>
        
        {/* Desktop Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2">
          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform bg-white/90" asChild title={t.products.quickView}>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-3.5 w-3.5 text-primary" />
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform"
            onClick={() => addToCart({ ...product, quantity: 1 })}
            title={t.products.addToCart}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-2.5 md:p-3.5 flex flex-col flex-grow space-y-2 md:space-y-3">
        <Link href={`/products/${product.id}`} className="block space-y-1.5 md:space-y-2 group/text">
          {/* Row 1: Name */}
          <h3 className="text-[11px] md:text-sm font-black line-clamp-1 leading-tight group-hover/text:text-primary transition-colors">
            {lang === 'ar' ? product.nameAr : product.nameEn}
          </h3>
          
          {/* Row 2: Price and Category */}
          <div className="flex items-center justify-between gap-2 border-t border-border/5 pt-2">
            {/* Price with Wallet Icon */}
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3 w-3 md:h-4 md:w-4 text-primary/60 shrink-0" />
              <div className="flex items-baseline gap-0.5 md:gap-1">
                <span className="text-xs md:text-lg font-black text-primary tabular-nums">
                  {formattedPrice}
                </span>
                <span className="text-[7px] md:text-[9px] font-bold opacity-60">
                  {lang === 'ar' ? 'ريال' : 'YER'}
                </span>
              </div>
            </div>

            {/* Category with Tag Icon */}
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate max-w-[50%] bg-muted/40 px-2 py-0.5 rounded-md">
              <Tag className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 shrink-0 text-primary/50" />
              {product.category}
            </div>
          </div>
        </Link>
        
        <div className="mt-auto">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full rounded-lg text-[8px] md:text-[10px] font-black h-7 md:h-10 gap-1.5 shadow-sm active:scale-95 transition-all"
            onClick={() => addToCart({ ...product, quantity: 1 })}
          >
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
            {t.products.addToCart}
          </Button>
        </div>
      </div>
    </div>
  );
}
