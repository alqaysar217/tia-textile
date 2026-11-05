'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, LayoutGrid, SlidersHorizontal } from 'lucide-react';
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
    <div className="py-8 md:py-16 min-h-screen bg-muted/5">
      <div className="container mx-auto px-4">
        {/* Simplified & Elegant Header */}
        <div className="mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 text-primary bg-primary/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <LayoutGrid className="h-3 w-3" />
            {lang === 'ar' ? 'تشكيلة الجمعية' : 'Association Collection'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground">
            {t.products.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl font-medium">
            {lang === 'ar' 
              ? 'تصفح أجود أنواع المعاوز اليمنية المحاكة يدوياً في مديرية الروضة.' 
              : 'Browse the finest hand-woven Yemeni Maawiz from Al-Rawdah district.'}
          </p>
        </div>

        {/* Improved Filter Bar - More Compact & Clean */}
        <div className="bg-background border border-border/50 rounded-2xl shadow-sm p-4 md:p-6 mb-10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-grow group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors rtl:left-4 rtl:right-auto" />
              <Input 
                placeholder={t.products.search}
                className="pl-12 md:pl-14 rtl:pr-12 md:rtl:pr-14 rtl:pl-4 h-12 md:h-14 rounded-xl border-muted bg-muted/10 focus:bg-background transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative min-w-[200px]">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 md:h-14 rounded-xl font-bold bg-muted/10 border-muted">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 opacity-50" />
                      <SelectValue placeholder="Category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-xl">
                    <SelectItem value="all" className="font-bold">{lang === 'ar' ? 'كل أنواع المعاوز' : 'All Maawiz Types'}</SelectItem>
                    <SelectItem value="ملكي" className="font-bold">معاوز ملكي</SelectItem>
                    <SelectItem value="حليسي" className="font-bold">معاوز حليسي</SelectItem>
                    <SelectItem value="بيضاني" className="font-bold">معاوز بيضاني</SelectItem>
                    <SelectItem value="حديدي" className="font-bold">معاوز حديدي</SelectItem>
                    <SelectItem value="سلاطيني" className="font-bold">معاوز سلاطيني</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || category !== 'all') && (
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearch(''); setCategory('all'); }} 
                  className="h-12 md:h-14 px-6 text-sm font-black text-destructive hover:bg-destructive/5 rounded-xl gap-2 border border-destructive/10"
                >
                  <X className="h-4 w-4" />
                  {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/20 px-4 py-1.5 rounded-full">
            <SlidersHorizontal className="h-3 w-3" />
            {lang === 'ar' ? `النتائج: ${filteredProducts.length} منتج` : `${filteredProducts.length} Products Found`}
          </div>
        </div>

        {/* Products Grid - Using the requested card design through the component */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-24 text-center bg-background rounded-3xl border border-border/40 shadow-sm space-y-6">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
              <Search className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">{lang === 'ar' ? 'عذراً، لم نجد نتائج' : 'No Results Found'}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto font-medium">
                {lang === 'ar' 
                  ? 'جرب البحث بكلمات أخرى أو تغيير نوع الفلترة.' 
                  : 'Try searching for something else or change the filters.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => { setSearch(''); setCategory('all'); }} className="rounded-full h-12 px-8 font-bold border-primary text-primary hover:bg-primary hover:text-white">
              {lang === 'ar' ? 'عرض جميع المعاوز' : 'Clear All Filters'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
