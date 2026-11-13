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
  const { lang, t, dir } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const isRtl = lang === 'ar';
  
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
      // تنظيف النص وتجربة المطابقة المباشرة أو الجزئية
      const decodedParam = decodeURIComponent(categoryParam);
      const cleanParam = decodedParam.replace('المعوز ', '').trim();
      
      if (categories.includes(cleanParam)) {
        setCategory(cleanParam);
      } else if (categories.includes(decodedParam)) {
        setCategory(decodedParam);
      } else {
        setCategory('all');
      }
    } else {
      setCategory('all');
    }
  }, [searchParams]);

  // جلب المنتجات الحقيقية من Firestore
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const { data: firestoreProducts, loading } = useCollection<any>(productsQuery);

  const filteredProducts = useMemo(() => {
    const list = firestoreProducts?.length > 0 ? firestoreProducts : [];
    const result = list.filter(p => {
      if (p.status === 'deleted') return false;
      
      const name = (p.nameAr || '').toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      
      // منطق فلترة التصنيف المحسن لضمان المطابقة الدقيقة
      const productCategory = p.category ? String(p.category).trim() : '';
      const selectedCategory = category ? String(category).trim() : 'all';
      
      const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // الترتيب الذكي: أولاً حسب رقم الترتيب (تصاعدي)، ثم حسب الأحدث
    return result.sort((a, b) => {
      const orderA = Number(a.displayOrder || 9999);
      const orderB = Number(b.displayOrder || 9999);
      if (orderA !== orderB) return orderA - orderB;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [search, category, firestoreProducts]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* الخلفية الزخرفية الموحدة */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 -mr-64 -mt-64" />

      {/* رأس الصفحة بتصميم مطابق للواجهات الأخرى */}
      <div className="py-12 md:py-20 bg-primary relative text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 104l-30-17.321L0 104V69.359L30 52l30 17.359V104zm0-69.359L30 17.321 0 34.641V0l30 17.321L60 0v34.641z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 138px'
          }} 
        />
        
        <div className="container mx-auto px-4 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 mx-auto">
            <LayoutGrid className="h-3 w-3" />
            {isRtl ? 'تشكيلة الجمعية المتميزة' : 'ASSOCIATION PREMIUM COLLECTION'}
          </div>
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-2xl">
            {t.products.title}
          </h1>
          <p className="text-sm md:text-lg opacity-80 max-w-2xl mx-auto font-medium leading-relaxed">
            {lang === 'ar' 
              ? 'تصفح أجود أنواع المعاوز اليمنية المحاكة يدوياً في مديرية الروضة بمحافظة شبوة.' 
              : 'Browse the finest hand-woven Yemeni Maawiz from Al-Rawdah district in Shabwah governorate.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-16 max-w-7xl relative z-10">
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
