'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, LayoutGrid } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProductsPage() {
  const { lang, t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Updated demo data focusing only on Maawiz
  const allProducts = [
    { id: '1', nameAr: 'معوز ملكي فاخر - نقشة خاصة', nameEn: 'Premium Royal Maawiz - Special Pattern', price: 15000, categoryAr: 'ملكي', categoryEn: 'Royal', image: 'https://picsum.photos/seed/m1/600/800', status: 'available', isNew: true },
    { id: '2', nameAr: 'معوز حليسي كلاسيك - يدوي', nameEn: 'Classic Halisi Maawiz - Handmade', price: 12000, categoryAr: 'حليسي', categoryEn: 'Halisi', image: 'https://picsum.photos/seed/m2/600/800', status: 'available' },
    { id: '3', nameAr: 'معوز بيضاني - شغل ممتاز', nameEn: 'Baidani Maawiz - Excellent Work', price: 14000, categoryAr: 'بيضاني', categoryEn: 'Baidani', image: 'https://picsum.photos/seed/m3/600/800', status: 'available' },
    { id: '4', nameAr: 'معوز حديدي - خامة ثقيلة', nameEn: 'Hadidi Maawiz - Heavy Fabric', price: 11000, categoryAr: 'حديدي', categoryEn: 'Hadidi', image: 'https://picsum.photos/seed/m4/600/800', status: 'limited' },
    { id: '5', nameAr: 'معوز سلاطيني - نخب أول', nameEn: 'Salateeni Maawiz - Grade A', price: 18000, categoryAr: 'سلاطيني', categoryEn: 'Salateeni', image: 'https://picsum.photos/seed/m5/600/800', status: 'available', isNew: true },
    { id: '6', nameAr: 'معوز ملكي مطرز - ذهبي', nameEn: 'Embroidered Royal Maawiz - Golden', price: 16500, categoryAr: 'ملكي', categoryEn: 'Royal', image: 'https://picsum.photos/seed/m6/600/800', status: 'available' },
    { id: '7', nameAr: 'معوز حليسي أبيض - تقليدي', nameEn: 'White Halisi Maawiz - Traditional', price: 12500, categoryAr: 'حليسي', categoryEn: 'Halisi', image: 'https://picsum.photos/seed/m7/600/800', status: 'available' },
    { id: '8', nameAr: 'معوز بيضاني - نقشة عريقة', nameEn: 'Ancient Pattern Baidani Maawiz', price: 13500, categoryAr: 'بيضاني', categoryEn: 'Baidani', image: 'https://picsum.photos/seed/m8/600/800', status: 'out_of_stock' }
  ];

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const name = lang === 'ar' ? p.nameAr : p.nameEn;
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || p.categoryAr === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, lang]);

  return (
    <div className="py-12 md:py-24 min-h-screen bg-muted/10">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3">
              <LayoutGrid className="h-8 w-8 text-primary" />
              {t.products.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              {lang === 'ar' 
                ? 'استكشف تشكيلة المعاوز اليمنية الأصلية من إنتاج جمعيتنا في شبوة.' 
                : 'Explore the authentic collection of Yemeni Maawiz produced by our association in Shabwa.'}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-background p-6 rounded-2xl shadow-sm border border-border/50 mb-12 space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors rtl:left-4 rtl:right-auto" />
              <Input 
                placeholder={t.products.search}
                className="pl-12 md:pl-14 rtl:pr-12 md:rtl:pr-14 rtl:pl-4 h-14 rounded-xl text-lg border-muted hover:border-primary/50 transition-all shadow-none focus:ring-primary/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 text-sm font-black text-primary/70 uppercase tracking-widest">
                <Filter className="h-4 w-4" />
                {t.products.filter}
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px] h-14 rounded-xl font-bold border-muted hover:border-primary/50 transition-all shadow-none">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="font-bold">{lang === 'ar' ? 'جميع أنواع المعاوز' : 'All Maawiz Types'}</SelectItem>
                  <SelectItem value="ملكي" className="font-bold">معاوز ملكي</SelectItem>
                  <SelectItem value="حليسي" className="font-bold">معاوز حليسي</SelectItem>
                  <SelectItem value="بيضاني" className="font-bold">معاوز بيضاني</SelectItem>
                  <SelectItem value="حديدي" className="font-bold">معاوز حديدي</SelectItem>
                  <SelectItem value="سلاطيني" className="font-bold">معاوز سلاطيني</SelectItem>
                </SelectContent>
              </Select>

              {(search || category !== 'all') && (
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearch(''); setCategory('all'); }} 
                  className="h-14 px-6 text-sm font-black text-destructive hover:bg-destructive/5 rounded-xl gap-2"
                >
                  <X className="h-4 w-4" />
                  {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-muted-foreground font-bold">
            {lang === 'ar' ? `عرض ${filteredProducts.length} منتج` : `Showing ${filteredProducts.length} products`}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-32 text-center bg-background rounded-3xl border border-dashed border-muted shadow-sm">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">{lang === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}</h3>
              <p className="text-muted-foreground">
                {lang === 'ar' 
                  ? 'لم نجد أي معاوز تطابق بحثك الحالي، جرب كلمات بحث أخرى.' 
                  : 'We could not find any Maawiz matching your search, try other terms.'}
              </p>
              <Button variant="outline" onClick={() => { setSearch(''); setCategory('all'); }} className="rounded-full">
                {lang === 'ar' ? 'مسح البحث' : 'Clear Search'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
