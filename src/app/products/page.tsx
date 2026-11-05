'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
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

  // Demo data
  const allProducts = [
    { id: '1', nameAr: 'معوز ملكي فاخر', nameEn: 'Premium Royal Maawiz', price: 15000, categoryAr: 'ملكي', categoryEn: 'Royal', image: 'https://picsum.photos/seed/p1/600/800', status: 'available' },
    { id: '2', nameAr: 'معوز حليسي كلاسيك', nameEn: 'Classic Halisi Maawiz', price: 12000, categoryAr: 'حليسي', categoryEn: 'Halisi', image: 'https://picsum.photos/seed/p2/600/800', status: 'available' },
    { id: '3', nameAr: 'شال يمني يدوي', nameEn: 'Handmade Yemeni Shawl', price: 8000, categoryAr: 'شيلان', categoryEn: 'Shawls', image: 'https://picsum.photos/seed/p3/600/800', status: 'limited' },
    { id: '4', nameAr: 'قميص شعبي قطني', nameEn: 'Cotton Traditional Shirt', price: 5000, categoryAr: 'شمزان', categoryEn: 'Shirts', image: 'https://picsum.photos/seed/p4/600/800', status: 'available' },
    { id: '5', nameAr: 'معوز بيضاني مطرز', nameEn: 'Embroidered Baidani Maawiz', price: 14000, categoryAr: 'بيضاني', categoryEn: 'Baidani', image: 'https://picsum.photos/seed/p5/600/800', status: 'available' },
    { id: '6', nameAr: 'معوز حديدي ثقيل', nameEn: 'Heavy Hadidi Maawiz', price: 11000, categoryAr: 'حديدي', categoryEn: 'Hadidi', image: 'https://picsum.photos/seed/p6/600/800', status: 'out_of_stock' }
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
    <div className="py-12 md:py-20 min-h-screen bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="mb-8 md:mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">{t.products.title}</h1>
          <p className="text-muted-foreground text-sm md:text-base">{t.products.subtitle}</p>
        </div>

        <div className="bg-background p-4 md:p-6 rounded-2xl shadow-sm border mb-8 md:mb-12 flex flex-col lg:flex-row gap-4 md:gap-6 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground rtl:left-3 rtl:right-auto" />
            <Input 
              placeholder={t.products.search}
              className="pl-10 md:pl-12 rtl:pr-10 md:rtl:pr-12 rtl:pl-4 h-10 md:h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-muted-foreground">
              <Filter className="h-4 w-4" />
              {t.products.filter}:
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 md:h-12 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                <SelectItem value="ملكي">ملكي</SelectItem>
                <SelectItem value="حليسي">حليسي</SelectItem>
                <SelectItem value="بيضاني">بيضاني</SelectItem>
                <SelectItem value="حديدي">حديدي</SelectItem>
                <SelectItem value="شمزان">شمزان</SelectItem>
                <SelectItem value="شيلان">شيلان</SelectItem>
              </SelectContent>
            </Select>

            {(search || category !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory('all'); }} className="text-xs font-bold">
                <X className="h-4 w-4 mr-2" />
                {lang === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-muted-foreground text-lg">{lang === 'ar' ? 'لا توجد منتجات تطابق بحثك.' : 'No products match your search.'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
