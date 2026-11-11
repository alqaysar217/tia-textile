
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  ChevronRight, 
  Search, 
  FileDown, 
  Workflow, 
  TrendingUp, 
  Layers, 
  Wallet, 
  Receipt, 
  Coins, 
  Target, 
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Info,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function OrderCostAnalysisReport() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';
  const [search, setSearch] = useState('');

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : collection(db, 'vouchers'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allVouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const analysisData = useMemo(() => {
    if (!allOrders || !allVouchers) return [];
    
    return allOrders.filter(o => o.status !== 'deleted').map(order => {
      const product = allProducts?.find(p => p.id === order.productId);
      const vouchers = allVouchers.filter(v => v.orderId === order.id && v.status !== 'deleted');

      const matCost = vouchers
        .filter(v => v.type === 'material_issue')
        .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

      const wageCost = vouchers
        .filter(v => v.type === 'production_receipt')
        .reduce((sum, v) => sum + (v.wageAmount || 0), 0);

      const overheadCost = vouchers
        .filter(v => v.type === 'overhead_cost')
        .reduce((sum, v) => sum + (v.totalAmount || 0), 0);

      const totalCost = matCost + wageCost + overheadCost;
      const completed = order.completedQty || 0;
      const avgCost = completed > 0 ? totalCost / completed : 0;
      const progress = Math.round((completed / (order.targetQty || 1)) * 100);

      return {
        ...order,
        productName: product?.nameAr || '---',
        matCost,
        wageCost,
        overheadCost,
        totalCost,
        avgCost,
        progress
      };
    });
  }, [allOrders, allVouchers, allProducts]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return analysisData.filter(d => 
      d.orderNumber?.toLowerCase().includes(s) || 
      d.title?.toLowerCase().includes(s) ||
      d.productName?.toLowerCase().includes(s)
    );
  }, [analysisData, search]);

  const totals = useMemo(() => {
    return {
      totalCost: filtered.reduce((acc, curr) => acc + curr.totalCost, 0),
      avgProgress: Math.round(filtered.reduce((acc, curr) => acc + curr.progress, 0) / (filtered.length || 1))
    };
  }, [filtered]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><Calculator className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'التقارير' : 'Reports'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600">{isRtl ? 'تحليل تكاليف الأوامر' : 'Cost Analysis'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'ربحية الدفعات وتكاليف الإنتاج' : 'Batch Profitability & Costing'}</h1>
            </div>
          </div>
          <Button variant="outline" className="h-10 px-6 font-black gap-2 border-slate-200">
            <FileDown className="w-4 h-4 text-emerald-600" /> {isRtl ? 'تصدير التحليل' : 'Export Analysis'}
          </Button>
        </div>

        <div className="mt-4 relative">
           <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
           <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بأمر الإنتاج أو نوع المنتج...' : 'Filter by batch or product...'} className={cn("h-10 bg-slate-50 border-slate-200 text-xs font-bold", isRtl ? "pr-10" : "pl-10")} />
        </div>
      </div>

      {/* TOTALS SUMMARY */}
      <div className="flex-none p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30 border-b border-slate-100">
         <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform"><TrendingUp className="w-20 h-20" /></div>
            <div className="relative z-10 space-y-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">{isRtl ? 'إجمالي تكاليف التشغيل المباشرة' : 'CONSOLIDATED OP. COSTS'}</p>
               <h3 className="text-3xl font-black tabular-nums">{totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-bold text-emerald-200">YER</span></h3>
            </div>
         </div>
         <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform"><Activity className="w-20 h-20" /></div>
            <div className="relative z-10 space-y-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? 'متوسط نسبة الإنجاز العام' : 'AVG. PIPELINE PROGRESS'}</p>
               <h3 className="text-3xl font-black tabular-nums">{totals.avgProgress}%</h3>
               <Progress value={totals.avgProgress} className="h-1.5 bg-slate-800" />
            </div>
         </div>
      </div>

      {/* ANALYSIS GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-6 no-scrollbar">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table className="text-right border-separate border-spacing-0">
               <TableHeader className="bg-slate-100/80 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>BATCH</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">MAT. COST</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">WAGES</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">OVERHEAD</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">TOTAL COST</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">UNIT COST</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">PROGRESS</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {ordersLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 animate-pulse text-slate-400 font-black">جاري تحليل التكاليف...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-slate-300 font-bold">لا توجد أوامر إنتاج مسجلة</TableCell></TableRow>
                  ) : filtered.map((d) => (
                    <TableRow key={d.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                       <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                          <div className="flex flex-col">
                             <span className="font-black text-slate-900 text-xs">{d.title}</span>
                             <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-widest">{d.orderNumber}</span>
                          </div>
                       </TableCell>
                       <TableCell className="px-6 py-4 text-center font-bold text-amber-700 tabular-nums text-xs">{d.matCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-bold text-purple-700 tabular-nums text-xs">{d.wageCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-bold text-rose-700 tabular-nums text-xs">{d.overheadCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-black text-slate-900 tabular-nums text-xs bg-slate-50/50">{d.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-black text-emerald-700 tabular-nums text-xs">{d.avgCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                       <TableCell className="px-6 py-4 text-center">
                          <div className="flex items-center gap-2 justify-center">
                             <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden relative"><div className={cn("h-full bg-emerald-500 absolute", isRtl ? "right-0" : "left-0")} style={{ width: `${d.progress}%` }} /></div>
                             <span className="text-[9px] font-black text-slate-400">{d.progress}%</span>
                          </div>
                       </TableCell>
                    </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </div>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4">
         <Info className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول التحليل: يتم حساب التكلفة بناءً على المبالغ الموثقة في السندات المرحلة فقط لضمان دقة التقارير المالية.' 
             : 'Costing Protocol: Calculations are based solely on posted voucher amounts for maximum fiscal accuracy.'}
         </p>
      </div>
    </div>
  );
}
