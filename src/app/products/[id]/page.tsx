
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/components/LanguageProvider';
import { useCart } from '@/components/CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Phone, ArrowRight, ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { lang, t, dir } = useTranslation();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Demo product (will be fetched via useDoc in real scenario)
  const product = {
    id,
    nameAr: 'معوز ملكي فاخر',
    nameEn: 'Premium Royal Maawiz',
    descriptionAr: 'هذا المعوز الملكي من أجود أنواع الخيوط القطنية، حياكة يدوية متقنة تعكس التراث اليمني الأصيل. يتميز بنقوش فريدة وألوان ثابتة تدوم طويلاً.',
    descriptionEn: 'This Royal Maawiz is made from the finest cotton threads, expertly hand-woven reflecting authentic Yemeni heritage. It features unique patterns and long-lasting fast colors.',
    price: 15000,
    categoryAr: 'ملكي',
    categoryEn: 'Royal',
    image: 'https://picsum.photos/seed/p1/800/1000',
    status: 'available',
    isNew: true,
    sku: 'RW-001'
  };

  const handleWhatsAppOrder = () => {
    const message = `السلام عليكم، أرغب في طلب المنتج: ${lang === 'ar' ? product.nameAr : product.nameEn} (كود: ${product.sku})\nالكمية: ${quantity}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/967771687041?text=${encoded}`, '_blank');
  };

  const formattedPrice = mounted 
    ? product.price.toLocaleString('en-US') 
    : product.price.toString();

  return (
    <div className="py-20 bg-muted/5">
      <div className="container mx-auto px-4">
        <Link href="/products" className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:underline">
          {dir === 'rtl' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          {lang === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border bg-background">
              <img src={product.image} alt={product.nameAr} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="primary">{lang === 'ar' ? product.categoryAr : product.categoryEn}</Badge>
                {product.isNew && <Badge variant="accent">{lang === 'ar' ? 'جديد' : 'New'}</Badge>}
              </div>
              <h1 className="text-4xl font-bold">{lang === 'ar' ? product.nameAr : product.nameEn}</h1>
              <div className="text-3xl font-bold text-primary tabular-nums">
                {formattedPrice} <span className="text-xs font-medium opacity-70">{lang === 'ar' ? 'ريال' : 'YER'}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {lang === 'ar' ? product.descriptionAr : product.descriptionEn}
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-6">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <Button variant="ghost" className="h-12 w-12 rounded-none" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <Button variant="ghost" className="h-12 w-12 rounded-none" onClick={() => setQuantity(q => q + 1)}>+</Button>
                </div>
                <Button className="flex-grow h-14 text-lg gap-2" onClick={() => addToCart({ ...product, quantity })}>
                  <ShoppingCart className="h-5 w-5" />
                  {t.products.addToCart}
                </Button>
              </div>
              <Button variant="outline" className="w-full h-14 text-lg gap-2" onClick={handleWhatsAppOrder}>
                <Phone className="h-5 w-5" />
                {t.cart.checkout}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-xs font-bold">{lang === 'ar' ? 'جودة مضمونة' : 'Guaranteed Quality'}</div>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Truck className="h-6 w-6" />
                </div>
                <div className="text-xs font-bold">{lang === 'ar' ? 'توصيل متاح' : 'Delivery Available'}</div>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div className="text-xs font-bold">{lang === 'ar' ? 'دعم مستمر' : '24/7 Support'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
