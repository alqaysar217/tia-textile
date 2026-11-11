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
  Download,
  Loader2,
  Info,
  BarChart3,
  PieChart
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
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  Area, 
  AreaChart 
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function WorkerProductivityReport() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerId, setWorkerId] = useState('all');
  const [search, setSearch] = useState('');

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
    if (dateFrom) list = list.filter(r => r.date >= dateFrom);
    if (dateTo) list = list.filter(r => r.date <= dateTo);
    
    if (search) {
      const s = search.toLowerCase();
      const workerName = (wid: string) => allWorkers?.find(w => w.id === wid)?.fullName?.toLowerCase() || '';
      list = list.filter(r => workerName(r.workerId).includes(s) || r.voucherNumber?.toLowerCase().includes(s));
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allReceipts, allWorkers, workerId, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const totalQty = filteredData.reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);
    const totalWages = filteredData.reduce((acc, curr) => acc + (curr.wageAmount || 0), 0);
    const uniqueWorkers = new Set(filteredData.map(r => r.workerId)).size;
    return { totalQty, totalWages, uniqueWorkers };
  }, [filteredData]);

  // Data for Trends Chart (Daily production)
  const trendData = useMemo(() => {
    const daily: Record<string, number> = {};
    filteredData.forEach(r => {
      daily[r.date] = (daily[r.date] || 0) + (r.qtyAccepted || 0);
    });
    return Object.entries(daily).map(([date, qty]) => ({ date, qty })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Data for Worker Performance (Pieces per worker)
  const workerPerformanceData = useMemo(() => {
    const perWorker: Record<string, number> = {};
    filteredData.forEach(r => {
      const wName = allWorkers?.find(w => w.id === r.workerId)?.fullName || r.workerId;
      perWorker[wName] = (perWorker[wName] || 0) + (r.qtyAccepted || 0);
    });
    return Object.entries(perWorker)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8); // Top 8 workers
  }, [filteredData, allWorkers]);

  const handleExport = () => {
    const headers = ['Date', 'Voucher', 'Worker', 'Batch', 'Qty', 'Wage', 'Status'];
    const rows = filteredData.map(r => [
      r.date, 
      r.voucherNumber, 
      allWorkers?.find(w => w.id === r.workerId)?.fullName || '---',
      allOrders?.find(o => o.id === r.orderId)?.orderNumber || '---',
      r.qtyAccepted,
      r.wageAmount.toFixed(2),
      r.paymentStatus
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProductivityReport_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast({ title: isRtl ? "تم تصدير التقرير" : "Report Exported" });
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
              <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'تحليل الأداء الفردي والمالي' : 'Labor Efficiency Analytics'}</h1>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" className="h-10 px-6 font-black gap-2 border-slate-200">
            <FileDown className="w-4 h-4 text-emerald-600" /> {isRtl ? 'تصدير التقرير' : 'Export Data'}
          </Button>
        </div>

        {/* FILTERS */}
        <div className="mt-4 flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
           <div className="flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 h-10 w-full md:w-auto">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold" />
              <span className="text-[10px] font-black text-slate-300">→</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold" />
           </div>
           
           <div className="flex-1 w-full">
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none">
                 <option value="all">{isRtl ? '-- جميع العمال --' : '-- All Workers --'}</option>
                 {allWorkers?.filter(w => w.status !== 'deleted').map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
              </select>
           </div>

           <div className="relative w-full md:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالسند...' : 'Search...'} className={cn("h-10 bg-white border-slate-200 text-xs font-bold", isRtl ? "pr-10" : "pl-10")} />
           </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 no-scrollbar">
        <div className="p-6 space-y-8">
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'إجمالي القطع المنجزة' : 'TOTAL PIECES'}</p>
                  <h3 className="text-3xl font-black text-slate-900 tabular-nums">{stats.totalQty.toLocaleString('en-US')}</h3>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><TrendingUp className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'إجمالي الأجور المستحقة' : 'TOTAL WAGES'}</p>
                  <h3 className="text-3xl font-black text-purple-700 tabular-nums">{stats.totalWages.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Wallet className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'عدد العمال المشاركين' : 'WORKFORCE'}</p>
                  <h3 className="text-3xl font-black text-blue-700 tabular-nums">{stats.uniqueWorkers}</h3>
                </div>
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Users2 className="w-6 h-6" /></div>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Trends Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    {isRtl ? 'اتجاهات الإنتاج اليومي' : 'Daily Production Trend'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'حجم القطع المنتجة حسب التاريخ' : 'Pieces volume by date'}</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ChartContainer config={{ qty: { label: isRtl ? 'القطع' : 'Pieces', color: "hsl(var(--primary))" } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="qty" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    {isRtl ? 'أداء أفضل 8 حرفيين' : 'Top 8 Artisans Performance'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'مقارنة الإنتاج الكلي لكل عامل' : 'Comparative pieces by worker'}</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ChartContainer config={{ qty: { label: isRtl ? 'قطعة' : 'Pcs', color: "#10b981" } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workerPerformanceData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'black', fill: '#475569'}}
                        width={100}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm"><Info className="w-4 h-4 text-emerald-600" /></div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{isRtl ? 'سجل التفاصيل الميدانية' : 'FIELD ACTIVITY LEDGER'}</h4>
            </div>
            <Table className="text-right border-separate border-spacing-0">
               <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>DATE</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>WORKER</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>BATCH</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">PIECES</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">WAGE</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", isRtl ? "text-right" : "text-left")}>STATUS</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse text-slate-400 font-black">جاري تحليل الأداء...</TableCell></TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-300 font-bold">لا توجد سجلات مطابقة لهذه الفترة</TableCell></TableRow>
                  ) : filteredData.map((r) => {
                     const worker = allWorkers?.find(w => w.id === r.workerId);
                     const order = allOrders?.find(o => o.id === r.orderId);
                     return (
                       <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                          <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{r.date}</TableCell>
                          <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs", isRtl ? "text-right" : "text-left")}>{worker?.fullName}</TableCell>
                          <TableCell className={cn("px-6 py-3 font-bold text-emerald-700 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{order?.orderNumber}</TableCell>
                          <TableCell className="px-6 py-3 text-center font-black text-slate-700 tabular-nums">{r.qtyAccepted} <span className="text-[8px] opacity-40 uppercase">Pcs</span></TableCell>
                          <TableCell className="px-6 py-3 text-center font-black text-purple-700 tabular-nums">{r.wageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                             <Badge variant="outline" className={cn("text-[9px] font-black uppercase", r.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                                {r.paymentStatus === 'paid' ? (isRtl ? 'مصروف' : 'Paid') : (isRtl ? 'مستحق' : 'Pending')}
                             </Badge>
                          </TableCell>
                       </TableRow>
                     )
                  })}
               </TableBody>
            </Table>
          </div>
        </div>
      </ScrollArea>

      {/* FOOTER NOTE */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4 border-t border-white/5">
         <Info className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'ملاحظة: البيانات والرسومات البيانية مبنية على سندات استلام الإنتاج الفعلية والمؤرشفة في النظام.' 
             : 'Note: Charts and data are generated from actual production receipt vouchers archived in the system.'}
         </p>
      </div>
    </div>
  );
}