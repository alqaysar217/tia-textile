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

  // Prevent hydration mismatch for locale-dependent numbers
  useEffect(() => {
    setMounted(true);
  }, []);

  const statusMap: any = {
    available: { labelAr: 'متوفر', labelEn: 'Available', variant: 'default' },
    out_of_stock: { labelAr: 'غير متوفر', labelEn: 'Out of Stock', variant: 'destructive' },
    limited: { labelAr: 'كمية محدودة', labelEn: 'Limited', variant: 'secondary' },
    soon: { labelAr: 'قريباً', labelEn: 'Soon', variant: 'outline' },
  };

  const status = statusMap[product.status];

  // Force 'en-US' locale for price to ensure Western Arabic numerals (0-9) even in Arabic mode
  const formattedPrice = mounted 
    ? product.price.toLocaleString('en-US') 
    : product.price.toString();

  const formattedOriginalPrice = mounted && product.originalPrice
    ? product.originalPrice.toLocaleString('en-US')
    : product.originalPrice?.toString();

  return (
    <div className="group bg-background rounded-3xl overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={product.image} 
          alt={lang === 'ar' ? product.nameAr : product.nameEn}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 left-4 flex justify-between items-start gap-2">
          <Badge variant={status.variant} className="shadow-lg backdrop-blur-md bg-opacity-80">
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </Badge>
          {product.isNew && (
            <Badge variant="accent" className="shadow-lg">
              {lang === 'ar' ? 'جديد' : 'New'}
            </Badge>
          )}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <Button variant="secondary" size="icon" className="rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-all duration-300" asChild>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-5 w-5" />
            </Link>
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-all duration-300 delay-75"
            onClick={() => addToCart({ ...product, quantity: 1 })}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4 text-center">
        <div className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-bold">
          {lang === 'ar' ? product.categoryAr : product.categoryEn}
        </div>
        <h3 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
          {lang === 'ar' ? product.nameAr : product.nameEn}
        </h3>
        
        <div className="flex items-center justify-center gap-3">
          <div className="text-xl font-bold text-primary tabular-nums">
            {formattedPrice} <span className="text-xs font-medium">{lang === 'ar' ? 'ريال' : 'YER'}</span>
          </div>
          {formattedOriginalPrice && (
            <div className="text-sm text-muted-foreground line-through decoration-destructive tabular-nums">
              {formattedOriginalPrice}
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          onClick={() => addToCart({ ...product, quantity: 1 })}
        >
          {t.products.addToCart}
        </Button>
      </div>
    </div>
  );
}