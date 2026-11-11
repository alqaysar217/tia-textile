'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  Search, 
  FileDown, 
  Wallet, 
  Coins, 
  BarChart3, 
  CalendarDays, 
  Filter, 
  Check, 
  SortAsc, 
  SortDesc, 
  ArrowUpDown, 
  Info, 
  ShieldCheck, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Receipt,
  Activity,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FinancialGrowthReport() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('all');

  // Fetch Global Settings for Currency
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useCollection<any>(settingsRef ? query(collection(db, 'settings')) : null); // Simple fetch
  const systemCurrency = 'YER'; // Default

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : collection(db, 'vouchers'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allVouchers } = useCollection<any>(vouchersQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const financialData = useMemo(() => {
    if (!allOrders || !allVouchers || !allProducts) return [];
    
    return allOrders.filter(o => o.status !== 'deleted').map(order => {
      const product = allProducts.find(p => p.id === order.productId);
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
      
      // Revenue is based on completed items * product unit price
      const estimatedRevenue = completed * (product?.price || 0);
      const netProfit = estimatedRevenue - totalCost;
      const margin = estimatedRevenue > 0 ? (netProfit / estimatedRevenue) * 100 : 0;

      return {
        ...order,
        productName: product?.nameAr || '---',
        productId: product?.id,
        unitPrice: product?.price || 0,
        totalCost,
        estimatedRevenue,
        netProfit,
        margin
      };
    });
  }, [allOrders, allVouchers, allProducts]);

  const filtered = useMemo(() => {
    let list = [...financialData];
    const s = search.toLowerCase();
    list = list.filter(d => d.orderNumber?.toLowerCase().includes(s) || d.title?.toLowerCase().includes(s) || d.productName?.toLowerCase().includes(s));
    if (productFilter !== 'all') list = list.filter(d => d.productId === productFilter);
    if (dateFrom) list = list.filter(d => d.startDate >= dateFrom);
    if (dateTo) list = list.filter(d => d.startDate <= dateTo);
    return list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [financialData, search, productFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((acc, curr) => acc + curr.estimatedRevenue, 0);
    const costs = filtered.reduce((acc, curr) => acc + curr.totalCost, 0);
    const profit = revenue - costs;
    const avgMargin = filtered.length > 0 ? filtered.reduce((acc, curr) => acc + curr.margin, 0) / filtered.length : 0;
    return { revenue, costs, profit, avgMargin };
  }, [filtered]);

  const formatCurrency = (val: number) => {
    const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const parts = formatted.split('.');
    return (
      <span className="tabular-nums">
        {parts[0]}
        <span className="text-[0.7em] opacity-60">.{parts[1]}</span>
      </span>
    );
  };

  const handleExportCSV = () => {
    const headers = isRtl 
      ? ['رقم الأمر', 'المنتج', 'تاريخ البدء', 'إجمالي التكاليف', 'القيمة السوقية للمنتج', 'صافي الربح التقديري', 'الهامش %']
      : ['Order #', 'Product', 'Start Date', 'Total Costs', 'Production Value', 'Net Profit', 'Margin %'];
    
    const rows = filtered.map(d => [
      d.orderNumber, d.productName, d.startDate, 
      d.totalCost.toFixed(2), d.estimatedRevenue.toFixed(2), 
      d.netProfit.toFixed(2), `${d.margin.toFixed(1)}%`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinancialSummary_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast({ title: isRtl ? "تم التصدير بنجاح" : "Data Exported" });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'التقارير' : 'REPORTS'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600">{isRtl ? 'الملخص المالي والنمو' : 'FINANCIAL SUMMARY'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'تحليل القيمة والأرباح التشغيلية' : 'Financial Performance & Growth'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <div className="relative w-48 md:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={isRtl ? 'بحث بالأمر أو المنتج...' : 'Quick search...'} 
                className={cn("h-9 bg-white border-slate-200 text-[10px] font-bold", isRtl ? "pr-9" : "pl-9")} 
              />
            </div>

            <div className="flex items-center gap-1 px-1 border-x border-slate-200">
               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all", (dateFrom || dateTo) && "border-emerald-500 bg-emerald-50")}>
                       <CalendarDays className={cn("w-4 h-4", (dateFrom || dateTo) ? "text-emerald-600" : "text-slate-400")} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align={isRtl ? "start" : "end"} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200">
                     <div className="space-y-4 text-right">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2"><CalendarDays className="w-3.5 h-3.5" />{isRtl ? 'النطاق الزمني' : 'DATE RANGE'}</div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">من</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                           <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">إلى</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                        </div>
                        {(dateFrom || dateTo) && <Button variant="link" onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-[9px] h-auto p-0 font-bold text-rose-500 underline uppercase w-full">إعادة تعيين</Button>}
                     </div>
                  </PopoverContent>
               </Popover>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all", productFilter !== 'all' && "border-emerald-500 bg-emerald-50")}>
                       <ShoppingBag className={cn("w-4 h-4", productFilter !== 'all' ? "text-emerald-600" : "text-slate-400")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-64 rounded-xl shadow-xl border-slate-200">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'حسب الصنف' : 'BY PRODUCT'}</DropdownMenuLabel>
                     <ScrollArea className="h-48">
                        <DropdownMenuItem onClick={() => setProductFilter('all')} className="flex justify-between text-xs font-bold cursor-pointer">{isRtl ? 'جميع المنتجات' : 'All Products'}{productFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}</DropdownMenuItem>
                        {allProducts?.map(p => (
                          <DropdownMenuItem key={p.id} onClick={() => setProductFilter(p.id)} className="flex justify-between text-xs font-bold cursor-pointer">
                            {p.nameAr}
                            {productFilter === p.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </DropdownMenuItem>
                        ))}
                     </ScrollArea>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <Button onClick={handleExportCSV} variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">
              <FileDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        
        {/* STATS OVERVIEW - FULL WIDTH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-none">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 flex-1 w-full">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-blue-200 transition-all flex-1 min-w-[150px]">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><Target className="w-4 h-4" /></div>
                <div className="flex flex-col overflow-hidden text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">{isRtl ? 'قيمة الإنتاج المنجز' : 'PRODUCTION VALUE'}</p>
                  <h3 className="text-xs font-black text-blue-900">{formatCurrency(totals.revenue)} <span className="text-[8px] opacity-40 uppercase ms-1">{systemCurrency}</span></h3>
                </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-rose-200 transition-all flex-1 min-w-[150px]">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0"><Receipt className="w-4 h-4" /></div>
                <div className="flex flex-col overflow-hidden text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">{isRtl ? 'إجمالي التكاليف' : 'TOTAL EXPENDITURE'}</p>
                  <h3 className="text-xs font-black text-rose-700">{formatCurrency(totals.costs)} <span className="text-[8px] opacity-40 uppercase ms-1">{systemCurrency}</span></h3>
                </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-emerald-200 transition-all flex-1 min-w-[150px]">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"><Wallet className="w-4 h-4" /></div>
                <div className="flex flex-col overflow-hidden text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">{isRtl ? 'صافي الربح التقديري' : 'EST. NET PROFIT'}</p>
                  <h3 className="text-xs font-black text-emerald-800">{formatCurrency(totals.profit)} <span className="text-[8px] opacity-40 uppercase ms-1">{systemCurrency}</span></h3>
                </div>
            </div>
            <div className="bg-slate-900 px-4 py-2 rounded-lg shadow-sm flex items-center gap-3 flex-1 min-w-[120px]">
                <div className="p-1.5 bg-white/10 text-emerald-400 rounded-lg shrink-0"><BarChart3 className="w-4 h-4" /></div>
                <div className="flex flex-col overflow-hidden text-right text-white">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-tight truncate">{isRtl ? 'هامش الربح' : 'AVG MARGIN'}</p>
                  <h3 className="text-xs font-black tabular-nums">{totals.avgMargin.toFixed(1)}%</h3>
                </div>
            </div>
          </div>
        </div>

        {/* DATA TABLE - FULL WIDTH */}
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                 <TableRow>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{isRtl ? 'أمر الإنتاج / الدفعة' : 'BATCH / ORDER'}</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{isRtl ? 'التكاليف الكلية' : 'TOTAL COSTS'}</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{isRtl ? 'القيمة التقديرية' : 'EST. VALUE'}</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200 bg-slate-100/30">{isRtl ? 'صافي الربح' : 'NET PROFIT'}</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{isRtl ? 'الهامش' : 'MARGIN'}</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {ordersLoading ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse text-slate-400 font-black">{isRtl ? 'جاري التحليل المالي...' : 'Calculating Financials...'}</TableCell></TableRow>
                 ) : filtered.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-300 font-bold">{isRtl ? 'لا توجد بيانات' : 'No records match filters'}</TableCell></TableRow>
                 ) : filtered.map((d) => (
                   <TableRow key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                      <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                         <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">{d.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                               <Badge variant="outline" className="text-[8px] font-black tabular-nums bg-slate-50">{d.orderNumber}</Badge>
                               <span className="text-[9px] text-slate-400 font-bold">{d.productName}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center font-bold text-rose-700 text-[11px]">{formatCurrency(d.totalCost)}</TableCell>
                      <TableCell className="px-6 py-4 text-center font-bold text-blue-700 text-[11px]">{formatCurrency(d.estimatedRevenue)}</TableCell>
                      <TableCell className="px-6 py-4 text-center font-black text-slate-900 text-[11px] bg-slate-100/20 border-x border-slate-100/50">
                         <div className="flex flex-col items-center">
                            <span className={cn(d.netProfit >= 0 ? "text-emerald-700" : "text-rose-700")}>{formatCurrency(d.netProfit)}</span>
                            <span className="text-[8px] text-slate-400 opacity-60 uppercase">YER</span>
                         </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                         <div className={cn(
                           "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tabular-nums",
                           d.margin >= 30 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : 
                           d.margin >= 15 ? "bg-blue-50 text-blue-700 border border-blue-100" :
                           "bg-rose-50 text-rose-700 border border-rose-100"
                         )}>
                            {d.margin >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {d.margin.toFixed(1)}%
                         </div>
                      </TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* SYSTEM AUDIT FOOTER */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4 border-t border-white/5">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول تحليل النمو: يتم احتساب الأداء المالي بناءً على القيمة السوقية للمنتجات الجاهزة مطروحاً منها التكاليف الفعلية المسجلة.' 
             : 'Growth Protocol: Performance calculated based on production market value minus real expenditure.'}
         </p>
      </div>
    </div>
  );
}
