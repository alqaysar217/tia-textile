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
    <div className="group bg-card rounded-xl overflow-hidden border border-border/40 hover:shadow-md transition-all duration-500 flex flex-col h-full">
      {/* Image Container - Reduced size and square aspect ratio */}
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
      <div className="p-2.5 md:p-3.5 flex flex-col flex-grow space-y-1 md:space-y-1.5">
        <div className="flex items-center gap-1 text-[7px] md:text-[8px] text-primary/70 font-black uppercase tracking-widest">
          <Tag className="h-2 w-2" />
          {lang === 'ar' ? product.categoryAr : product.categoryEn}
        </div>
        
        <h3 className="text-[10px] md:text-sm font-bold line-clamp-1 leading-tight group-hover:text-primary transition-colors">
          {lang === 'ar' ? product.nameAr : product.nameEn}
        </h3>
        
        <div className="pt-auto space-y-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-xs md:text-lg font-black text-primary tabular-nums">
              {formattedPrice}
            </span>
            <span className="text-[8px] md:text-[9px] font-bold opacity-60">
              {lang === 'ar' ? 'ريال' : 'YER'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-lg text-[8px] md:text-[9px] font-bold h-7 md:h-9 border-primary/20 hover:bg-primary hover:text-white transition-all gap-1"
              asChild
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="h-2.5 w-2.5" />
                {lang === 'ar' ? 'التفاصيل' : 'Details'}
              </Link>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full rounded-lg text-[8px] md:text-[9px] font-bold h-7 md:h-9 gap-1"
              onClick={() => addToCart({ ...product, quantity: 1 })}
            >
              <ShoppingCart className="h-2.5 w-2.5" />
              {t.products.addToCart}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
