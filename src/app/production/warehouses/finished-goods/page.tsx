'use client';

import React, { useMemo, useState } from 'react';
import { PackageCheck, ChevronRight, Search, FileDown, History, ShoppingBag, ArrowUpRight, TrendingUp, Info, Package, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function FinishedGoodsWarehousePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const isRtl = lang === 'ar';

  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const whQuery = useMemo(() => !db ? null : collection(db, 'finishedGoodsWarehouse'), [db]);

  const { data: allProducts, loading: pL } = useCollection<any>(productsQuery);
  const { data: whData, loading: wL } = useCollection<any>(whQuery);

  const filtered = useMemo(() => {
    if (!allProducts) return [];
    let list = allProducts.filter(p => p.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.nameAr?.includes(s) || p.sku?.toLowerCase().includes(s));
    }
    return list.map(p => {
      const wh = whData?.find(w => w.id === p.id);
      return { ...p, currentStock: wh?.totalQty || 0, lastIn: wh?.updatedAt };
    });
  }, [allProducts, whData, search]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><PackageCheck className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'المستودعات' : 'Warehousing'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600">{isRtl ? 'مخزن المنتجات الجاهزة' : 'Finished Goods'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'جرد المعاوز المكتملة والجاهزة للبيع' : 'Sellable Stock Master'}</h1>
            </div>
          </div>
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث في المخزن باسم المنتج أو الكود...' : 'Search stock...'} className={cn("h-10 w-80 bg-slate-50 text-xs font-bold", isRtl ? "pr-10" : "pl-10")} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-8 no-scrollbar">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
           <div className="flex-1 overflow-auto no-scrollbar">
              <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>PRODUCT / المنتج</TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>CATEGORY / الفئة</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">AVAILABLE STOCK / الرصيد</TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>LAST IN / آخر دخول</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {filtered.map(p => (
                     <TableRow key={p.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                        <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                           <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 rounded-2xl border shadow-sm shrink-0">
                                 <AvatarImage src={p.image} className="object-cover" />
                                 <AvatarFallback>FG</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                 <span className="font-black text-slate-900 text-sm">{p.nameAr}</span>
                                 <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-widest uppercase">{p.sku}</span>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                           <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">{p.category}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-slate-900 tabular-nums">{(p.currentStock || 0).toLocaleString('en-US')}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'قطعة جاهزة' : 'Finished Pcs'}</span>
                           </div>
                        </TableCell>
                        <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                           <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                              <History className="w-3.5 h-3.5 opacity-40" />
                              {p.lastIn?.toDate?.().toLocaleString(isRtl ? 'ar-YE' : 'en-US') || '---'}
                           </div>
                        </TableCell>
                     </TableRow>
                   ))}
                   {filtered.length === 0 && !pL && (
                     <TableRow>
                       <TableCell colSpan={4} className="py-20 text-center">
                         <div className="flex flex-col items-center gap-2 opacity-30">
                           <Package className="w-12 h-12" />
                           <p className="font-black text-xs">{isRtl ? 'المستودع فارغ حالياً' : 'Warehouse is empty'}</p>
                         </div>
                       </TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
           </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4">
         <Info className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
            {isRtl 
              ? 'مخزن المنجز: يمثل هذا الرصيد المنتجات التي مرت بكافة مراحل الجودة وتم ترحيلها رسمياً من خطوط الإنتاج لصالة المبيعات.' 
              : 'Finished stock reflects items that passed all QC stages and were officially transferred from production.'}
         </p>
      </div>
    </div>
  );
}