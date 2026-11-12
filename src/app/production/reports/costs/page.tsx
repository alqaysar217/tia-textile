'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  ChevronRight, 
  Search, 
  FileDown, 
  TrendingUp, 
  Layers, 
  Wallet, 
  Receipt, 
  Coins, 
  Target, 
  Activity, 
  Info, 
  Filter,
  CalendarDays,
  Check,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  ShoppingBag,
  ShieldCheck,
  Hash,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useProduction } from '../../ProductionContext';

export default function OrderCostAnalysisReport() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  // استيراد الصلاحيات من المحرك المركزي
  const { permissions, isAdmin } = useProduction();
  const canReadReports = isAdmin || permissions.reports?.read;

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'orderNumber' | 'totalCost' | 'avgCost' | 'progress'>('orderNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch Global Settings for Currency
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useDoc<any>(settingsRef);
  const systemCurrency = savedSettings?.baseCurrency || 'YER';

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : collection(db, 'vouchers'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allVouchers } = useCollection<any>(vouchersQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const analysisData = useMemo(() => {
    if (!allOrders || !allVouchers || !canReadReports) return [];
    
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
        productId: product?.id,
        matCost,
        wageCost,
        overheadCost,
        totalCost,
        avgCost,
        progress
      };
    });
  }, [allOrders, allVouchers, allProducts, canReadReports]);

  const filtered = useMemo(() => {
    let list = [...analysisData];
    const s = search.toLowerCase();
    
    list = list.filter(d => 
      d.orderNumber?.toLowerCase().includes(s) || 
      d.title?.toLowerCase().includes(s) ||
      d.productName?.toLowerCase().includes(s)
    );

    if (productFilter !== 'all') list = list.filter(d => d.productId === productFilter);
    if (dateFrom) list = list.filter(d => d.startDate >= dateFrom);
    if (dateTo) list = list.filter(d => d.startDate <= dateTo);

    return list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [analysisData, search, productFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const totals = useMemo(() => {
    return {
      totalCost: filtered.reduce((acc, curr) => acc + curr.totalCost, 0),
      totalWages: filtered.reduce((acc, curr) => acc + curr.wageCost, 0),
      avgProgress: Math.round(filtered.reduce((acc, curr) => acc + curr.progress, 0) / (filtered.length || 1))
    };
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
    if (!canReadReports) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتصدير" : "Export Denied" });
      return;
    }
    const headers = isRtl 
      ? ['رقم الأمر', 'المنتج', 'تاريخ البدء', 'تكلفة المواد', 'الأجور', 'المصاريف', 'الإجمالي', 'تكلفة القطعة', 'التقدم']
      : ['Order #', 'Product', 'Start Date', 'Mat. Cost', 'Wages', 'Overhead', 'Total', 'Unit Cost', 'Progress'];
    
    const rows = filtered.map(d => [
      d.orderNumber, d.productName, d.startDate, 
      d.matCost.toFixed(2), d.wageCost.toFixed(2), d.overheadCost.toFixed(2), 
      d.totalCost.toFixed(2), d.avgCost.toFixed(2), `${d.progress}%`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CostAnalysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast({ title: isRtl ? "تم تصدير البيانات" : "Data Exported" });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* HEADER WITH INTEGRATED FILTERS */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm z-30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg"><Calculator className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'التقارير' : 'REPORTS'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'تحليل تكاليف الأوامر' : 'BATCH COSTING'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">{isRtl ? 'تحليل ربحية وتكاليف الإنتاج' : 'Profitability & Cost Analysis'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={isRtl ? 'بحث بالأمر أو المنتج...' : 'Search...'} 
                className={cn("h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[10px] font-bold dark:text-slate-100", isRtl ? "pr-9" : "pl-9")} 
              />
            </div>

            <div className="flex items-center gap-1 px-1 border-x border-slate-200 dark:border-slate-700">
               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all", (dateFrom || dateTo) && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20")}>
                       <CalendarDays className={cn("w-4 h-4", (dateFrom || dateTo) ? "text-emerald-600" : "text-slate-400 dark:text-slate-600")} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align={isRtl ? "start" : "end"} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                     <div className="space-y-4 text-right">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 pb-2"><CalendarDays className="w-3.5 h-3.5" />{isRtl ? 'تصفية زمنية' : 'DATE RANGE'}</div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 dark:text-slate-500">{isRtl ? 'من' : 'FROM'}</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" /></div>
                           <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 dark:text-slate-500">{isRtl ? 'إلى' : 'TO'}</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" /></div>
                        </div>
                        {(dateFrom || dateTo) && <Button variant="link" onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-[9px] h-auto p-0 font-bold text-rose-500 underline uppercase w-full">{isRtl ? 'إعادة تعيين' : 'RESET'}</Button>}
                     </div>
                  </PopoverContent>
               </Popover>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all", productFilter !== 'all' && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20")}>
                       <ShoppingBag className={cn("w-4 h-4", productFilter !== 'all' ? "text-emerald-600" : "text-slate-400 dark:text-slate-500")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-64 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'حسب نوع المنتج' : 'BY PRODUCT'}</DropdownMenuLabel>
                     <ScrollArea className="h-48">
                        <DropdownMenuItem onClick={() => setProductFilter('all')} className="flex justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">{isRtl ? 'جميع المنتجات' : 'All Products'}{productFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}</DropdownMenuItem>
                        {allProducts?.map(p => (
                          <DropdownMenuItem key={p.id} onClick={() => setProductFilter(p.id)} className="flex justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                            {p.nameAr}
                            {productFilter === p.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </DropdownMenuItem>
                        ))}
                     </ScrollArea>
                  </DropdownMenuContent>
               </DropdownMenu>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all")}>
                       <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => toggleSort('totalCost')} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                        {isRtl ? 'إجمالي التكلفة' : 'Total Cost'}
                        {sortBy === 'totalCost' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => toggleSort('avgCost')} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                        {isRtl ? 'تكلفة القطعة' : 'Unit Cost'}
                        {sortBy === 'avgCost' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => toggleSort('progress')} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                        {isRtl ? 'نسبة الإنجاز' : 'Progress'}
                        {sortBy === 'progress' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <Button onClick={handleExportCSV} variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md border-none">
              <FileDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        
        {/* COMPACT STATS ROW - FULL WIDTH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-none">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 flex-1 w-full">
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 group hover:border-emerald-200 dark:hover:border-emerald-900 transition-all flex-1 min-w-[160px]">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden text-right">
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight truncate">{isRtl ? 'إجمالي تكاليف التشغيل' : 'CONSOLIDATED COSTS'}</p>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(totals.totalCost)} <span className="text-[9px] opacity-40 uppercase ms-1">{systemCurrency}</span></h3>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 group hover:border-purple-200 dark:hover:border-purple-900 transition-all flex-1 min-w-[160px]">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden text-right">
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight truncate">{isRtl ? 'إجمالي الأجور المستحقة' : 'TOTAL WAGES'}</p>
                  <h3 className="text-sm font-black text-purple-700 dark:text-purple-400">{formatCurrency(totals.totalWages)} <span className="text-[9px] opacity-40 uppercase ms-1">{systemCurrency}</span></h3>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 group hover:border-blue-200 dark:hover:border-blue-900 transition-all flex-1 min-w-[160px]">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden text-right">
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight truncate">{isRtl ? 'متوسط التقدم العام' : 'AVG. PIPELINE'}</p>
                  <h3 className="text-sm font-black text-blue-700 dark:text-blue-400 tabular-nums">{totals.avgProgress}%</h3>
                </div>
            </div>
          </div>
        </div>

        {/* DATA TABLE - ERP STYLE SHARP CORNERS */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
               <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                  <TableRow className="border-b dark:border-slate-700">
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>{isRtl ? 'أمر الإنتاج' : 'BATCH / ORDER'}</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'المواد' : 'MAT. COST'}</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'الأجور' : 'WAGES'}</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'المصاريف' : 'OVERHEAD'}</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50">{isRtl ? 'الإجمالي' : 'TOTAL COST'}</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'تكلفة/قطعة' : 'UNIT COST'}</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>{isRtl ? 'التقدم' : 'STATUS'}</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {ordersLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-24 animate-pulse text-slate-400 dark:text-slate-600 font-black">{isRtl ? 'جاري تحليل التكاليف...' : 'Analyzing Costing Data...'}</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-24 text-slate-300 dark:text-slate-800 font-bold">{isRtl ? 'لا توجد بيانات مطابقة' : 'No records match these filters'}</TableCell></TableRow>
                  ) : filtered.map((d) => (
                    <TableRow key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 group">
                       <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                          <div className="flex flex-col">
                             <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{d.title}</span>
                             <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[8px] font-black tabular-nums bg-slate-50 dark:bg-slate-800 border-none">{d.orderNumber}</Badge>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{d.productName}</span>
                             </div>
                          </div>
                       </TableCell>
                       <TableCell className="px-6 py-4 text-center font-bold text-amber-700 dark:text-amber-500 text-[11px]">{formatCurrency(d.matCost)}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-bold text-purple-700 dark:text-purple-500 text-[11px]">{formatCurrency(d.wageCost)}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-bold text-rose-700 dark:text-rose-500 text-[11px]">{formatCurrency(d.overheadCost)}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-black text-slate-900 dark:text-slate-100 text-[11px] bg-slate-50/50 dark:bg-slate-800/50 border-x border-slate-100/50 dark:border-slate-800/50">{formatCurrency(d.totalCost)}</TableCell>
                       <TableCell className="px-6 py-4 text-center font-black text-emerald-700 dark:text-emerald-400 text-[11px]">{formatCurrency(d.avgCost)}</TableCell>
                       <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                                <div className={cn("h-full bg-emerald-500 absolute", isRtl ? "right-0" : "left-0")} style={{ width: `${d.progress}%` }} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 tabular-nums">{d.progress}%</span>
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
      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/80 text-white/40 dark:text-slate-500 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl transition-colors duration-300">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول الرقابة المالية: يتم احتساب التكاليف والربحية بناءً على السندات المرحلة فقط لضمان النزاهة المحاسبية.' 
             : 'Financial Audit Protocol: Profitability and costing are calculated from posted vouchers only for fiscal integrity.'}
         </p>
      </div>
    </div>
  );
}
