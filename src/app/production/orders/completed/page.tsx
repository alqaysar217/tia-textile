'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  History, 
  Eye, 
  FileDown, 
  Filter, 
  Calendar, 
  Hash, 
  ShoppingBag, 
  Loader2, 
  ArrowUpRight, 
  ShieldCheck,
  CalendarDays,
  Check,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  RotateCcw,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProduction } from '../../ProductionContext';

export default function CompletedOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const router = useRouter();
  const isRtl = lang === 'ar';

  const { isAdmin, permissions } = useProduction();
  const canEdit = isAdmin || permissions.orders?.edit;

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'orderNumber' | 'completedAt' | 'completedQty'>('completedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reactivatingOrder, setReactivatingOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forceUIUnlock = useCallback(() => {
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.body.removeAttribute('data-scroll-locked');
      
      const html = document.documentElement;
      html.style.pointerEvents = 'auto';
      html.style.overflow = 'auto';
      html.removeAttribute('data-scroll-locked');
    }, 200);
  }, []);

  useEffect(() => {
    if (!reactivatingOrder) {
      forceUIUnlock();
    }
  }, [reactivatingOrder, forceUIUnlock]);

  const ordersQuery = useMemo(() => !db ? null : query(
    collection(db, 'productionOrders'), 
    where('status', '==', 'completed')
  ), [db]);

  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: products } = useCollection<any>(productsQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    let list = orders.filter(o => {
      const product = products?.find(p => p.id === o.productId);
      const s = search.toLowerCase();
      
      const matchesSearch = (
        o.orderNumber?.toLowerCase().includes(s) || 
        o.title?.toLowerCase().includes(s) || 
        product?.nameAr?.includes(s)
      );

      const completedDate = o.completedAt?.toDate?.().toISOString().split('T')[0] || '';
      const matchesDateFrom = dateFrom ? completedDate >= dateFrom : true;
      const matchesDateTo = dateTo ? completedDate <= dateTo : true;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });

    return list.sort((a, b) => {
      let valA: any, valB: any;

      if (sortBy === 'completedAt') {
        valA = a.completedAt?.seconds || 0;
        valB = b.completedAt?.seconds || 0;
      } else if (sortBy === 'completedQty') {
        valA = Number(a.completedQty || 0);
        valB = Number(b.completedQty || 0);
      } else {
        valA = a.orderNumber || '';
        valB = b.orderNumber || '';
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [orders, products, search, dateFrom, dateTo, sortBy, sortOrder]);

  const handleReactivateOrder = async () => {
    if (!db || !reactivatingOrder || !canEdit || isSubmitting) return;

    setIsSubmitting(true);
    const targetId = reactivatingOrder.id;
    
    setReactivatingOrder(null);
    forceUIUnlock();

    try {
      await updateDoc(doc(db, 'productionOrders', targetId), {
        status: 'active',
        completedAt: null,
        updatedAt: serverTimestamp()
      });
      toast({ 
        title: isRtl ? "تم إعادة تنشيط الأمر" : "Order Re-activated",
        description: isRtl ? "تم نقل الأمر إلى ساحة العمل النشطة بنجاح." : "Order moved back to active workspace."
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleExportCSV = () => {
    const headers = isRtl 
      ? ['رقم السجل', 'العنوان', 'المنتج', 'تاريخ البدء', 'تاريخ الإتمام', 'الكمية النهائية']
      : ['Ref #', 'Title', 'Product', 'Started', 'Completed', 'Final Yield'];
    
    const rows = filteredOrders.map(o => {
      const product = products?.find(p => p.id === o.productId);
      return [
        o.orderNumber,
        o.title,
        product?.nameAr || '---',
        o.startDate,
        o.completedAt?.toDate?.().toLocaleDateString('en-US') || '---',
        o.completedQty || 0
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Completed_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast({ title: isRtl ? "تم تحميل الأرشيف" : "Archive Exported" });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'الإنتاج' : 'PRODUCTION'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'الأوامر المكتملة' : 'CLOSED ORDERS'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {isRtl ? 'أرشيف العمليات' : 'Historical Archive'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={isRtl ? 'بحث...' : 'Search...'}
                className={cn(
                  "h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold dark:text-slate-100",
                  isRtl ? "pr-9" : "pl-9"
                )}
              />
            </div>

            <Popover onOpenChange={(open) => !open && forceUIUnlock()}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all", (dateFrom || dateTo) && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20")}>
                  <CalendarDays className={cn("w-4 h-4", (dateFrom || dateTo) ? "text-emerald-600" : "text-slate-400")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align={isRtl ? "start" : "end"} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-right">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 pb-2">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {isRtl ? 'فلترة حسب تاريخ الإغلاق' : 'CLOSE DATE FILTER'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-slate-400 dark:text-slate-500">{isRtl ? 'من' : 'FROM'}</Label>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-slate-400 dark:text-slate-500">{isRtl ? 'إلى' : 'TO'}</Label>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
                    </div>
                  </div>
                  {(dateFrom || dateTo) && (
                    <Button variant="link" onClick={() => { setDateFrom(''); setDateTo(''); forceUIUnlock(); }} className="text-[9px] h-auto p-0 font-bold text-rose-500 underline uppercase w-full">
                      {isRtl ? 'إعادة تعيين' : 'RESET'}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu onOpenChange={(open) => !open && forceUIUnlock()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-56 rounded-xl shadow-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { toggleSort('completedAt'); forceUIUnlock(); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  {isRtl ? 'تاريخ الإتمام' : 'Completion Date'}
                  {sortBy === 'completedAt' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { toggleSort('completedQty'); forceUIUnlock(); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  {isRtl ? 'الكمية النهائية' : 'Final Yield'}
                  {sortBy === 'completedQty' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { toggleSort('orderNumber'); forceUIUnlock(); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  {isRtl ? 'رقم السجل' : 'Reference Number'}
                  {sortBy === 'orderNumber' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleExportCSV} variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md border-none">
              <FileDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-300">
           <div className="flex-1 overflow-auto no-scrollbar relative">
              <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
                 <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b dark:border-slate-700">
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>
                          {isRtl ? 'رقم السجل' : 'BATCH REF'}
                       </TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>
                          {isRtl ? 'عنوان الدفعة' : 'TITLE'}
                       </TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>
                          {isRtl ? 'المنتج النهائي' : 'FINISHED PRODUCT'}
                       </TableHead>
                       <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">
                          {isRtl ? 'تاريخ الإتمام' : 'CLOSED ON'}
                       </TableHead>
                       <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">
                          {isRtl ? 'الكمية النهائية' : 'YIELD'}
                       </TableHead>
                       <TableHead className="w-32 px-6 py-4 border-b border-slate-200 dark:border-slate-700"></TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {ordersLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse text-slate-400 dark:text-slate-600 font-black">{isRtl ? 'جاري فتح الأرشيف...' : 'Opening Archive...'}</TableCell></TableRow>
                    ) : filteredOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-24 text-slate-300 dark:text-slate-800 font-bold border-dashed border-2 border-slate-50 dark:border-slate-800 m-4 rounded-xl">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        {isRtl ? 'لا توجد أوامر مطابقة للبحث حالياً' : 'No matching closed orders found'}
                      </TableCell></TableRow>
                    ) : filteredOrders.map((order) => {
                      const product = products?.find(p => p.id === order.productId);
                      const completionDate = order.completedAt?.toDate?.().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US');
                      
                      return (
                        <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                           <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                              <Badge variant="outline" className="bg-slate-900 dark:bg-slate-950 text-white font-black tabular-nums border-none px-3 py-1 text-[10px]">{order.orderNumber}</Badge>
                           </TableCell>
                           <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                              <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{order.title}</span>
                           </TableCell>
                           <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                              <div className="flex items-center gap-2">
                                 <ShoppingBag className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                                 <span className="font-bold text-slate-600 dark:text-slate-400 text-xs">{product?.nameAr || '---'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-100 dark:border-emerald-900/30">
                                 <Calendar className="w-3 3" />
                                 <span className="tabular-nums">{completionDate || '---'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">{order.completedQty?.toLocaleString('en-US') || 0}</span>
                                 <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{isRtl ? 'حبة جاهزة' : 'PCS'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                 {canEdit && (
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           onClick={() => setReactivatingOrder(order)}
                                           className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                                         >
                                           <RotateCcw className="w-4 h-4" />
                                         </Button>
                                       </TooltipTrigger>
                                       <TooltipContent className="dark:bg-slate-800 dark:border-slate-700"><p className="text-[10px] font-bold">{isRtl ? 'إلغاء الإتمام (إعادة للعمل)' : 'Undo Completion'}</p></TooltipContent>
                                     </Tooltip>
                                   </TooltipProvider>
                                 )}

                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={() => router.push(`/production/orders/${order.id}`)} 
                                   className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all rounded-lg"
                                 >
                                    <ArrowUpRight className="w-4 h-4" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                      );
                    })}
                 </TableBody>
              </Table>
           </div>
        </div>
      </div>

      <AlertDialog open={!!reactivatingOrder} onOpenChange={(open) => { if(!open) setReactivatingOrder(null); forceUIUnlock(); }}>
        <AlertDialogContent className="max-w-[450px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
           <div className="bg-amber-950 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCw className="w-32 h-32 text-white" /></div>
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
                <RotateCcw className="w-8 h-8 text-amber-400" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'إلغاء إتمام الطلب' : 'Undo Order Completion'}</AlertDialogTitle>
              <AlertDialogDescription className="text-amber-100/50 font-bold mt-2 text-xs leading-relaxed text-center">
                 {isRtl 
                   ? `هل ترغب في إعادة أمر الإنتاج رقم (${reactivatingOrder?.orderNumber}) إلى قائمة "تحذير العمل" النشطة؟ سيتمكن الموظفون من تسجيل سندات جديدة عليه مرة أخرى.` 
                   : `Do you want to move order (${reactivatingOrder?.orderNumber}) back to active workspace? This will allow new vouchers to be recorded.`}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={handleReactivateOrder} disabled={isSubmitting} className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-lg border-none transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <RefreshCw className="w-4 h-4 me-2" />}
                {isRtl ? 'تأكيد الإرجاع' : 'Yes, Re-activate'}
              </AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 font-black rounded-xl text-slate-400 dark:text-slate-500 border-none">{isRtl ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/80 text-white/40 dark:text-slate-500 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl transition-colors duration-300">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول السجلات التاريخية: أوامر الإنتاج المكتملة هي مرجع إداري. ميزة "إعادة التنشيط" متاحة فقط لتصحيح الأخطاء الإجرائية.' 
             : 'Historical Protocol: Closed orders are administrative references. "Undo" is for corrective actions only.'}
         </p>
      </div>

    </div>
  );
}
