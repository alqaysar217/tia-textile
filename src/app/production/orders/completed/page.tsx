'use client';

import React, { useState, useMemo } from 'react';
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
  TrendingUp,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
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

export default function CompletedOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const isRtl = lang === 'ar';

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : query(
    collection(db, 'productionOrders'), 
    where('status', '==', 'completed'),
    orderBy('completedAt', 'desc')
  ), [db]);

  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('status', '==', 'posted')), [db]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: products } = useCollection<any>(productsQuery);
  const { data: departments } = useCollection<any>(deptsQuery);
  const { data: allReceipts } = useCollection<any>(vouchersQuery);

  const sortedDepts = useMemo(() => {
    if (!departments) return [];
    return [...departments].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [departments]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const product = products?.find(p => p.id === o.productId);
      const s = search.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(s) || 
        o.title?.toLowerCase().includes(s) || 
        product?.nameAr?.includes(s)
      );
    });
  }, [orders, products, search]);

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

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'الإنتاج' : 'PRODUCTION'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600">{isRtl ? 'أرشيف الأوامر المكتملة' : 'CLOSED ORDERS'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {isRtl ? 'سجل عمليات الإنتاج التاريخي' : 'Production History Archive'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-tight">{isRtl ? 'إجمالي المكتمل' : 'TOTAL CLOSED'}</p>
                <p className="text-lg font-black text-emerald-600 tabular-nums">{orders?.length || 0}</p>
             </div>
             <Button onClick={handleExportCSV} variant="outline" className="h-10 px-4 rounded-lg font-black text-xs gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                <FileDown className="w-4 h-4 text-emerald-600" />
                {isRtl ? 'تصدير الأرشيف' : 'Export Archive'}
             </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? 'بحث في الأرشيف برقم الأمر أو العنوان...' : 'Search completed batches...'}
              className={cn("h-10 bg-white border-slate-200 text-xs font-bold", isRtl ? "pr-10" : "pl-10")}
            />
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
           <div className="flex-1 overflow-auto no-scrollbar relative">
              <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
                 <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                          {isRtl ? 'رقم السجل' : 'BATCH REF'}
                       </TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                          {isRtl ? 'عنوان الدفعة' : 'TITLE'}
                       </TableHead>
                       <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                          {isRtl ? 'المنتج النهائي' : 'FINISHED PRODUCT'}
                       </TableHead>
                       <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">
                          {isRtl ? 'تاريخ الإتمام' : 'CLOSED ON'}
                       </TableHead>
                       <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">
                          {isRtl ? 'الكمية النهائية' : 'YIELD'}
                       </TableHead>
                       <TableHead className="w-20 px-6 py-4 border-b border-slate-200"></TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {ordersLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse text-slate-400 font-black">{isRtl ? 'جاري فتح الأرشيف...' : 'Opening Archive...'}</TableCell></TableRow>
                    ) : filteredOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-24 text-slate-300 font-bold border-dashed border-2 border-slate-50 m-4 rounded-xl">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        {isRtl ? 'لا توجد أوامر مكتملة حالياً' : 'No closed orders found'}
                      </TableCell></TableRow>
                    ) : filteredOrders.map((order) => {
                      const product = products?.find(p => p.id === order.productId);
                      const completionDate = order.completedAt?.toDate?.().toLocaleDateString(isRtl ? 'ar-YE' : 'en-US');
                      
                      return (
                        <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 group">
                           <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                              <Badge variant="outline" className="bg-slate-900 text-white font-black tabular-nums border-none px-3 py-1 text-[10px]">{order.orderNumber}</Badge>
                           </TableCell>
                           <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                              <span className="font-black text-slate-900 text-xs">{order.title}</span>
                           </TableCell>
                           <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                              <div className="flex items-center gap-2">
                                 <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
                                 <span className="font-bold text-slate-600 text-xs">{product?.nameAr || '---'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-100">
                                 <Calendar className="w-3 h-3" />
                                 <span className="tabular-nums">{completionDate || '---'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-sm font-black text-slate-900 tabular-nums">{order.completedQty?.toLocaleString('en-US') || 0}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'حبة جاهزة' : 'PCS'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="px-6 py-4 text-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => router.push(`/production/orders/${order.id}`)} 
                                className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-lg"
                              >
                                 <ArrowUpRight className="w-4 h-4" />
                              </Button>
                           </TableCell>
                        </TableRow>
                      );
                    })}
                 </TableBody>
              </Table>
           </div>
        </div>
      </div>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول السجلات التاريخية: أوامر الإنتاج المكتملة هي مرجع إداري غير قابل للتعديل المباشر لضمان دقة التقارير السنوية.' 
             : 'Historical Protocol: Closed orders are read-only administrative references for accurate annual auditing.'}
         </p>
      </div>

    </div>
  );
}
