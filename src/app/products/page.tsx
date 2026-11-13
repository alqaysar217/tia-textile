'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
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
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

/**
 * مكون عرض القائمة المنفصل لدعم الـ Suspense وقراءة الـ Params
 */
function ProductsList() {
  const { lang, t } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // قائمة التصنيفات المعتمدة والمطابقة لنظام الإنتاج
  const categories = [
    "شبواني", "ملكي", "حليسي", "بيضاني", "حديدي", "شحري", "سلاطيني", 
    "اللحجي", "الحضرمي", "الوصابي", "التهامي", "العدني", 
    "الصنعاني", "السادة", "الشموخ", "أخرى"
  ];

  // مزامنة الفلتر مع الرابط (مثلاً عند القدوم من الصفحة الرئيسية)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // التأكد من أن التصنيف موجود في القائمة المعتمدة
      if (categories.includes(categoryParam)) {
        setCategory(categoryParam);
      } else {
        setCategory('all');
      }
    }
  }, [searchParams, categories]);

  // جلب المنتجات الحقيقية من Firestore
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const { data: firestoreProducts, loading } = useCollection<any>(productsQuery);

  const filteredProducts = useMemo(() => {
    const list = firestoreProducts?.length > 0 ? firestoreProducts : [];
    return list.filter(p => {
      if (p.status === 'deleted') return false;
      
      const name = (p.nameAr || '').toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      
      // منطق فلترة التصنيف المحسن لضمان المطابقة الدقيقة
      const productCategory = p.category ? String(p.category).trim() : '';
      const selectedCategory = category ? String(category).trim() : 'all';
      
      const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [search, category, firestoreProducts]);

  return (
    <div className="py-6 md:py-12 min-h-screen bg-muted/5">
      <div className="container mx-auto px-4">
        {/* Elegant Header */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 text-primary bg-primary/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <LayoutGrid className="h-3 w-3" />
            {lang === 'ar' ? 'تشكيلة الجمعية' : 'Association Collection'}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-foreground">
            {t.products.title}
          </h1>
          <p className="text-muted-foreground text-xs md:text-base max-w-2xl font-medium">
            {lang === 'ar' 
              ? 'تصفح أجود أنواع المعاوز اليمنية المحاكة يدوياً في مديرية الروضة.' 
              : 'Browse the finest hand-woven Yemeni Maawiz from Al-Rawdah district.'}
          </p>
        </div>

        {/* Compact & Efficient Filter Bar */}
        <div className="bg-background border border-border/50 rounded-2xl shadow-sm p-3 md:p-4 mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Input */}
            <div className="relative flex-grow group">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors rtl:left-3 rtl:right-auto" />
              <Input 
                placeholder={t.products.search}
                className="pl-10 md:pl-12 rtl:pr-10 md:rtl:pr-12 rtl:pl-3 h-10 md:h-12 rounded-xl border-muted bg-muted/10 focus:bg-background transition-all text-xs md:text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="w-40 md:w-56 shrink-0">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 md:h-12 rounded-xl font-bold bg-muted/10 border-muted text-xs md:text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="h-3 w-3 md:h-4 md:w-4 opacity-50 shrink-0" />
                    <SelectValue placeholder={lang === 'ar' ? 'الفئة' : 'Category'} />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px]">
                  <SelectItem value="all" className="font-bold">{lang === 'ar' ? 'كل المعاوز' : 'All Maawiz'}</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            {(search || category !== 'all') && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setSearch(''); setCategory('all'); }} 
                className="h-10 md:h-12 w-10 md:w-12 shrink-0 text-destructive hover:bg-destructive/5 rounded-xl border border-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/20 px-4 py-1.5 rounded-full">
            <SlidersHorizontal className="h-3 w-3" />
            {lang === 'ar' ? `النتائج: ${filteredProducts.length}` : `${filteredProducts.length} Results`}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
          {loading ? (
             <div className="col-span-full py-20 text-center font-bold text-muted-foreground animate-pulse">جاري تحميل الكتالوج...</div>
          ) : filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Enhanced Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="py-20 text-center bg-background rounded-3xl border border-border/40 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
              <Search className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black">{lang === 'ar' ? 'لا توجد نتائج' : 'No Results'}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto text-xs md:text-sm font-medium">
                {lang === 'ar' 
                  ? 'لم نجد أي معاوز تحت هذا التصنيف حالياً، جرب تصفح فئة أخرى.' 
                  : 'We couldn\'t find any items in this category. Try another one.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategory('all'); }} className="rounded-full h-10 px-6 font-bold border-primary text-primary hover:bg-primary hover:text-white">
              {lang === 'ar' ? 'عرض الكل' : 'Clear Filters'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * الصفحة الرئيسية للمنتجات مغلفة بـ Suspense لضمان عمل useSearchParams بشكل صحيح
 */
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="font-black text-primary text-xs uppercase tracking-widest animate-pulse">جاري جلب الكتالوج...</p>
        </div>
      </div>
    }>
      <ProductsList />
    </Suspense>
  );
}
