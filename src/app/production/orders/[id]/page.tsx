'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft, 
  Workflow, 
  History, 
  FileText, 
  FileOutput, 
  FileInput, 
  HandCoins, 
  ChevronRight, 
  Target, 
  Clock, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  ShoppingBag,
  Info,
  Loader2,
  Plus,
  ShieldCheck,
  Calendar,
  Zap,
  LayoutGrid,
  BarChart3,
  ClipboardList,
  Type,
  User,
  ArrowUpRight,
  Edit2,
  Activity,
  Layers,
  Save,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from '@/hooks/use-toast';

export default function OrderDetailsDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  // Tab State: 'info' | 'summary' | stageId
  const [activeTab, setActiveTab] = useState<string>('info');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data
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

  // Edit Form State
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

  // Calculations for Stats
  const finalStage = useMemo(() => departments?.[departments.length - 1], [departments]);
  const finalCompletedQty = useMemo(() => {
    if (!vouchers || !finalStage) return 0;
    return vouchers
      .filter(v => v.type === 'production_receipt' && v.currentStageId === finalStage.id && v.status !== 'deleted')
      .reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
  }, [vouchers, finalStage]);

  const totalProgress = useMemo(() => {
    if (!order?.targetQty) return 0;
    return Math.round((finalCompletedQty / order.targetQty) * 100);
  }, [finalCompletedQty, order]);

  const currentStageVouchers = useMemo(() => {
    if (!vouchers || activeTab === 'info' || activeTab === 'summary') return [];
    return vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      if (v.type === 'production_receipt') return v.currentStageId === activeTab;
      // For issues, check if the worker belongs to this department
      const worker = workers?.find(w => w.id === v.workerId);
      return worker?.departmentId === activeTab;
    });
  }, [vouchers, activeTab, workers]);

  const stageMetrics = useMemo(() => {
    const receipts = currentStageVouchers.filter(v => v.type === 'production_receipt');
    const issues = currentStageVouchers.filter(v => v.type === 'material_issue');
    const wages = receipts.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
    const qtyDone = receipts.reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
    const progress = order?.targetQty ? Math.round((qtyDone / order.targetQty) * 100) : 0;
    
    return { issuesCount: issues.length, receiptsQty: qtyDone, wagesTotal: wages, progress };
  }, [currentStageVouchers, order]);

  if (orderLoading || deptsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">جاري فتح السجل الفني...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-xl font-black">{lang === 'ar' ? 'الأمر غير موجود' : 'Order Not Found'}</h2>
        <Button variant="outline" onClick={() => router.back()}>العودة للأوامر</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden" dir={dir}>
      
      {/* 1. ERP MASTER HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'أوامر الإنتاج' : 'Work Orders'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600 tabular-nums">{order.orderNumber}</span>
              </div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">{order.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</p>
                   <p className="text-xs font-black text-slate-700 tabular-nums">{order.targetQty}</p>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الجاهز النهائي' : 'FINISHED'}</p>
                   <p className="text-xs font-black text-emerald-600 tabular-nums">{finalCompletedQty}</p>
                </div>
             </div>
             <Button onClick={handleOpenEdit} variant="outline" className="h-9 px-4 font-black gap-2 border-slate-200 text-slate-600 text-[11px] rounded-lg">
                <Edit2 className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'تعديل الأمر' : 'Edit Order'}
             </Button>
             <Button className="h-9 px-5 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 border-none text-[11px]">
                <Plus className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'عملية ميدانية' : 'New Transaction'}
             </Button>
          </div>
        </div>
      </div>

      {/* 2. STAGES NAVIGATION */}
      <div className="flex-none bg-slate-900 z-20 shadow-lg">
        <div className="container mx-auto px-4 flex items-center h-12 gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              "flex items-center gap-2 px-5 h-full transition-all whitespace-nowrap font-black text-[10px] uppercase tracking-wider relative",
              activeTab === 'info' ? "bg-emerald-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'بيانات الدفعة' : 'Batch Info'}
          </button>

          <div className="h-4 w-px bg-white/10" />

          {departments?.map((dept, idx) => (
            <button
              key={dept.id}
              onClick={() => setActiveTab(dept.id)}
              className={cn(
                "flex items-center gap-2 px-5 h-full transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-wider relative group",
                activeTab === dept.id 
                  ? "bg-emerald-600 text-white shadow-[inset_0_-3px_0_white]" 
                  : order.currentStageId === dept.id 
                    ? "text-emerald-400 bg-white/5"
                    : "text-white/40 hover:text-white/70"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded flex items-center justify-center text-[8px] font-black border",
                activeTab === dept.id ? "bg-emerald-500 border-white/20" : "bg-white/5 border-white/10"
              )}>
                {idx + 1}
              </span>
              <span>{dept.nameAr}</span>
              {order.currentStageId === dept.id && activeTab !== dept.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-2 right-2 animate-pulse" />
              )}
            </button>
          ))}

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "flex items-center gap-2 px-5 h-full transition-all whitespace-nowrap font-black text-[10px] uppercase tracking-wider relative",
              activeTab === 'summary' ? "bg-blue-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'تحليل الأداء' : 'Analytics'}
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC DATA LEDGER AREA */}
      <div className="flex-1 min-h-0 overflow-auto p-4 no-scrollbar">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-full">
          
          {/* VIEW: BATCH DATA (EXTENDED LEDGER) */}
          {activeTab === 'info' && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-300">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <ClipboardList className="w-4 h-4 text-emerald-600" />
                     {lang === 'ar' ? 'سجل المواصفات الفنية المعتمد' : 'MASTER BATCH LEDGER'}
                  </h3>
                  <Button onClick={handleOpenEdit} variant="outline" size="sm" className="h-8 text-[10px] font-black border-slate-200 rounded-md gap-2">
                     <Edit2 className="w-3 h-3" /> {lang === 'ar' ? 'تعديل البيانات' : 'Update Specs'}
                  </Button>
               </div>
               <div className="flex-1 overflow-auto p-0">
                  <table className="w-full text-right border-separate border-spacing-0">
                     <tbody className="divide-y divide-slate-100">
                        <LedgerRow label={lang === 'ar' ? 'رقم السجل الموحد' : 'REFERENCE'} value={order.orderNumber} icon={<Hash />} />
                        <LedgerRow label={lang === 'ar' ? 'تاريخ البدء التشغيلي' : 'LAUNCH DATE'} value={order.startDate} icon={<Calendar />} />
                        <LedgerRow label={lang === 'ar' ? 'عنوان الدفعة' : 'BATCH TITLE'} value={order.title} icon={<Type />} />
                        <LedgerRow label={lang === 'ar' ? 'المنتج المستهدف' : 'PRODUCT'} value={product?.nameAr} icon={<ShoppingBag />} />
                        <LedgerRow label={lang === 'ar' ? 'القسم المسؤول حالياً' : 'WORK CENTER'} value={departments?.find(d => d.id === order.currentStageId)?.nameAr} icon={<Building2Icon />} />
                        <LedgerRow label={lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'} value={`${order.targetQty} قطعة`} icon={<Target />} color="text-slate-900" />
                        <LedgerRow label={lang === 'ar' ? 'الجاهز النهائي الموثق' : 'FINISHED QTY'} value={`${finalCompletedQty} قطعة`} icon={<CheckCircle2 />} color="text-emerald-700" />
                        <LedgerRow label={lang === 'ar' ? 'قيد العمل الإجمالي' : 'WIP QTY'} value={`${order.targetQty - finalCompletedQty} قطعة`} icon={<Package />} color="text-blue-600" />
                        <LedgerRow label={lang === 'ar' ? 'نسبة الإنجاز الكلية' : 'PROGRESS %'} value={`${totalProgress}%`} icon={<Activity />} color="text-emerald-600" />
                        <LedgerRow label={lang === 'ar' ? 'الأولوية التنظيمية' : 'PRIORITY'} value={order.priority} icon={<ShieldCheck />} />
                        <LedgerRow label={lang === 'ar' ? 'الحالة الحالية' : 'STATUS'} value={order.status} icon={<Tag />} />
                        {order.notes && (
                           <tr className="bg-slate-50/50">
                              <td className="px-6 py-5 w-72 font-black text-[10px] text-slate-400 uppercase border-l border-slate-100">{lang === 'ar' ? 'تعليمات وملاحظات' : 'INSTRUCTIONS'}</td>
                              <td className="px-6 py-5 text-xs font-bold text-slate-600 leading-relaxed italic">{order.notes}</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* VIEW: STAGE LEDGER (TRANSACTIONS) */}
          {activeTab !== 'info' && activeTab !== 'summary' && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-hidden">
               <div className="p-2 bg-emerald-900 text-white flex items-center justify-around gap-2 shadow-inner">
                  <MetricItem label={lang === 'ar' ? 'سندات صرف' : 'ISSUES'} value={stageMetrics.issuesCount} />
                  <div className="w-px h-6 bg-white/10" />
                  <MetricItem label={lang === 'ar' ? 'مخرجات المرحلة' : 'OUTPUT'} value={stageMetrics.receiptsQty} unit="Pcs" />
                  <div className="w-px h-6 bg-white/10" />
                  <MetricItem label={lang === 'ar' ? 'أجور مقيدة' : 'WAGES'} value={stageMetrics.wagesTotal.toLocaleString('en-US')} unit="YER" />
                  <div className="w-px h-6 bg-white/10" />
                  <div className="flex items-center gap-3">
                     <span className="text-[8px] font-black text-emerald-300 uppercase">{lang === 'ar' ? 'إنجاز المرحلة' : 'PROGRESS'}</span>
                     <span className="text-sm font-black tabular-nums">{stageMetrics.progress}%</span>
                  </div>
               </div>

               <div className="flex-1 overflow-auto relative">
                  <Table className="text-right border-separate border-spacing-0">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'نوع العملية' : 'TYPE'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'المسؤول / العامل' : 'PERSONNEL'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'التفاصيل' : 'REMARKS'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'الأثر' : 'IMPACT'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStageVouchers.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-24 text-center text-slate-300 font-bold">
                          <Zap className="w-10 h-10 mx-auto mb-3 opacity-10" />
                          {lang === 'ar' ? 'لا توجد حركة مسجلة في هذا القسم' : 'No transactions in this stage'}
                        </TableCell></TableRow>
                      ) : currentStageVouchers.map((v) => (
                        <LedgerTransactionRow key={v.id} voucher={v} worker={workers?.find(w => w.id === v.workerId)} lang={lang} />
                      ))}
                    </TableBody>
                  </Table>
               </div>
               
               <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  {(() => {
                    const supervisor = workers?.find(w => w.departmentId === activeTab && w.isSupervisor && w.active);
                    return (
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="w-4 h-4 text-emerald-600" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {lang === 'ar' ? 'المشرف المسؤول:' : 'STAGE LEAD:'} 
                           <span className="text-slate-900 ms-2">{supervisor?.fullName || (lang === 'ar' ? 'غير محدد' : 'No lead')}</span>
                         </span>
                      </div>
                    );
                  })()}
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-emerald-700 hover:bg-emerald-50 rounded-md">
                     {lang === 'ar' ? 'تقرير التكاليف التفصيلي للمرحلة' : 'View Stage Cost Analysis'}
                  </Button>
               </div>
            </div>
          )}

          {/* VIEW: PERFORMANCE ANALYTICS */}
          {activeTab === 'summary' && (
            <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300">
               <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <BarChart3 className="w-4 h-4 text-emerald-400" />
                     {lang === 'ar' ? 'التحليل الإحصائي لخطوط الإنتاج' : 'MANUFACTURING PERFORMANCE ANALYTICS'}
                  </h3>
               </div>
               <div className="flex-1 overflow-auto">
                  <Table className="text-right border-separate border-spacing-0">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'المرحلة / القسم' : 'WORK CENTER'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'المنجز (قطعة)' : 'COMPLETED'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'تكلفة الأجور' : 'WAGE COST'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'الإنجاز' : 'PROGRESS'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map(d => {
                        const stageReceipts = vouchers.filter(v => v.currentStageId === d.id && v.type === 'production_receipt' && v.status !== 'deleted');
                        const done = stageReceipts.reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
                        const cost = stageReceipts.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
                        const p = Math.round((done / (order.targetQty || 1)) * 100);
                        return (
                          <TableRow key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                             <TableCell className="px-6 py-4 font-black text-slate-900 text-xs">{d.nameAr}</TableCell>
                             <TableCell className="px-6 py-4 text-center font-bold text-slate-700 tabular-nums">{done.toLocaleString('en-US')}</TableCell>
                             <TableCell className="px-6 py-4 text-center font-black text-emerald-700 tabular-nums">{cost.toLocaleString('en-US')} YER</TableCell>
                             <TableCell className="px-6 py-4 text-center">
                                <div className="flex items-center gap-3 justify-center">
                                   <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-400 tabular-nums">{p}%</span>
                                </div>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-slate-900 text-white font-black">
                        <TableCell className="px-6 py-5 text-sm uppercase">{lang === 'ar' ? 'إجمالي التكاليف (المواد والأجور)' : 'TOTAL ESTIMATED COST'}</TableCell>
                        <TableCell className="px-6 py-5 text-center text-emerald-400 tabular-nums text-lg">
                           {finalCompletedQty.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="px-6 py-5 text-center text-emerald-400 tabular-nums text-lg" colSpan={2}>
                           {vouchers?.filter(v => v.status !== 'deleted').reduce((sum, v) => sum + (v.wageAmount || 0) + (v.totalAmount || 0), 0).toLocaleString('en-US')}
                           <span className="text-[10px] ms-2 uppercase">YER</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* EDIT ORDER DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Edit2 className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'تحديث مواصفات الدفعة' : 'Update Batch Specs'}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Refining manufacturing targets and priorities
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleUpdateOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'عنوان الطلب المميز' : 'BATCH TITLE'}</Label>
              <Input value={editFormData.title} onChange={(e) => setEditFormDate({...editFormData, title: e.target.value})} className="h-11 font-bold text-xs bg-slate-50" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'نوع المعوز المستهدف' : 'PRODUCT TYPE'}</Label>
              <select 
                value={editFormData.productId} 
                onChange={(e) => setEditFormDate({...editFormData, productId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر نوع المعوز --' : '-- Select Product --'}</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input type="number" value={editFormData.targetQty} onChange={(e) => setEditFormDate({...editFormData, targetQty: Number(e.target.value)})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select value={editFormData.priority} onChange={(e) => setEditFormDate({...editFormData, priority: e.target.value})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
                  <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                  <option value="normal">{lang === 'ar' ? 'عادية' : 'Normal'}</option>
                  <option value="high">{lang === 'ar' ? 'عاجلة' : 'High'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات إضافية' : 'ADDITIONAL NOTES'}</Label>
              <Textarea value={editFormData.notes} onChange={(e) => setEditFormDate({...editFormData, notes: e.target.value})} className="min-h-[100px] text-xs font-medium bg-slate-50" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 premium-gradient text-white rounded-lg font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'حفظ التعديلات' : 'Commit Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="px-6 h-12 font-black text-slate-400 rounded-lg">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FOOTER */}
      <div className="flex-none p-2 bg-slate-950 text-white/30 flex items-center justify-center gap-4">
        <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500"><History className="w-3 h-3" /></div>
        <p className="text-[9px] font-bold tracking-widest uppercase">
          {lang === 'ar' 
            ? 'نظام السجلات الموحد: كافة البيانات هنا مرآة للسندات المالية والمخزنية المصدقة.' 
            : 'Unified Ledger System: All data mirrors certified fiscal and inventory vouchers.'}
        </p>
      </div>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function LedgerRow({ label, value, icon, color = "text-slate-900" }: { label: string, value: string | number, icon: any, color?: string }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
       <td className="px-6 py-4 w-72 font-black text-[10px] text-slate-400 uppercase border-l border-slate-100 flex items-center gap-3">
          <div className="p-1.5 bg-slate-100 rounded text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">{icon}</div>
          {label}
       </td>
       <td className={cn("px-6 py-4 text-xs font-black tabular-nums", color)}>{value || '---'}</td>
    </tr>
  );
}

function LedgerTransactionRow({ voucher, worker, lang }: { voucher: any, worker: any, lang: string }) {
  const typeMap: any = {
    'material_issue': { labelAr: 'صرف مواد', icon: <FileInput className="w-3 h-3" />, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    'production_receipt': { labelAr: 'استلام مخرجات', icon: <FileOutput className="w-3 h-3" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    'wage_payment': { labelAr: 'صرف أجر', icon: <HandCoins className="w-3 h-3" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  };
  const config = typeMap[voucher.type] || { labelAr: 'أخرى', icon: <FileText />, color: 'text-slate-500 bg-slate-50 border-slate-100' };

  return (
    <TableRow className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
      <TableCell className="px-6 py-3 font-bold text-slate-400 text-[10px] tabular-nums">{voucher.date}</TableCell>
      <TableCell className="px-6 py-3">
        <div className={cn("inline-flex items-center gap-2 px-2 py-0.5 rounded text-[9px] font-black uppercase border", config.color)}>
           {config.icon}
           {lang === 'ar' ? config.labelAr : voucher.type.replace('_', ' ')}
        </div>
      </TableCell>
      <TableCell className="px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[9px] font-black uppercase overflow-hidden">
             {worker?.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : worker?.fullName?.charAt(0)}
          </div>
          <div className="flex flex-col">
             <span className="text-[11px] font-black text-slate-700">{worker?.fullName || 'System'}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 py-3 text-[11px] font-bold text-slate-500 max-w-[300px] truncate">
        {voucher.notes || (voucher.items ? `${voucher.items.length} مواد مصروفة` : '---')}
      </TableCell>
      <TableCell className="px-6 py-3 text-center">
        <div className="flex flex-col items-center">
           <span className="text-xs font-black text-slate-900 tabular-nums">
              {voucher.type === 'production_receipt' ? (voucher.qtyAccepted || 0).toLocaleString('en-US') : (voucher.totalAmount || 0).toLocaleString('en-US')}
           </span>
           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              {voucher.type === 'production_receipt' ? (lang === 'ar' ? 'قطعة' : 'Pcs') : voucher.currency}
           </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MetricItem({ label, value, unit }: { label: string, value: any, unit?: string }) {
  return (
    <div className="flex items-center gap-3">
       <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">{label}</span>
       <span className="text-xs font-black tabular-nums">{value} {unit && <span className="text-[8px] opacity-40 uppercase ms-1">{unit}</span>}</span>
    </div>
  );
}

function Building2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M6 22V4c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v18" />
      <path d="M6 18H4c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1h2" />
      <path d="M10 8h4" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
    </svg>
  )
}
