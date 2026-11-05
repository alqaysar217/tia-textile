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
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-lg transition-all duration-500 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img 
          src={product.image} 
          alt={lang === 'ar' ? product.nameAr : product.nameEn}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 right-2 left-2 flex justify-between items-start gap-1">
          <Badge variant={status.variant} className="shadow-md backdrop-blur-md bg-opacity-90 rounded-lg text-[9px] md:text-[10px] py-0.5 px-2">
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </Badge>
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground shadow-md rounded-lg text-[9px] md:text-[10px] py-0.5 px-2">
              {lang === 'ar' ? 'جديد' : 'New'}
            </Badge>
          )}
        </div>
        
        {/* Desktop Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform bg-white/90" asChild title={t.products.quickView}>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-4 w-4 text-primary" />
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform"
            onClick={() => addToCart({ ...product, quantity: 1 })}
            title={t.products.addToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 md:p-4 flex flex-col flex-grow space-y-1.5 md:space-y-2">
        <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] text-primary/70 font-black uppercase tracking-widest">
          <Tag className="h-2.5 w-2.5" />
          {lang === 'ar' ? product.categoryAr : product.categoryEn}
        </div>
        
        <h3 className="text-xs md:text-base font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.4em] md:min-h-0">
          {lang === 'ar' ? product.nameAr : product.nameEn}
        </h3>
        
        <div className="pt-auto space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm md:text-xl font-black text-primary tabular-nums">
              {formattedPrice}
            </span>
            <span className="text-[9px] md:text-[10px] font-bold opacity-60">
              {lang === 'ar' ? 'ريال' : 'YER'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-xl text-[9px] md:text-[10px] font-bold h-8 md:h-10 border-primary/20 hover:bg-primary hover:text-white transition-all gap-1.5"
              asChild
            >
              <Link href={`/products/${product.id}`}>
                <Eye className="h-3 w-3" />
                {lang === 'ar' ? 'التفاصيل' : 'Details'}
              </Link>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full rounded-xl text-[9px] md:text-[10px] font-bold h-8 md:h-10 gap-1.5"
              onClick={() => addToCart({ ...product, quantity: 1 })}
            >
              <ShoppingCart className="h-3 w-3" />
              {t.products.addToCart}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
