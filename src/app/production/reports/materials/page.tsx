'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  PieChart, 
  ChevronRight, 
  Search, 
  FileDown, 
  Layers, 
  Box, 
  Workflow, 
  Users2, 
  CalendarDays, 
  Filter, 
  Check, 
  SortAsc, 
  SortDesc, 
  ArrowUpDown, 
  Info, 
  ShieldCheck, 
  Hash, 
  Activity,
  Tag,
  Loader2
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

export default function MaterialConsumptionReport() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'qty' | 'nameAr'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Data
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);

  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: issueVouchers, loading } = useCollection<any>(vouchersQuery);

  // Process data for consumption report
  const consumptionData = useMemo(() => {
    if (!issueVouchers) return [];
    
    let list: any[] = [];
    issueVouchers.filter(v => v.status !== 'deleted').forEach(v => {
      const order = allOrders?.find(o => o.id === v.orderId);
      const worker = allWorkers?.find(w => w.id === v.workerId);

      v.items?.forEach((item: any) => {
        list.push({
          id: `${v.id}-${item.id}`,
          date: v.date,
          voucherNumber: v.voucherNumber,
          orderId: v.orderId,
          orderNumber: order?.orderNumber || '---',
          orderTitle: order?.title || '---',
          workerName: worker?.fullName || '---',
          materialId: item.id,
          nameAr: item.nameAr,
          qty: Number(item.qty || 0),
          unit: item.unit
        });
      });
    });

    return list;
  }, [issueVouchers, allOrders, allWorkers]);

  const filtered = useMemo(() => {
    let list = [...consumptionData];
    const s = search.toLowerCase();
    
    list = list.filter(d => 
      d.voucherNumber?.toLowerCase().includes(s) || 
      d.workerName?.toLowerCase().includes(s) ||
      d.nameAr?.includes(s) ||
      d.orderNumber?.toLowerCase().includes(s)
    );

    if (materialFilter !== 'all') list = list.filter(d => d.materialId === materialFilter);
    if (batchFilter !== 'all') list = list.filter(d => d.orderId === batchFilter);
    if (dateFrom) list = list.filter(d => d.date >= dateFrom);
    if (dateTo) list = list.filter(d => d.date <= dateTo);

    return list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      if (sortBy === 'qty') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [consumptionData, search, materialFilter, batchFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const stats = useMemo(() => {
    return {
      totalItems: filtered.length,
      uniqueOrders: new Set(filtered.map(d => d.orderId)).size,
      uniqueWorkers: new Set(filtered.map(d => d.workerName)).size
    };
  }, [filtered]);

  const handleExportCSV = () => {
    const headers = isRtl 
      ? ['التاريخ', 'رقم السند', 'الموظف', 'أمر الإنتاج', 'المادة الخام', 'الكمية', 'الوحدة']
      : ['Date', 'Ref #', 'Personnel', 'Batch', 'Material', 'Qty', 'Unit'];
    
    const rows = filtered.map(d => [
      d.date, d.voucherNumber, d.workerName, d.orderNumber, d.nameAr, d.qty, d.unit
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MaterialConsumption_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast({ title: isRtl ? "تم تصدير البيانات" : "Data Exported" });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const dictionary = {
    title: isRtl ? 'استهلاك المواد الخام' : 'Material Consumption',
    subtitle: isRtl ? 'تحليل حركة المواد في خطوط الإنتاج' : 'WIP Material Usage Analysis',
    search: isRtl ? 'بحث بالسند أو الصنف...' : 'Search records...',
    colDate: isRtl ? 'التاريخ' : 'DATE',
    colRef: isRtl ? 'رقم السند' : 'REF #',
    colWorker: isRtl ? 'المستلم' : 'PERSONNEL',
    colBatch: isRtl ? 'أمر الإنتاج' : 'PRODUCTION ORDER',
    colMaterial: isRtl ? 'المادة الخام' : 'MATERIAL',
    colQty: isRtl ? 'الكمية' : 'QUANTITY',
    auditNote: isRtl 
      ? 'نظام الرقابة المخزنية: البيانات تعكس كافة المواد الصادرة من المستودع بعهدة الحرفيين لدفعة محددة.' 
      : 'Inventory Audit: Data reflects all materials issued from warehouse to artisans for specific batches.'
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><PieChart className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'التقارير' : 'REPORTS'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600">{dictionary.title}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{dictionary.subtitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <div className="relative w-48 md:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={dictionary.search} 
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
                  <PopoverContent align={isRtl ? "start" : "end"} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200 text-right">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2"><CalendarDays className="w-3.5 h-3.5" />{isRtl ? 'تصفية زمنية' : 'DATE RANGE'}</div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">{isRtl ? 'من' : 'FROM'}</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                           <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">{isRtl ? 'إلى' : 'TO'}</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                        </div>
                        {(dateFrom || dateTo) && <Button variant="link" onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-[9px] h-auto p-0 font-bold text-rose-500 underline uppercase w-full">إعادة تعيين</Button>}
                     </div>
                  </PopoverContent>
               </Popover>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all", materialFilter !== 'all' && "border-emerald-500 bg-emerald-50")}>
                       <Box className={cn("w-4 h-4", materialFilter !== 'all' ? "text-emerald-600" : "text-slate-400")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-64 rounded-xl shadow-xl border-slate-200">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'حسب المادة' : 'BY MATERIAL'}</DropdownMenuLabel>
                     <ScrollArea className="h-48">
                        <DropdownMenuItem onClick={() => setMaterialFilter('all')} className="flex justify-between text-xs font-bold cursor-pointer">{isRtl ? 'جميع المواد' : 'All Items'}{materialFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}</DropdownMenuItem>
                        {allMaterials?.map(m => (
                          <DropdownMenuItem key={m.id} onClick={() => setMaterialFilter(m.id)} className="flex justify-between text-xs font-bold cursor-pointer">
                            {m.nameAr}
                            {materialFilter === m.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </DropdownMenuItem>
                        ))}
                     </ScrollArea>
                  </DropdownMenuContent>
               </DropdownMenu>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all", batchFilter !== 'all' && "border-emerald-500 bg-emerald-50")}>
                       <Workflow className={cn("w-4 h-4", batchFilter !== 'all' ? "text-emerald-600" : "text-slate-400")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-64 rounded-xl shadow-xl border-slate-200">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'حسب الدفعة' : 'BY BATCH'}</DropdownMenuLabel>
                     <ScrollArea className="h-48">
                        <DropdownMenuItem onClick={() => setBatchFilter('all')} className="flex justify-between text-xs font-bold cursor-pointer">{isRtl ? 'جميع الدفعات' : 'All Batches'}{batchFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}</DropdownMenuItem>
                        {allOrders?.filter(o => o.status !== 'deleted').map(o => (
                          <DropdownMenuItem key={o.id} onClick={() => setBatchFilter(o.id)} className="flex justify-between text-xs font-bold cursor-pointer">
                            <span className="truncate">{o.orderNumber} - {o.title}</span>
                            {batchFilter === o.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </DropdownMenuItem>
                        ))}
                     </ScrollArea>
                  </DropdownMenuContent>
               </DropdownMenu>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all">
                       <Filter className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56 rounded-xl shadow-xl border-slate-200">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'ترتيب النتائج' : 'SORT BY'}</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => toggleSort('date')} className="flex justify-between text-xs font-bold cursor-pointer py-2.5">
                        {isRtl ? 'حسب التاريخ' : 'Date'}
                        {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => toggleSort('qty')} className="flex justify-between text-xs font-bold cursor-pointer py-2.5">
                        {isRtl ? 'حسب الكمية' : 'Quantity'}
                        {sortBy === 'qty' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                     </DropdownMenuItem>
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
        
        {/* COMPACT STATS ROW */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-none">
          <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-emerald-200 transition-all flex-1 min-w-[160px]">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"><Layers className="w-4 h-4" /></div>
              <div className="flex flex-col overflow-hidden text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{isRtl ? 'سجلات الاستهلاك' : 'CONSUMPTION LOGS'}</p>
                <h3 className="text-sm font-black text-slate-900 tabular-nums">{stats.totalItems.toLocaleString('en-US')}</h3>
              </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-blue-200 transition-all flex-1 min-w-[160px]">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><Workflow className="w-4 h-4" /></div>
              <div className="flex flex-col overflow-hidden text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{isRtl ? 'أوامر إنتاج نشطة' : 'ACTIVE BATCHES'}</p>
                <h3 className="text-sm font-black text-blue-700 tabular-nums">{stats.uniqueOrders}</h3>
              </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-purple-200 transition-all flex-1 min-w-[160px]">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0"><Users2 className="w-4 h-4" /></div>
              <div className="flex flex-col overflow-hidden text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{isRtl ? 'حرفيين مستلمين' : 'UNIQUE PERSONNEL'}</p>
                <h3 className="text-sm font-black text-purple-700 tabular-nums">{stats.uniqueWorkers}</h3>
              </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
               <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{dictionary.colDate}</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{dictionary.colRef}</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{dictionary.colWorker}</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{dictionary.colBatch}</TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{dictionary.colMaterial}</TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{dictionary.colQty}</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-24 animate-pulse text-slate-400 font-black">{isRtl ? 'جاري سحب بيانات الاستهلاك...' : 'Loading Consumption Data...'}</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-24 text-slate-300 font-bold">{isRtl ? 'لا توجد بيانات مطابقة لهذه الفلاتر' : 'No matching consumption logs'}</TableCell></TableRow>
                  ) : filtered.map((d) => (
                    <TableRow key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                       <TableCell className={cn("px-6 py-4 font-bold text-slate-400 text-[11px] tabular-nums", isRtl ? "text-right" : "text-left")}>{d.date}</TableCell>
                       <TableCell className={cn("px-6 py-4 font-black text-slate-900 text-[11px] tabular-nums", isRtl ? "text-right" : "text-left")}>{d.voucherNumber}</TableCell>
                       <TableCell className={cn("px-6 py-4 font-bold text-slate-700 text-xs", isRtl ? "text-right" : "text-left")}>{d.workerName}</TableCell>
                       <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                          <div className="flex flex-col">
                             <span className="font-bold text-emerald-700 text-xs tabular-nums">{d.orderNumber}</span>
                             <span className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]">{d.orderTitle}</span>
                          </div>
                       </TableCell>
                       <TableCell className={cn("px-6 py-4 font-black text-slate-900 text-xs", isRtl ? "text-right" : "text-left")}>{d.nameAr}</TableCell>
                       <TableCell className="px-6 py-4 text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-black tabular-nums border-emerald-100 py-1 px-3">
                             {d.qty.toLocaleString('en-US')} <span className="ms-1 text-[8px] opacity-60 uppercase">{d.unit}</span>
                          </Badge>
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
         <p className="text-[10px] font-bold tracking-tight">{dictionary.auditNote}</p>
      </div>
    </div>
  );
}
