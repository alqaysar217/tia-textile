'use client';

import React from 'react';
import { useTranslation } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

export function ProductCard({ product }: { product: any }) {
  const { lang, t } = useTranslation();
  const { addToCart } = useCart();

  const statusMap: any = {
    available: { labelAr: 'متوفر', labelEn: 'Available', variant: 'default' },
    out_of_stock: { labelAr: 'غير متوفر', labelEn: 'Out of Stock', variant: 'destructive' },
    limited: { labelAr: 'كمية محدودة', labelEn: 'Limited', variant: 'secondary' },
    soon: { labelAr: 'قريباً', labelEn: 'Soon', variant: 'outline' },
  };

  const status = statusMap[product.status];

  return (
    <div className="group bg-background rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={product.image} 
          alt={lang === 'ar' ? product.nameAr : product.nameEn}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 left-4 flex justify-between items-start gap-2">
          <Badge variant={status.variant} className="shadow-sm">
            {lang === 'ar' ? status.labelAr : status.labelEn}
          </Badge>
          {product.isNew && (
            <Badge variant="accent" className="shadow-sm">
              {lang === 'ar' ? 'جديد' : 'New'}
            </Badge>
          )}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg" asChild>
            <Link href={`/products/${product.id}`}>
              <Eye className="h-5 w-5" />
            </Link>
          </Button>
          <Button 
            variant="primary" 
            size="icon" 
            className="rounded-full shadow-lg"
            onClick={() => addToCart({ ...product, quantity: 1 })}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-3 text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
          {lang === 'ar' ? product.categoryAr : product.categoryEn}
        </div>
        <h3 className="text-lg font-bold line-clamp-1">
          {lang === 'ar' ? product.nameAr : product.nameEn}
        </h3>
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl font-bold text-primary">
            {product.price.toLocaleString()} <small className="text-[10px]">{lang === 'ar' ? 'ريال' : 'YER'}</small>
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through decoration-destructive">
              {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={() => addToCart({ ...product, quantity: 1 })}
        >
          {t.products.addToCart}
        </Button>
      </div>
    </div>
  );
}