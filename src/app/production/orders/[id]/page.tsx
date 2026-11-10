'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  Target, 
  CheckCircle2, 
  Hash,
  ShoppingBag,
  Info,
  Loader2,
  Plus,
  ShieldCheck,
  Calendar,
  Activity,
  Edit2,
  BarChart3,
  ClipboardList,
  Type,
  User,
  Eye,
  Download,
  FileInput,
  FileOutput,
  HandCoins,
  Tag,
  Search,
  Filter,
  Check,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Package,
  Box,
  FileText,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';

export default function OrderDetailsDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  const [activeTab, setActiveTab] = useState<string>('info');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [stageSearch, setStageSearch] = useState('');
  const [stageTypeFilter, setStageTypeFilter] = useState<'all' | 'material_issue' | 'production_receipt' | 'wage_payment' | 'material_return'>('all');
  const [stageSortOrder, setStageSortOrder] = useState<'asc' | 'desc'>('desc');

  const orderRef = useMemo(() => !db ? null : doc(db, 'productionOrders', id as string), [db, id]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('orderId', '==', id)), [db, id]);
  const deptsQuery = useMemo(() => !db ? null : query(collection(db, 'departments'), where('status', '!=', 'deleted')), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);
  const { data: rawVouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);
  const { data: departments, loading: deptsLoading } = useCollection<any>(deptsQuery);
  const { data: workers } = useCollection<any>(workersQuery);
  const { data: products } = useCollection<any>(productsQuery);

  const [editFormData, setEditFormDate] = useState({
    title: '',
    productId: '',
    targetQty: 0,
    priority: 'normal',
    notes: ''
  });

  const handleOpenEdit = () => {
    if (!order) return;
    setEditFormDate({
      title: order.title || '',
      productId: order.productId || '',
      targetQty: order.targetQty || 0,
      priority: order.priority || 'normal',
      notes: order.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !order || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'productionOrders', order.id), {
        ...editFormData,
        targetQty: Number(editFormData.targetQty),
        updatedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم تحديث البيانات بنجاح" : "Order Updated Successfully" });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vouchers = useMemo(() => {
    if (!rawVouchers) return [];
    return [...rawVouchers].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [rawVouchers]);

  const product = useMemo(() => products?.find(p => p.id === order?.productId), [products, order]);

  const finalStage = useMemo(() => departments?.[departments.length - 1], [departments]);
  const finalCompletedQty = useMemo(() => {
    if (!vouchers || !finalStage) return 0;
    return vouchers
      .filter(v => v.type === 'production_receipt' && v.currentStageId === finalStage.id && v.status !== 'deleted')
      .reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
  }, [vouchers, finalStage]);

  const progress = useMemo(() => {
    if (!order || !order.targetQty) return 0;
    return Math.round((finalCompletedQty / order.targetQty) * 100);
  }, [finalCompletedQty, order]);

  const filteredStageVouchers = useMemo(() => {
    if (!vouchers || activeTab === 'info' || activeTab === 'summary') return [];
    
    let list = vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      
      const worker = workers?.find(w => w.id === v.workerId);
      const deptIdOfVoucher = v.currentStageId || worker?.departmentId;
      
      const isInStage = deptIdOfVoucher === activeTab;
      if (!isInStage) return false;
      
      if (stageTypeFilter !== 'all' && v.type !== stageTypeFilter) return false;
      if (stageSearch) {
        const s = stageSearch.toLowerCase();
        return v.voucherNumber?.toLowerCase().includes(s) || 
               worker?.fullName?.toLowerCase().includes(s) ||
               v.notes?.toLowerCase().includes(s);
      }
      return true;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return stageSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [vouchers, activeTab, workers, stageSearch, stageTypeFilter, stageSortOrder]);

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !viewingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2, 
        cacheBust: true,
        fontEmbedCSS: '',
      });
      const link = document.createElement('a');
      link.download = `${viewingVoucher.type}-${viewingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Image generation failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (orderLoading || deptsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جاري فتح السجل الفني...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden" dir={dir}>
      
      {/* COMPACT ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right rtl:text-right ltr:text-left">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'أوامر الإنتاج' : 'Work Orders'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600 tabular-nums">{order.orderNumber}</span>
              </div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">{order.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button onClick={handleOpenEdit} variant="outline" className="h-9 px-4 font-black gap-2 border-slate-200 text-slate-600 text-[11px] rounded-lg"><Edit2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'تعديل الأمر' : 'Edit Order'}</Button>
             <Button onClick={() => router.push(`/production/vouchers/issue?orderId=${order.id}`)} className="h-9 px-5 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 border-none text-[11px]"><Plus className="w-3.5 h-3.5" /> {lang === 'ar' ? 'عملية جديدة' : 'New Op'}</Button>
          </div>
        </div>
      </div>

      {/* STAGE SELECTOR TABS */}
      <div className="flex-none bg-slate-900 z-20 shadow-lg">
        <div className="flex items-center h-12 gap-1 overflow-x-auto no-scrollbar scroll-smooth px-4">
          <button onClick={() => setActiveTab('info')} className={cn("flex items-center gap-2 px-5 h-full transition-all font-black text-[10px] uppercase tracking-wider shrink-0", activeTab === 'info' ? "bg-emerald-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70")}><Info className="w-3.5 h-3.5" />{lang === 'ar' ? 'معلومات الدفعة' : 'Batch Info'}</button>
          <div className="h-4 w-px bg-white/10 shrink-0" />
          {departments?.map((dept, idx) => (
            <button key={dept.id} onClick={() => setActiveTab(dept.id)} className={cn("flex items-center gap-2 px-5 h-full transition-all text-[10px] font-black uppercase tracking-wider shrink-0", activeTab === dept.id ? "bg-emerald-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70")}>
              <span className={cn("w-4 h-4 rounded flex items-center justify-center text-[8px] font-black border", activeTab === dept.id ? "bg-emerald-500 border-white/20" : "bg-white/5 border-white/10")}>{idx + 1}</span>
              <span>{dept.nameAr}</span>
            </button>
          ))}
          <div className="h-4 w-px bg-white/10 shrink-0" />
          <button onClick={() => setActiveTab('summary')} className={cn("flex items-center gap-2 px-5 h-full transition-all font-black text-[10px] uppercase tracking-wider shrink-0", activeTab === 'summary' ? "bg-blue-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70")}><BarChart3 className="w-3.5 h-3.5" />{lang === 'ar' ? 'الملخص الإحصائي' : 'Analytics'}</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 no-scrollbar">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* TAB 1: MASTER LEDGER INFO (RTL REVERSED) */}
          {activeTab === 'info' && (
            <ScrollArea className="flex-1 animate-in fade-in duration-300">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-600" />{lang === 'ar' ? 'سجل المواصفات الفنية المعتمد' : 'MASTER LEDGER'}</h3>
               </div>
               <div className="overflow-hidden">
                  <table className="w-full text-right border-separate border-spacing-0" dir={dir}>
                     <tbody className="divide-y divide-slate-100">
                        <LedgerRow label={lang === 'ar' ? 'رقم السجل الموحد' : 'REFERENCE'} value={order.orderNumber} icon={<Hash className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'تاريخ البدء' : 'LAUNCH DATE'} value={order.startDate} icon={<Calendar className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'عنوان الدفعة' : 'BATCH TITLE'} value={order.title} icon={<Type className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'المنتج المستهدف' : 'TARGET PRODUCT'} value={product?.nameAr} icon={<ShoppingBag className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'} value={`${order.targetQty} قطعة`} icon={<Target className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الكمية المنجزة (النهائية)' : 'COMPLETED'} value={`${finalCompletedQty} قطعة`} icon={<CheckCircle2 className="w-4 h-4" />} color="text-emerald-700" />
                        <LedgerRow label={lang === 'ar' ? 'قيد العمل (WIP)' : 'WIP'} value={`${Math.max(0, order.targetQty - finalCompletedQty)} قطعة`} icon={<Package className="w-4 h-4" />} color="text-blue-600" />
                        <LedgerRow label={lang === 'ar' ? 'الأولوية' : 'PRIORITY'} value={order.priority} icon={<ShieldCheck className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الحالة' : 'STATUS'} value={order.status} icon={<Tag className="w-4 h-4" />} />
                        <tr className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-6 py-4 w-72 border-l border-slate-100 bg-slate-50/30">
                              <div className="flex items-center gap-3 justify-start">
                                 <div className="p-1.5 bg-white border border-slate-100 rounded text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Activity className="w-4 h-4" />
                                 </div>
                                 <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'مستوى التقدم الإجمالي' : 'PROGRESS'}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-4 justify-end">
                                 <span className="text-xs font-black text-emerald-700 tabular-nums">{progress}%</span>
                                 <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                 </div>
                              </div>
                           </td>
                        </tr>
                        {order.notes && (
                           <tr className="bg-slate-50/50">
                             <td className="px-6 py-5 w-72 border-l border-slate-100">
                               <div className="flex items-center gap-3 justify-start">
                                 <div className="p-1.5 bg-white border border-slate-100 rounded text-emerald-600"><Info className="w-4 h-4" /></div>
                                 <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">NOTES</span>
                               </div>
                             </td>
                             <td className="px-6 py-5 text-xs font-bold text-slate-600 italic leading-relaxed text-left">{order.notes}</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </ScrollArea>
          )}

          {/* TAB 2: DYNAMIC STAGE LOG */}
          {activeTab !== 'info' && activeTab !== 'summary' && (
            <div className="flex-1 flex-col flex animate-in fade-in duration-300 overflow-hidden">
               <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shadow-sm">
                  <div className="relative flex-1">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300`} />
                    <Input value={stageSearch} onChange={(e) => setStageSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث في سجل المرحلة...' : 'Search stage log...'} className={cn("h-9 bg-white text-xs font-bold border-slate-200", dir === 'rtl' ? "pr-9" : "pl-9")} />
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-200">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-black gap-2 text-slate-600 hover:bg-white"><Filter className="w-3.5 h-3.5" />{lang === 'ar' ? 'تصفية' : 'Filter'}</Button></DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-56 rounded-xl shadow-xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">VOUCHER TYPE</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('all')} className="text-xs font-bold flex justify-between cursor-pointer">{lang === 'ar' ? 'الكل' : 'All'}{stageTypeFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('material_issue')} className="text-xs font-bold flex justify-between cursor-pointer">{lang === 'ar' ? 'صرف مواد' : 'Material Issue'}{stageTypeFilter === 'material_issue' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('production_receipt')} className="text-xs font-bold flex justify-between cursor-pointer">{lang === 'ar' ? 'استلام انتاج' : 'Production Receipt'}{stageTypeFilter === 'production_receipt' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('material_return')} className="text-xs font-bold flex justify-between cursor-pointer">{lang === 'ar' ? 'توريد مرتجع' : 'Material Return'}{stageTypeFilter === 'material_return' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('wage_payment')} className="text-xs font-bold flex justify-between cursor-pointer">{lang === 'ar' ? 'صرف أجور' : 'Wage Payment'}{stageTypeFilter === 'wage_payment' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                     LOG COUNT: <span className="text-emerald-600">{filteredStageVouchers.length}</span>
                  </div>
               </div>
               <div className="flex-1 overflow-auto">
                  <Table className="text-right border-separate border-spacing-0">
                    <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className={cn("px-6 py-3 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                        <TableHead className={cn("px-6 py-3 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>REF #</TableHead>
                        <TableHead className={cn("px-6 py-3 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>ACTIVITY</TableHead>
                        <TableHead className={cn("px-6 py-3 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>PERSONNEL</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center">IMPACT</TableHead>
                        <TableHead className="px-6 py-3 w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStageVouchers.map((v) => (
                        <LedgerTransactionRow key={v.id} voucher={v} worker={workers?.find(w => w.id === v.workerId)} lang={lang} onView={(v) => setViewingVoucher(v)} />
                      ))}
                    </TableBody>
                  </Table>
               </div>
            </div>
          )}

          {/* TAB 3: SUMMARY ANALYTICS */}
          {activeTab === 'summary' && (activeTab === 'summary' && (
            <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300">
               <div className="p-4 bg-slate-900 text-white flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> {lang === 'ar' ? 'التحليل الإحصائي لخطوط الإنتاج' : 'ANALYTICS'}</h3></div>
               <div className="flex-1 overflow-auto">
                  <Table className="text-right border-separate border-spacing-0">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm"><TableRow><TableHead className="px-6 py-3 font-black text-[10px] text-slate-500">WORK CENTER</TableHead><TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 text-center">COMPLETED</TableHead><TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 text-center">WAGE COST</TableHead><TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 text-center">PROGRESS</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {departments?.map(d => {
                        const stageReceipts = vouchers.filter(v => (v.currentStageId === d.id || workers?.find(w => w.id === v.workerId)?.departmentId === d.id) && v.type === 'production_receipt' && v.status !== 'deleted');
                        const done = stageReceipts.reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
                        const cost = stageReceipts.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
                        const p = Math.round((done / (order.targetQty || 1)) * 100);
                        return (
                          <TableRow key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                             <TableCell className="px-6 py-4 font-black text-slate-900 text-xs">{d.nameAr}</TableCell>
                             <TableCell className="px-6 py-4 text-center font-bold text-slate-700 tabular-nums">{done.toLocaleString('en-US')}</TableCell>
                             <TableCell className="px-6 py-4 text-center font-black text-emerald-700 tabular-nums">{cost.toLocaleString('en-US')} YER</TableCell>
                             <TableCell className="px-6 py-4 text-center">
                                <div className="flex items-center gap-3 justify-center"><div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${p}%` }} /></div><span className="text-[10px] font-black text-slate-400 tabular-nums">{p}%</span></div>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* VOUCHER PRINT VIEW DIALOG */}
      <Dialog open={!!viewingVoucher} onOpenChange={(open) => !open && setViewingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>معاينة السند الرسمي</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white relative z-0" id="printable-voucher">
              {viewingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.035] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>

                  <div className="grid grid-cols-3 items-center border-b-[6px] border-emerald-800 pb-8 mb-8 relative z-10">
                    <div className="text-right space-y-1">
                      <h2 className="text-xl font-black text-emerald-900 leading-tight">جمعية الصناعات النسيجية</h2>
                      <p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p>
                      <p className="text-[11px] font-bold text-slate-400 tabular-nums" dir="ltr">0777 263 091 | nseeg202020@gmail.com</p>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-24 h-24 bg-white border-2 border-emerald-800/10 rounded-full flex items-center justify-center p-2 shadow-sm relative overflow-hidden">
                        <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div className="text-left space-y-1" dir="ltr">
                      <h2 className="text-[14px] font-black text-emerald-900 uppercase leading-tight tracking-tight">Textile Industries Association</h2>
                      <p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa - Yemen</p>
                      <p className="text-[10px] font-bold text-slate-400 tabular-nums">0777 263 091 | nseeg202020@gmail.com</p>
                    </div>
                  </div>

                  <div className="text-center mb-10 relative z-10">
                    <div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm ring-4 ring-emerald-50">
                      <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">
                        {viewingVoucher.type === 'material_issue' ? (lang === 'ar' ? 'سند صرف مواد خام' : 'Material Issue') : 
                         viewingVoucher.type === 'production_receipt' ? (lang === 'ar' ? 'سند استلام وتسوية إنتاج' : 'Production Settlement') :
                         viewingVoucher.type === 'wage_payment' ? (lang === 'ar' ? 'سند صرف أجور مالي' : 'Wage Payment') :
                         viewingVoucher.type === 'material_return' ? (lang === 'ar' ? 'سند توريد مرتجع مخزني' : 'Material Return') :
                         (lang === 'ar' ? 'مستند مالي' : 'Financial Document')}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-y-6 gap-x-8 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 relative z-10">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'اسم المستلم/المسلم' : 'Personnel'}</span>
                        <span className="text-sm font-black text-slate-900">{workers?.find(w => w.id === viewingVoucher.workerId)?.fullName || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'القسم / المسار' : 'Department'}</span>
                        <span className="text-sm font-black text-slate-700">
                          {departments?.find(d => d.id === viewingVoucher.currentStageId || d.id === workers?.find(w => w.id === viewingVoucher.workerId)?.departmentId)?.nameAr || '---'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'رقم السند' : 'Ref No.'}</span>
                        <span className="text-sm font-black text-emerald-900 tabular-nums tracking-wider">{viewingVoucher.voucherNumber}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'الدفعة' : 'Batch'}</span>
                        <span className="text-sm font-black text-slate-700 truncate max-w-[150px]">{order?.title || '---'}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تاريخ السند' : 'Date'}</span>
                        <span className="text-sm font-black text-slate-700 tabular-nums">{viewingVoucher.date}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'المشرف المسؤول' : 'Supervisor'}</span>
                        <span className="text-sm font-black text-slate-700">
                          {workers?.find(w => w.id === (viewingVoucher.supervisorId || workers?.find(work => work.id === viewingVoucher.workerId)?.supervisorId))?.fullName || (lang === 'ar' ? 'مشرف القسم المباشر' : 'Direct Supervisor')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 relative z-10 mb-12">
                    {viewingVoucher.type === 'production_receipt' ? (
                      <>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 mb-2 uppercase">{lang === 'ar' ? 'أولاً: مخرجات الإنتاج المنجزة' : 'I. FINISHED PRODUCTION OUTPUTS'}</h4>
                          <Table className="text-right border-2 border-emerald-900/10">
                            <TableHeader className="bg-emerald-900/5">
                              <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                                <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'نوع المعوز' : 'Item Type'}</TableHead>
                                <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'الكمية المستلمة' : 'Accepted Qty'}</TableHead>
                                <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'أجر القطعة' : 'Wage/Pcs'}</TableHead>
                                <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="bg-white/40">
                                <TableCell className="font-bold text-sm py-5 text-slate-800">{product?.nameAr || '---'}</TableCell>
                                <TableCell className="text-center font-black text-sm text-emerald-800 tabular-nums">{(viewingVoucher.qtyAccepted || 0).toLocaleString('en-US')} {lang === 'ar' ? 'قطعة' : 'Pcs'}</TableCell>
                                <TableCell className="text-center font-bold text-sm tabular-nums">{(viewingVoucher.wageRate || 0).toLocaleString('en-US')}</TableCell>
                                <TableCell className="text-center font-black text-sm text-emerald-900 tabular-nums">{(viewingVoucher.wageAmount || 0).toLocaleString('en-US')} <span className="text-[10px] opacity-60">{viewingVoucher.currency || 'YER'}</span></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : viewingVoucher.type === 'wage_payment' ? (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 mb-2 uppercase">{lang === 'ar' ? 'بيان الاستحقاق المالي المفرز' : 'ITEMIZED WAGE SETTLEMENT'}</h4>
                        <Table className="text-right border-2 border-emerald-900/10">
                          <TableHeader className="bg-emerald-900/5">
                            <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                              <TableHead className="text-right font-black text-[10px] py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'رقم سند الاستلام' : 'Receipt #'}</TableHead>
                              <TableHead className="text-right font-black text-[10px] py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                              <TableHead className="text-center font-black text-[10px] py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                              <TableHead className="text-center font-black text-[10px] py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'أجر القطعة' : 'Wage/Pcs'}</TableHead>
                              <TableHead className="text-center font-black text-[10px] py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {viewingVoucher.linkedReceipts?.map((receiptId: string, i: number) => {
                               const receipt = vouchers.find(v => v.id === receiptId);
                               return (
                                 <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                                   <TableCell className="font-bold text-xs tabular-nums py-4">{receipt?.voucherNumber || '---'}</TableCell>
                                   <TableCell className="font-bold text-xs py-4">{product?.nameAr || '---'}</TableCell>
                                   <TableCell className="text-center font-black text-xs tabular-nums py-4">{receipt?.qtyAccepted || 0}</TableCell>
                                   <TableCell className="text-center font-bold text-xs tabular-nums py-4">{(receipt?.wageRate || 0).toLocaleString('en-US')}</TableCell>
                                   <TableCell className="text-center font-black text-xs text-emerald-700 tabular-nums py-4">{(receipt?.wageAmount || 0).toLocaleString('en-US')}</TableCell>
                                 </TableRow>
                               );
                            })}
                            <TableRow className="bg-emerald-50/50">
                              <TableCell colSpan={4} className="text-left font-black text-[10px] text-emerald-900 px-6 py-5 uppercase">GRAND TOTAL / الإجمالي العام</TableCell>
                              <TableCell className="text-center font-black text-base text-emerald-800 tabular-nums px-4 py-5">
                                {(viewingVoucher.totalAmount || 0).toLocaleString('en-US')} <span className="text-[10px] opacity-60 uppercase">{viewingVoucher.currency || 'YER'}</span>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <Table className="text-right border-2 border-emerald-900/10">
                        <TableHeader className="bg-emerald-800/5">
                          <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                            <TableHead className="text-right font-black text-xs py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'المادة الخام' : 'Raw Material'}</TableHead>
                            <TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                            <TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">{lang === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(viewingVoucher.items || viewingVoucher.returnedItems)?.map((item: any, i: number) => (
                            <TableRow key={i} className="border-b border-slate-100 bg-white/40">
                              <TableCell className="font-bold text-sm py-4 text-slate-800">{item.nameAr}</TableCell>
                              <TableCell className="text-center font-black text-sm text-emerald-800 tabular-nums">{item.qty}</TableCell>
                              <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-4">{item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center relative z-10 mt-auto">
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'أمين المستودع' : 'Store Keeper'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'توقيع المستلم/المسلم' : 'Personnel Sign'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'اعتماد المدير / المشرف' : 'Auth. Signature'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Authorized Official</p>
                    </div>
                  </div>

                  <div className="mt-14 pt-4 text-center border-t border-slate-50 relative z-10 flex items-center justify-center gap-4">
                    <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">Generated by TIA Production System</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                    <span className="text-[8px] font-black text-slate-300 tabular-nums uppercase tracking-widest">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all">
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
                {lang === 'ar' ? 'تحميل السند كصورة' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => setViewingVoucher(null)} className="h-12 px-8 rounded-xl border border-slate-200 font-black text-slate-500">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white"><DialogHeader className="text-right"><DialogTitle className="text-xl font-black flex items-center gap-3"><Edit2 className="w-5 h-5 text-emerald-300" />{lang === 'ar' ? 'تحديث مواصفات الدفعة' : 'Update Specs'}</DialogTitle></DialogHeader></div>
          <form onSubmit={handleUpdateOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">عنوان الطلب المميز</Label><Input value={editFormData.title} onChange={(e) => setEditFormDate({...editFormData, title: e.target.value})} className="h-11 font-bold text-xs bg-slate-50" required /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">نوع المعوز المستهدف</Label><select value={editFormData.productId} onChange={(e) => setEditFormDate({...editFormData, productId: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" required><option value="">-- Select Product --</option>{products?.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">الكمية المستهدفة</Label><Input type="number" value={editFormData.targetQty} onChange={(e) => setEditFormDate({...editFormData, targetQty: Number(e.target.value)})} className="h-11 font-bold bg-slate-50 tabular-nums" required /></div><div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">الأولوية</Label><select value={editFormData.priority} onChange={(e) => setEditFormDate({...editFormData, priority: e.target.value})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase">ملاحظات إضافية</Label><Textarea value={editFormData.notes} onChange={(e) => setEditFormDate({...editFormData, notes: e.target.value})} className="min-h-[100px] text-xs font-medium bg-slate-50" /></div>
            <div className="flex gap-3 pt-4 border-t border-slate-100"><Button type="submit" disabled={isSubmitting} className="flex-1 h-12 premium-gradient text-white rounded-lg font-black">Commit Changes</Button><Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="px-6 h-12 font-black text-slate-400">Cancel</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LedgerRow({ label, value, icon, color = "text-slate-900" }: { label: string, value: string | number, icon: any, color?: string }) {
  const { dir } = useTranslation();
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
       <td className="px-6 py-4 w-72 border-l border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 justify-start">
             <div className="p-1.5 bg-white border border-slate-100 rounded text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">{icon}</div>
             <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">{label}</span>
          </div>
       </td>
       <td className={cn("px-6 py-4 text-xs font-black tabular-nums text-left", color)}>
         {value || '---'}
       </td>
    </tr>
  );
}

function LedgerTransactionRow({ voucher, worker, lang, onView }: { voucher: any, worker: any, lang: string, onView: (v: any) => void }) {
  const { dir } = useTranslation();
  
  const typeMap: any = {
    'material_issue': { labelAr: 'صرف مواد', icon: <FileInput className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    'production_receipt': { labelAr: 'استلام انتاج', icon: <FileOutput className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    'material_return': { labelAr: 'توريد مرتجع', icon: <RefreshCcw className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    'wage_payment': { labelAr: 'صرف أجور', icon: <HandCoins className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50 border-purple-100' }
  };
  
  const config = typeMap[voucher.type] || { labelAr: 'عملية أخرى', icon: <FileText className="w-3.5 h-3.5" />, color: 'text-slate-500 bg-slate-50 border-slate-200' };

  return (
    <TableRow className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
      <TableCell className={cn("px-6 py-3 font-bold text-slate-400 text-[10px] tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>
        {voucher.date}
      </TableCell>
      <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-[10px] tabular-nums tracking-wider", dir === 'rtl' ? "text-right" : "text-left")}>
        {voucher.voucherNumber}
      </TableCell>
      <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
        <div className={cn("inline-flex items-center gap-2 px-2 py-0.5 rounded text-[9px] font-black uppercase border", config.color)}>
          {config.icon}
          {lang === 'ar' ? config.labelAr : voucher.type}
        </div>
      </TableCell>
      <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
            {worker?.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          <span className="text-[11px] font-black text-slate-800 truncate max-w-[120px]">{worker?.fullName || '---'}</span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-3 text-center">
        <div className="flex flex-col items-center justify-center">
           <span className={cn("text-xs font-black tabular-nums", 
              voucher.type === 'material_issue' ? "text-amber-700" : 
              voucher.type === 'wage_payment' ? "text-purple-700" : 
              voucher.type === 'material_return' ? "text-emerald-700" :
              "text-blue-700"
           )}>
             {voucher.type === 'production_receipt' ? (voucher.qtyAccepted || 0).toLocaleString('en-US') : (voucher.totalAmount || 0).toLocaleString('en-US')}
           </span>
           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
             {voucher.type === 'production_receipt' ? 'Pcs' : (voucher.currency || 'YER')}
           </span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-3 text-center">
        <Button variant="ghost" size="icon" onClick={() => onView(voucher)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors rounded-lg">
          <Eye className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
