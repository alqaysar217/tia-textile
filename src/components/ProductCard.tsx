'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
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
    out_of_stock: { labelAr: 'غير متوفر', labelEn: 'Out of Stock', variant: 'destructive' },
    limited: { labelAr: 'كمية محدودة', labelEn: 'Limited', variant: 'secondary' },
    soon: { labelAr: 'قريباً', labelEn: 'Soon', variant: 'outline' },
  };

  const status = statusMap[product.status] || statusMap.available;

  const formattedPrice = mounted 
    ? product.price.toLocaleString('en-US') 
    : product.price.toString();

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-xl transition-all duration-500">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img 
          src={product.image} 
          alt={lang === 'ar' ? product.nameAr : product.nameEn}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-100"
          style={{ backfaceVisibility: 'hidden' }}
        />
        
        <div className="absolute top-4 right-4 left-4 flex justify-between items-start">
          <Badge variant={status.variant} className="shadow-sm backdrop-blur-md bg-opacity-90 rounded-lg">
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </Badge>
          {product.isNew && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground shadow-sm rounded-lg">
              {lang === 'ar' ? 'جديد' : 'New'}
            </Badge>
          )}
        </div>
        
        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button variant="secondary" size="icon" className="rounded-2xl shadow-lg hover:scale-110 transition-transform" asChild>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-5 w-5" />
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-2xl shadow-lg hover:scale-110 transition-transform"
            onClick={() => addToCart({ ...product, quantity: 1 })}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-3">
        <div className="text-[10px] text-primary/60 font-black uppercase tracking-widest">
          {lang === 'ar' ? product.categoryAr : product.categoryEn}
        </div>
        <h3 className="text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
          {lang === 'ar' ? product.nameAr : product.nameEn}
        </h3>
        
        <div className="flex items-center justify-between pt-2">
          <div className="text-lg font-bold text-primary tabular-nums">
            {formattedPrice} <span className="text-xs font-medium opacity-70">{lang === 'ar' ? 'ريال' : 'YER'}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
            onClick={() => addToCart({ ...product, quantity: 1 })}
          >
            {t.products.addToCart}
          </Button>
        </div>
      </div>
    </div>
  );
}
