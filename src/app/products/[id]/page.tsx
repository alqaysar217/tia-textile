
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/components/LanguageProvider';
import { useCart } from '@/components/CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  Minus,
  Plus,
  Share2,
  Heart
} from 'lucide-react';
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
    nameAr: 'معوز ملكي فاخر - نقشة خاصة',
    nameEn: 'Premium Royal Maawiz - Special Pattern',
    descriptionAr: 'هذا المعوز الملكي من أجود أنواع الخيوط القطنية، حياكة يدوية متقنة تعكس التراث اليمني الأصيل من مديرية الروضة. يتميز بنقوش فريدة وألوان ثابتة تدوم طويلاً، ويعتبر قطعة فنية تعبر عن الهوية اليمنية العريقة.',
    descriptionEn: 'This Royal Maawiz is made from the finest cotton threads, expertly hand-woven reflecting authentic Yemeni heritage from Al-Rawdah district. It features unique patterns and long-lasting fast colors, serving as a masterpiece of ancient Yemeni identity.',
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
    <div className="py-8 md:py-16 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <Link href="/products" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
            {dir === 'rtl' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            <span className="text-sm md:text-base">{lang === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10">
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10">
              <Share2 className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
          {/* Gallery Section */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] md:aspect-square rounded-2xl md:rounded-3xl overflow-hidden border bg-muted/20 relative group">
              <img 
                src={product.image} 
                alt={product.nameAr} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              {product.isNew && (
                <Badge className="absolute top-4 right-4 md:top-6 md:right-6 bg-primary px-3 py-1 text-xs md:text-sm font-bold shadow-lg">
                  {lang === 'ar' ? 'جديد' : 'New'}
                </Badge>
              )}
            </div>
            {/* Thumbnail Placeholder for future extension */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-lg md:rounded-xl overflow-hidden border cursor-pointer hover:border-primary transition-colors">
                  <img src={`${product.image}?v=${i}`} alt="thumb" className="w-full h-full object-cover opacity-60 hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-5 space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <div className="inline-flex items-center gap-2 text-primary font-black text-[10px] md:text-xs uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
                {lang === 'ar' ? product.categoryAr : product.categoryEn}
              </div>
              <h1 className="text-2xl md:text-4xl font-black leading-tight text-foreground">
                {lang === 'ar' ? product.nameAr : product.nameEn}
              </h1>
              <div className="flex items-center gap-4">
                <div className="text-2xl md:text-4xl font-black text-primary tabular-nums">
                  {formattedPrice}
                  <span className="text-sm md:text-base font-bold opacity-70 ms-2">{lang === 'ar' ? 'ريال يمني' : 'YER'}</span>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-bold">
                  {lang === 'ar' ? 'متوفر بالمخزن' : 'In Stock'}
                </Badge>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground font-bold">
                {lang === 'ar' ? 'رمز المنتج:' : 'SKU:'} <span className="text-foreground">{product.sku}</span>
              </div>
            </div>

            <div className="prose prose-sm md:prose-base text-muted-foreground leading-relaxed font-medium">
              <p>{lang === 'ar' ? product.descriptionAr : product.descriptionEn}</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border border-input rounded-xl bg-muted/10 h-12 md:h-14 w-full sm:w-auto">
                  <Button 
                    variant="ghost" 
                    className="h-full px-4 rounded-none hover:bg-primary/5 transition-colors" 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-black tabular-nums text-lg">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    className="h-full px-4 rounded-none hover:bg-primary/5 transition-colors" 
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Add to Cart */}
                <Button 
                  className="w-full sm:flex-grow h-12 md:h-14 text-base md:text-lg font-bold gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
                  onClick={() => addToCart({ ...product, quantity })}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {t.products.addToCart}
                </Button>
              </div>

              {/* WhatsApp Checkout */}
              <Button 
                variant="outline" 
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold gap-3 border-primary/30 text-primary hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all" 
                onClick={handleWhatsAppOrder}
              >
                <Phone className="h-5 w-5" />
                {t.cart.checkout}
              </Button>
            </div>

            {/* Trust Badges - Improved Layout */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-6 md:pt-8 border-t border-border/50">
              <div className="p-3 md:p-4 rounded-2xl bg-muted/20 text-center space-y-2 border border-border/50 group hover:bg-background transition-colors">
                <div className="mx-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="text-[9px] md:text-xs font-black uppercase tracking-tight">{lang === 'ar' ? 'جودة مضمونة' : 'Authentic'}</div>
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-muted/20 text-center space-y-2 border border-border/50 group hover:bg-background transition-colors">
                <div className="mx-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Truck className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="text-[9px] md:text-xs font-black uppercase tracking-tight">{lang === 'ar' ? 'توصيل متاح' : 'Fast Delivery'}</div>
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-muted/20 text-center space-y-2 border border-border/50 group hover:bg-background transition-colors">
                <div className="mx-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="text-[9px] md:text-xs font-black uppercase tracking-tight">{lang === 'ar' ? 'دعم مستمر' : '24/7 Support'}</div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <h4 className="text-xs md:text-sm font-black text-primary">{lang === 'ar' ? 'ملاحظات الشراء:' : 'Purchase Notes:'}</h4>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'جميع المعاوز تحاك يدوياً، لذا قد تختلف النقشة بشكل طفيف جداً عن الصورة، مما يضمن تميز كل قطعة.' 
                  : 'All Maawiz are hand-woven, so the pattern may vary very slightly from the image, ensuring each piece is unique.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
