'use client';

import React, { useMemo, useState } from 'react';
import { 
  PackageCheck, 
  ChevronRight, 
  Search, 
  FileDown, 
  History, 
  ShoppingBag, 
  RefreshCcw, 
  Loader2,
  XCircle,
  Truck,
  Info,
  Filter,
  CalendarDays,
  Check,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Hash,
  Activity,
  Layers,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc, serverTimestamp, increment, limit } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useProduction } from '../../ProductionContext';

export default function FinishedGoodsWarehousePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  
  // استيراد الصلاحيات
  const { permissions, isAdmin } = useProduction();
  const canEdit = isAdmin || permissions.materials?.edit;

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reversingTx, setReversingTx] = useState<any | null>(null);

  // Filter & Sort State
  const [sortBy, setSortBy] = useState<'nameAr' | 'currentStock' | 'sku'>('nameAr');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isRtl = lang === 'ar';

  const categories = [
    "شبواني", "ملكي", "حليسي", "بيضاني", "حديدي", "شحري", "سلاطيني", 
    "اللحجي", "الحضرمي", "الوصابي", "التهامي", "العدني", 
    "الصنعاني", "السادة", "الشموخ", "أخرى"
  ];

  // Fetch Data
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const whQuery = useMemo(() => !db ? null : collection(db, 'finishedGoodsWarehouse'), [db]);
  const txQuery = useMemo(() => !db ? null : query(collection(db, 'warehouseTransactions'), orderBy('createdAt', 'desc'), limit(100)), [db]);

  const { data: allProducts, loading: pL } = useCollection<any>(productsQuery);
  const { data: whData, loading: wL } = useCollection<any>(whQuery);
  const { data: transactions, loading: tL } = useCollection<any>(txQuery);

  const filteredInventory = useMemo(() => {
    if (!allProducts) return [];
    let list = allProducts.filter(p => p.status !== 'deleted');
    
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.nameAr?.includes(s) || p.sku?.toLowerCase().includes(s));
    }

    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }

    const mapped = list.map(p => {
      const wh = whData?.find(w => w.id === p.id);
      return { ...p, currentStock: wh?.totalQty || 0, lastIn: wh?.updatedAt };
    });

    return mapped.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'currentStock') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [allProducts, whData, search, sortBy, sortOrder, categoryFilter]);

  const filteredHistory = useMemo(() => {
    if (!transactions) return [];
    let list = [...transactions];
    
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(tx => tx.voucherNumber?.toLowerCase().includes(s));
    }

    if (dateFrom) list = list.filter(tx => tx.date >= dateFrom);
    if (dateTo) list = list.filter(tx => tx.date <= dateTo);

    return list;
  }, [transactions, search, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const list = activeTab === 'inventory' ? filteredInventory : filteredHistory;
    if (list.length === 0) return;

    let headers = [];
    let rows = [];

    if (activeTab === 'inventory') {
      headers = [isRtl ? 'المنتج' : 'Product', 'SKU', isRtl ? 'الفئة' : 'Category', isRtl ? 'الرصيد' : 'Stock'];
      rows = list.map(p => [p.nameAr, p.sku, p.category, p.currentStock]);
    } else {
      headers = [isRtl ? 'رقم السند' : 'Ref #', isRtl ? 'التاريخ' : 'Date', isRtl ? 'المنتج' : 'Product', isRtl ? 'الكمية' : 'Qty', isRtl ? 'الحالة' : 'Status'];
      rows = list.map(tx => {
        const p = allProducts?.find(prod => prod.id === tx.productId);
        return [tx.voucherNumber, tx.date, p?.nameAr || '---', tx.qty, tx.status];
      });
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Warehouse_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: isRtl ? "تم تحميل الملف بنجاح" : "Exported Successfully" });
  };

  const handleReverseTransfer = async () => {
    if (!db || !reversingTx || isSubmitting) return;

    // حماية الصلاحيات برمجياً لعكس الترحيل
    if (!canEdit) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بإلغاء الترحيل" : "Permission Denied" });
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      const { productId, qty, voucherId, id: txId } = reversingTx;
      
      const whRef = doc(db, 'finishedGoodsWarehouse', productId);
      batch.update(whRef, { totalQty: increment(-qty), updatedAt: serverTimestamp() });

      batch.update(doc(db, 'vouchers', voucherId), { 
        isTransferred: false,
        warehouseTransactionId: null 
      });

      batch.update(doc(db, 'warehouseTransactions', txId), { 
        status: 'reversed', 
        reversedAt: serverTimestamp() 
      });

      await batch.commit();
      toast({ title: isRtl ? "تم إلغاء الترحيل بنجاح" : "Transfer reversed successfully" });
      setReversingTx(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: isRtl ? "خطأ في معالجة العملية" : "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dictionary = {
    title: isRtl ? 'مستودع المنتجات الجاهزة' : 'Finished Goods Warehouse',
    inventoryTab: isRtl ? 'الجرد الحالي' : 'Current Stock',
    historyTab: isRtl ? 'سجل العمليات' : 'Transactions',
    searchPlaceholder: isRtl ? 'بحث بالسند أو المنتج...' : 'Search records...',
    productCol: isRtl ? 'المنتج' : 'PRODUCT',
    categoryCol: isRtl ? 'الفئة' : 'CATEGORY',
    stockCol: isRtl ? 'الرصيد المتاح' : 'STOCK',
    lastInCol: isRtl ? 'آخر دخول' : 'LAST IN',
    txCol: isRtl ? 'رقم السند' : 'REF #',
    qtyCol: isRtl ? 'الكمية' : 'QTY',
    statusCol: isRtl ? 'الحالة' : 'STATUS',
    pcsLabel: isRtl ? 'قطعة جاهزة' : 'Pcs Ready',
    reverseBtn: isRtl ? 'إلغاء الترحيل' : 'Reverse',
    postedStatus: isRtl ? 'مرحل' : 'Posted',
    reversedStatus: isRtl ? 'ملغي' : 'Reversed',
    auditNote: isRtl 
      ? 'نظام الرقابة المخزنية: يمكنك عكس أي عملية ترحيل من سجل العمليات لاستعادة الرصيد الأصلي.' 
      : 'Inventory Audit: You can reverse transfers from history to restore balance.',
    navWarehouse: isRtl ? 'المستودعات' : 'Warehousing',
    navFinished: isRtl ? 'المنتجات الجاهزة' : 'Finished Goods'
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{dictionary.navWarehouse}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{dictionary.navFinished}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">{dictionary.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
             <button onClick={() => setActiveTab('inventory')} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", activeTab === 'inventory' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400")}>
               {dictionary.inventoryTab}
             </button>
             <button onClick={() => setActiveTab('history')} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", activeTab === 'history' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400")}>
               {dictionary.historyTab}
             </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
           <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={dictionary.searchPlaceholder} 
                className={cn("h-9 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100", isRtl ? "pr-10" : "pl-10")} 
              />
           </div>

           <div className="flex items-center gap-1.5 px-1.5 border-s border-slate-200 dark:border-slate-700">
              <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-3 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {isRtl ? 'تصدير' : 'Export'}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                   <Button variant="ghost" className={cn("h-9 px-3 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors", (dateFrom || dateTo) && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400")}>
                     <CalendarDays className="w-3.5 h-3.5" />
                     {isRtl ? 'الفترة' : 'Date Range'}
                   </Button>
                </PopoverTrigger>
                <PopoverContent align={isRtl ? "start" : "end"} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                   <div className="space-y-4 text-right">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 pb-2"><CalendarDays className="w-3.5 h-3.5" />{isRtl ? 'تصفية زمنية' : 'DATE FILTER'}</div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 dark:text-slate-500">من</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" /></div>
                         <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 dark:text-slate-500">إلى</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" /></div>
                      </div>
                      {(dateFrom || dateTo) && <Button onClick={() => { setDateFrom(''); setDateTo(''); }} variant="link" className="text-[9px] h-auto p-0 font-bold text-rose-500 underline uppercase w-full">إعادة تعيين</Button>}
                   </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="h-9 px-3 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                     <Filter className="w-3.5 h-3.5" />
                     {isRtl ? 'تصفية' : 'Filter'}
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-64 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                   <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                   <DropdownMenuItem onClick={() => { setSortBy('nameAr'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800">
                      <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {isRtl ? 'اسم المنتج' : 'Product Name'}</div>
                      {sortBy === 'nameAr' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => { setSortBy('currentStock'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800">
                      <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {isRtl ? 'الرصيد المتاح' : 'Available Stock'}</div>
                      {sortBy === 'currentStock' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => { setSortBy('sku'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800">
                      <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {isRtl ? 'كود الصنف' : 'Product SKU'}</div>
                      {sortBy === 'sku' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                   </DropdownMenuItem>

                   <DropdownMenuSeparator className="dark:bg-slate-800" />
                   <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'حسب الفئة' : 'BY CATEGORY'}</DropdownMenuLabel>
                   <ScrollArea className="h-48">
                      <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-300">
                        {isRtl ? 'الكل' : 'All'}
                        {categoryFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </DropdownMenuItem>
                      {categories.map(c => (
                        <DropdownMenuItem key={c} onClick={() => setCategoryFilter(c)} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-300">
                          {c}
                          {categoryFilter === c && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </DropdownMenuItem>
                      ))}
                   </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-300">
           <div className="flex-1 overflow-auto no-scrollbar relative">
              <Table className={cn("border-separate border-spacing-0 w-full", isRtl ? "text-right" : "text-left")}>
                <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                   <TableRow className="border-b dark:border-slate-700">
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>
                       {activeTab === 'inventory' ? dictionary.productCol : dictionary.txCol}
                     </TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>
                       {activeTab === 'inventory' ? dictionary.categoryCol : dictionary.productCol}
                     </TableHead>
                     <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">
                       {dictionary.qtyCol}
                     </TableHead>
                     <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>
                       {activeTab === 'inventory' ? dictionary.lastInCol : dictionary.statusCol}
                     </TableHead>
                     {activeTab === 'history' && <TableHead className="w-32 border-b border-slate-200 dark:border-slate-700"></TableHead>}
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {activeTab === 'inventory' ? (
                     filteredInventory.map(p => (
                       <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-all duration-300">
                          <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 rounded-lg border dark:border-slate-800 shadow-sm shrink-0 bg-slate-50 dark:bg-slate-800">
                                   <AvatarImage src={p.image} className="object-cover" />
                                   <AvatarFallback className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"><ShoppingBag className="w-5 h-5" /></AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{p.nameAr}</span>
                                   <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold tabular-nums tracking-widest uppercase">{p.sku}</span>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                             <div className="flex items-center gap-2">
                                <Tag className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                                <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px] font-black uppercase">{p.category}</span>
                             </div>
                          </TableCell>
                          <TableCell className="px-6 py-3 text-center">
                             <div className="flex flex-col items-center">
                                <span className="text-base font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{(p.currentStock || 0).toLocaleString('en-US')}</span>
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dictionary.pcsLabel}</span>
                             </div>
                          </TableCell>
                          <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                             <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[9px] font-bold tabular-nums">
                                <History className="w-3 h-3 opacity-40" />
                                {p.lastIn?.toDate?.().toLocaleString(isRtl ? 'ar-YE' : 'en-US') || '---'}
                             </div>
                          </TableCell>
                       </TableRow>
                     ))
                   ) : (
                     filteredHistory.map(tx => {
                       const p = allProducts?.find(prod => prod.id === tx.productId);
                       const isReversed = tx.status === 'reversed';
                       return (
                         <TableRow key={tx.id} className={cn("border-b border-slate-100 dark:border-slate-800 transition-all", isReversed ? "opacity-50 grayscale bg-slate-50/50 dark:bg-slate-800/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50")}>
                            <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                               <div className="flex flex-col">
                                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums">{tx.voucherNumber}</span>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tabular-nums">{tx.date}</span>
                               </div>
                            </TableCell>
                            <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                               <div className="flex items-center gap-2">
                                  <ShoppingBag className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{p?.nameAr || '---'}</span>
                               </div>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                               <span className={cn("text-xs font-black tabular-nums", isReversed ? "text-slate-400 dark:text-slate-600 line-through" : "text-blue-700 dark:text-blue-400")}>
                                  {tx.qty} {isRtl ? 'قطعة' : 'Pcs'}
                                </span>
                            </TableCell>
                            <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                               <Badge variant="outline" className={cn("text-[8px] font-black uppercase", isReversed ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30")}>
                                  {isReversed ? dictionary.reversedStatus : dictionary.postedStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                               {!isReversed && canEdit && (
                                  <Button variant="ghost" size="sm" onClick={() => setReversingTx(tx)} className="h-8 px-3 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-black text-[9px] gap-2 transition-all">
                                     <RefreshCcw className="w-3 h-3" /> {dictionary.reverseBtn}
                                  </Button>
                               )}
                            </TableCell>
                         </TableRow>
                       );
                     })
                   )}
                   {((activeTab === 'inventory' ? filteredInventory : filteredHistory).length === 0) && (
                     <TableRow><TableCell colSpan={activeTab === 'inventory' ? 4 : 5} className="py-20 text-center text-slate-300 dark:text-slate-700 font-bold">{isRtl ? 'لا توجد بيانات مطابقة للبحث أو التصفية' : 'No matching data available'}</TableCell></TableRow>
                   )}
                </TableBody>
              </Table>
           </div>
        </div>
      </div>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/90 text-white/40 dark:text-slate-500 flex items-center justify-center gap-4 border-t border-white/5 transition-colors duration-300 shadow-2xl">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">{dictionary.auditNote}</p>
      </div>

      {/* REVERSE DIALOG */}
      <AlertDialog open={!!reversingTx} onOpenChange={(open) => !open && setReversingTx(null)}>
        <AlertDialogContent className="max-w-[450px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
           <div className="bg-rose-950 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCcw className="w-32 h-32 text-white" /></div>
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
                 <RefreshCcw className="w-8 h-8 text-rose-500" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'إلغاء ترحيل المنجز' : 'Reverse Stock Entry'}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
                 {isRtl ? `سيتم سحب عدد (${reversingTx?.qty}) قطعة من رصيد المستودع الحالي وإعادة تفعيل السند في قسم الإنتاج. هل أنت متأكد؟` : `This will deduct (${reversingTx?.qty}) items from current stock and restore the production receipt. Confirm?`}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={handleReverseTransfer} disabled={isSubmitting} className="flex-1 h-12 bg-rose-600 hover:bg-red-700 text-white rounded-md font-black shadow-lg border-none transition-all active:scale-95">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <XCircle className="w-4 h-4 me-2" />}
                 {isRtl ? 'تأكيد التراجع' : 'Confirm Reverse'}
              </AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">{isRtl ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
