'use client';

import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  ChevronRight, 
  Search, 
  CalendarDays, 
  FileDown, 
  Filter, 
  Users2, 
  Workflow, 
  Activity, 
  Wallet, 
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Info,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export default function WorkerProductivityReport() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerId, setWorkerId] = useState('all');
  const [orderId, setOrderId] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'qty' | 'wage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Data
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);

  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allReceipts, loading } = useCollection<any>(receiptsQuery);
  const { data: allOrders } = useCollection<any>(ordersQuery);

  const filteredData = useMemo(() => {
    if (!allReceipts) return [];
    let list = allReceipts.filter(r => r.status !== 'deleted');

    if (workerId !== 'all') list = list.filter(r => r.workerId === workerId);
    if (orderId !== 'all') list = list.filter(r => r.orderId === orderId);
    if (dateFrom) list = list.filter(r => r.date >= dateFrom);
    if (dateTo) list = list.filter(r => r.date <= dateTo);
    
    if (search) {
      const s = search.toLowerCase();
      const workerName = (wid: string) => allWorkers?.find(w => w.id === wid)?.fullName?.toLowerCase() || '';
      const voucherNo = (r.voucherNumber || '').toLowerCase();
      list = list.filter(r => workerName(r.workerId).includes(s) || voucherNo.includes(s));
    }

    return list.sort((a, b) => {
      if (sortBy === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === 'qty') {
        return sortOrder === 'asc' ? (a.qtyAccepted || 0) - (b.qtyAccepted || 0) : (b.qtyAccepted || 0) - (a.qtyAccepted || 0);
      }
      if (sortBy === 'wage') {
        return sortOrder === 'asc' ? (a.wageAmount || 0) - (b.wageAmount || 0) : (b.wageAmount || 0) - (a.wageAmount || 0);
      }
      return 0;
    });
  }, [allReceipts, allWorkers, workerId, orderId, dateFrom, dateTo, search, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const totalQty = filteredData.reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);
    const totalWages = filteredData.reduce((acc, curr) => acc + (curr.wageAmount || 0), 0);
    const uniqueWorkers = new Set(filteredData.map(r => r.workerId)).size;
    return { totalQty, totalWages, uniqueWorkers };
  }, [filteredData]);

  const handleExport = () => {
    const headers = ['Date', 'Voucher', 'Worker', 'Batch', 'Qty', 'Wage', 'Currency', 'Status'];
    const rows = filteredData.map(r => [
      r.date, 
      r.voucherNumber, 
      allWorkers?.find(w => w.id === r.workerId)?.fullName || '---',
      allOrders?.find(o => o.id === r.orderId)?.orderNumber || '---',
      r.qtyAccepted,
      r.wageAmount.toFixed(2),
      r.currency || 'YER',
      r.paymentStatus
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Productivity_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast({ title: isRtl ? "تم تصدير البيانات" : "Data Exported" });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><UserCheck className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'التقارير' : 'Reports'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600">{isRtl ? 'إنتاجية وأجور العمال' : 'Worker Performance'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'تحليل المخرجات والاستحقاقات المالية' : 'Labor Output & Wage Audit'}</h1>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" className="h-10 px-6 font-black gap-2 border-slate-200">
            <FileDown className="w-4 h-4 text-emerald-600" /> {isRtl ? 'تصدير التقرير' : 'Export Data'}
          </Button>
        </div>

        {/* COMPREHENSIVE FILTERS */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
           {/* Date Filter */}
           <div className="md:col-span-3 flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 h-10">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-full font-bold tabular-nums" />
              <span className="text-[10px] font-black text-slate-300">→</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-full font-bold tabular-nums" />
           </div>
           
           {/* Worker Filter */}
           <div className="md:col-span-3">
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none">
                 <option value="all">{isRtl ? '-- جميع العمال --' : '-- All Workers --'}</option>
                 {allWorkers?.filter(w => w.status !== 'deleted').map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
              </select>
           </div>

           {/* Batch Filter */}
           <div className="md:col-span-3">
              <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none">
                 <option value="all">{isRtl ? '-- جميع الدفعات --' : '-- All Batches --'}</option>
                 {allOrders?.filter(o => o.status !== 'deleted').map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
              </select>
           </div>

           {/* Search Input */}
           <div className="md:col-span-3 relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'رقم السند...' : 'Search voucher...'} className={cn("h-10 bg-white border-slate-200 text-xs font-bold", isRtl ? "pr-10" : "pl-10")} />
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-6 space-y-6 overflow-hidden">
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-none">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'إجمالي القطع المنجزة' : 'TOTAL PIECES'}</p>
                <h3 className="text-3xl font-black text-slate-900 tabular-nums">{stats.totalQty.toLocaleString('en-US')}</h3>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><TrendingUp className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'إجمالي الأجور المفلترة' : 'TOTAL WAGES'}</p>
                <h3 className="text-3xl font-black text-purple-700 tabular-nums">{stats.totalWages.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Wallet className="w-6 h-6" /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'القوى العاملة المشمولة' : 'FILTERED WORKFORCE'}</p>
                <h3 className="text-3xl font-black text-blue-700 tabular-nums">{stats.uniqueWorkers}</h3>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Users2 className="w-6 h-6" /></div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm"><Info className="w-4 h-4 text-emerald-600" /></div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{isRtl ? 'كشف تفاصيل الإنتاج والأجور' : 'PRODUCTION & WAGE LEDGER'}</h4>
            </div>
            
            <div className="flex items-center gap-1.5">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black gap-2 text-slate-600 hover:bg-white border border-slate-200">
                       <Filter className="w-3.5 h-3.5" /> {isRtl ? 'ترتيب النتائج' : 'Sort Results'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56 rounded-xl shadow-xl border-slate-200">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CHRONOLOGY</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer">
                        {isRtl ? 'حسب التاريخ' : 'By Date'}
                        {sortBy === 'date' && <Badge className="bg-emerald-500">{sortOrder === 'asc' ? '↑' : '↓'}</Badge>}
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">METRICS</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => { setSortBy('qty'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer">
                        {isRtl ? 'حسب الكمية' : 'By Quantity'}
                        {sortBy === 'qty' && <Badge className="bg-emerald-500">{sortOrder === 'asc' ? '↑' : '↓'}</Badge>}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => { setSortBy('wage'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer">
                        {isRtl ? 'حسب الأجر' : 'By Wage'}
                        {sortBy === 'wage' && <Badge className="bg-emerald-500">{sortOrder === 'asc' ? '↑' : '↓'}</Badge>}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{isRtl ? 'السجلات:' : 'LOGS:'} <span className="text-emerald-600">{filteredData.length}</span></span>
            </div>
          </div>

          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
               <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>DATE</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>VOUCHER</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>WORKER</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>BATCH</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">PIECES</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">WAGE</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>STATUS</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 animate-pulse text-slate-400 font-black">جاري تحليل الأداء والبيانات المالية...</TableCell></TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-slate-300 font-bold">لا توجد بيانات مطابقة لهذه الفلاتر</TableCell></TableRow>
                  ) : filteredData.map((r) => {
                     const worker = allWorkers?.find(w => w.id === r.workerId);
                     const order = allOrders?.find(o => o.id === r.orderId);
                     return (
                       <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                          <TableCell className={cn("px-6 py-4 font-bold text-slate-500 text-[11px] tabular-nums", isRtl ? "text-right" : "text-left")}>{r.date}</TableCell>
                          <TableCell className={cn("px-6 py-4 font-black text-slate-400 text-[11px] tabular-nums", isRtl ? "text-right" : "text-left")}>{r.voucherNumber}</TableCell>
                          <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                             <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-xs">{worker?.fullName}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{worker?.workerId}</span>
                             </div>
                          </TableCell>
                          <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                             <div className="flex flex-col">
                                <span className="font-bold text-emerald-700 text-xs tabular-nums">{order?.orderNumber}</span>
                                <span className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]">{order?.title}</span>
                             </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center font-black text-slate-700 tabular-nums text-xs">
                             {r.qtyAccepted} <span className="text-[9px] opacity-40 uppercase ms-1">Pcs</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center font-black text-purple-700 tabular-nums text-xs bg-purple-50/20">
                             {r.wageAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             <span className="text-[9px] opacity-40 uppercase ms-1">{r.currency || 'YER'}</span>
                          </TableCell>
                          <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                             <Badge variant="outline" className={cn("text-[9px] font-black uppercase", r.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                                {r.paymentStatus === 'paid' ? (isRtl ? 'تم الصرف' : 'Paid') : (isRtl ? 'بانتظار الصرف' : 'Pending')}
                             </Badge>
                          </TableCell>
                       </TableRow>
                     )
                  })}
               </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4 border-t border-white/5">
         <Info className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'ملاحظة: البيانات المستعرضة تعتمد على "سندات استلام الإنتاج" المرحلة فقط. إجمالي الأجور يعكس القيمة المستحقة للحرفي بناءً على المنجز المقبول.' 
             : 'Note: Data is based on posted production receipts. Total wages represent earned entitlements based on accepted output.'}
         </p>
      </div>
    </div>
  );
}

