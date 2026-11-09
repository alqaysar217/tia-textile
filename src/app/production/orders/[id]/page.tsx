'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft, 
  Workflow, 
  Layers, 
  History, 
  FileText, 
  FileOutput, 
  FileInput, 
  HandCoins, 
  ChevronRight, 
  Activity, 
  Target, 
  Clock, 
  User, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Hash,
  ShoppingBag,
  Info,
  Loader2,
  Plus,
  ShieldCheck,
  Calendar,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function OrderDetailsDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  const [activeStageId, setActiveStageId] = useState<string | null>(null);

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

  // Client-side sorting for performance and avoiding index errors
  const vouchers = useMemo(() => {
    if (!rawVouchers) return [];
    return [...rawVouchers].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [rawVouchers]);

  const product = useMemo(() => products?.find(p => p.id === order?.productId), [products, order]);

  // Set default active stage based on current order status or first department
  useEffect(() => {
    if (departments?.length && !activeStageId) {
      setActiveStageId(order?.currentStageId || departments[0].id);
    }
  }, [departments, order, activeStageId]);

  const currentStageVouchers = useMemo(() => {
    if (!vouchers || !activeStageId) return [];
    return vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      const worker = workers?.find(w => w.id === v.workerId);
      // Logic: If it's a receipt, check currentStageId. If issue, check worker's department
      if (v.type === 'production_receipt') return v.currentStageId === activeStageId;
      return worker?.departmentId === activeStageId;
    });
  }, [vouchers, activeStageId, workers]);

  const currentStageMetrics = useMemo(() => {
    const receipts = currentStageVouchers.filter(v => v.type === 'production_receipt');
    const issues = currentStageVouchers.filter(v => v.type === 'material_issue');
    const wages = receipts.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
    const qtyDone = receipts.reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
    const progress = order?.targetQty ? Math.round((qtyDone / order.targetQty) * 100) : 0;
    
    return {
      issuesCount: issues.length,
      receiptsQty: qtyDone,
      wagesTotal: wages,
      progress
    };
  }, [currentStageVouchers, order]);

  if (orderLoading || deptsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري سحب بيانات الدفعة...</p>
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
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* 1. BATCH INFORMATION HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-slate-100 h-10 w-10">
              {dir === 'rtl' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
            <div className="h-10 w-px bg-slate-100" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Badge className="bg-slate-900 text-white font-black text-[10px] tabular-nums uppercase">{order.orderNumber}</Badge>
                <Badge className={cn("text-[10px] font-black uppercase", order.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
                  {order.priority}
                </Badge>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{order.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المنتج' : 'PRODUCT'}</span>
                  <span className="text-xs font-black text-slate-700">{product?.nameAr}</span>
               </div>
               <div className="w-px h-6 bg-slate-200" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'تاريخ البدء' : 'STARTED'}</span>
                  <span className="text-xs font-black text-slate-700 tabular-nums">{order.startDate}</span>
               </div>
               <div className="w-px h-6 bg-slate-200" />
               <div className="flex flex-col text-right">
                  <span className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</span>
                  <span className="text-xs font-black text-emerald-600 tabular-nums">{order.targetQty} <span className="text-[8px] opacity-60 uppercase">Pcs</span></span>
               </div>
            </div>
            <Button className="h-11 px-6 premium-gradient hover:opacity-90 text-white rounded-xl shadow-lg shadow-emerald-900/10 font-black gap-2 border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'عملية جديدة' : 'New Transaction'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PRODUCTION STAGES STEPPER */}
      <div className="flex-none bg-white border-b border-slate-200 overflow-x-auto no-scrollbar shadow-inner">
        <div className="container mx-auto px-4 flex items-center h-16 gap-3">
          {departments?.map((dept, idx) => {
            const isActive = activeStageId === dept.id;
            const isOrderStage = order.currentStageId === dept.id;
            
            return (
              <button
                key={dept.id}
                onClick={() => setActiveStageId(dept.id)}
                className={cn(
                  "flex items-center gap-3 px-6 h-10 rounded-full transition-all whitespace-nowrap relative group border",
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg border-emerald-700" 
                    : isOrderStage 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-400 hover:bg-white border-slate-100"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                  isActive ? "bg-emerald-500 border-white/20" : "bg-white border-slate-200"
                )}>
                  {idx + 1}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wide">{dept.nameAr}</span>
                {isOrderStage && !isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-0 right-0 animate-pulse border-2 border-white" />}
                {isActive && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STAGE SUMMARY BAR */}
      <div className="flex-none bg-slate-50/50 border-b border-slate-200 py-4">
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FileInput className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'سندات صرف' : 'ISSUES'}</p>
                     <h4 className="text-lg font-black text-slate-900 tabular-nums">{currentStageMetrics.issuesCount}</h4>
                  </div>
               </div>
               
               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileOutput className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'مخرجات المرحلة' : 'OUTPUT'}</p>
                     <h4 className="text-lg font-black text-slate-900 tabular-nums">{currentStageMetrics.receiptsQty} <span className="text-[8px] opacity-40">Pcs</span></h4>
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><HandCoins className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'أجور مقيدة' : 'WAGES'}</p>
                     <h4 className="text-lg font-black text-slate-900 tabular-nums">{currentStageMetrics.wagesTotal.toLocaleString('en-US')} <span className="text-[8px] opacity-40">YER</span></h4>
                  </div>
               </div>

               <div className="bg-slate-900 p-4 rounded-2xl shadow-md text-white flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity className="w-12 h-12" /></div>
                  <div className="relative z-10">
                     <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{lang === 'ar' ? 'إنجاز المرحلة' : 'PROGRESS'}</p>
                     <h4 className="text-2xl font-black tabular-nums">{currentStageMetrics.progress}%</h4>
                  </div>
                  <div className="relative z-10 w-16 h-16">
                     <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-700" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-emerald-500" strokeDasharray={`${currentStageMetrics.progress}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                     </svg>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. MAIN WORK AREA (LOG & ACCOUNTABILITY) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        
        {/* LOG VIEW */}
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 no-scrollbar">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
               <History className="w-5 h-5 text-emerald-600" />
               {lang === 'ar' ? 'سجل العمليات الكامل في هذه المرحلة' : 'Full Stage Log'}
             </h3>
             <Button variant="ghost" size="sm" className="text-[10px] font-black text-slate-400 gap-2">
                <FileText className="w-3 h-3" />
                {lang === 'ar' ? 'تصدير كشف المرحلة' : 'Export Stage Report'}
             </Button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
             <table className="w-full text-right border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</th>
                    <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'نوع العملية' : 'TYPE'}</th>
                    <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'الموظف / العامل' : 'PERSONNEL'}</th>
                    <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'ملاحظات وتفاصيل' : 'REMARKS'}</th>
                    <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase text-center">{lang === 'ar' ? 'الكمية/القيمة' : 'IMPACT'}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStageVouchers.length === 0 ? (
                    <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-bold">
                       <Zap className="w-12 h-12 mx-auto mb-4 opacity-10" />
                       {lang === 'ar' ? 'لم يتم توثيق أي سندات في هذه المرحلة بعد' : 'No activity logged for this stage'}
                    </td></tr>
                  ) : currentStageVouchers.map((v) => {
                    const worker = workers?.find(w => w.id === v.workerId);
                    return (
                      <TableRowItem key={v.id} voucher={v} worker={worker} lang={lang} />
                    );
                  })}
                </tbody>
             </table>
          </div>
        </div>

        {/* ACCOUNTABILITY SIDEBAR */}
        <div className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col p-6 space-y-8 shadow-2xl z-10 overflow-auto no-scrollbar">
           
           <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" />
                 {lang === 'ar' ? 'المسؤولية الإدارية' : 'ADMIN CONTROL'}
              </h3>
              <div className="space-y-3">
                 {departments?.map((dept) => {
                   const isActive = order.currentStageId === dept.id;
                   const supervisor = workers?.find(w => w.departmentId === dept.id && w.isSupervisor && w.active);
                   return (
                     <div key={dept.id} className={cn(
                       "p-3 rounded-2xl border transition-all relative group",
                       isActive ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-100 opacity-60"
                     )}>
                       <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black text-slate-800">{dept.nameAr}</p>
                          {isActive && <Badge className="bg-emerald-600 text-[8px] font-black px-1.5 py-0">ACTIVE</Badge>}
                       </div>
                       <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 rounded-lg border border-white shadow-sm">
                             <AvatarImage src={supervisor?.photoUrl} />
                             <AvatarFallback className="text-[8px] bg-slate-100 text-slate-400">{supervisor?.fullName?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                             <p className="text-[9px] font-black text-slate-700 leading-none">{supervisor?.fullName || (lang === 'ar' ? 'غير محدد' : 'Not assigned')}</p>
                             <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">{lang === 'ar' ? 'مشرف القسم' : 'STAGE LEAD'}</p>
                          </div>
                       </div>
                     </div>
                   )
                 })}
              </div>
           </div>

           <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="p-5 bg-slate-900 rounded-[2rem] text-white space-y-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:rotate-12 transition-transform"><Target className="w-16 h-16" /></div>
                 <div className="relative z-10">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{lang === 'ar' ? 'خلاصة الإنتاج النهائي' : 'FINAL OUTPUT SUMMARY'}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                       <span className="text-4xl font-black tabular-nums">
                          {vouchers?.filter(v => {
                             const finalStage = departments?.[departments.length - 1];
                             return v.type === 'production_receipt' && v.currentStageId === finalStage?.id && v.status !== 'deleted';
                          }).reduce((sum, v) => sum + (v.qtyAccepted || 0), 0)}
                       </span>
                       <span className="text-xs font-black text-slate-400">/ {order.targetQty} Pcs</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                       <div 
                         className="h-full bg-emerald-500 rounded-full" 
                         style={{ width: `${Math.round((vouchers?.filter(v => {
                            const finalStage = departments?.[departments.length - 1];
                            return v.type === 'production_receipt' && v.currentStageId === finalStage?.id && v.status !== 'deleted';
                         }).reduce((sum, v) => sum + (v.qtyAccepted || 0), 0) / (order.targetQty || 1)) * 100)}%` }}
                       />
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

function TableRowItem({ voucher, worker, lang }: { voucher: any, worker: any, lang: string }) {
  const typeMap: any = {
    'material_issue': { labelAr: 'صرف مواد', labelEn: 'Issue', icon: <FileInput className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    'production_receipt': { labelAr: 'استلام مخرجات', labelEn: 'Receipt', icon: <FileOutput className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    'wage_payment': { labelAr: 'صرف أجر', labelEn: 'Wage Pay', icon: <HandCoins className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  };

  const config = typeMap[voucher.type] || { labelAr: 'أخرى', icon: <FileText />, color: 'text-slate-500 bg-slate-50 border-slate-100' };

  return (
    <tr className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
      <td className="px-6 py-4 font-bold text-slate-400 text-[11px] tabular-nums">{voucher.date}</td>
      <td className="px-6 py-4">
        <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border", config.color)}>
           {config.icon}
           {lang === 'ar' ? config.labelAr : config.labelEn}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg border-2 border-white shadow-sm">
            <AvatarImage src={worker?.photoUrl} className="object-cover" />
            <AvatarFallback className="bg-slate-100 text-[10px] font-black">{worker?.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
             <span className="text-xs font-black text-slate-700">{worker?.fullName || 'System'}</span>
             <span className="text-[8px] font-bold text-slate-400 tabular-nums uppercase">{worker?.workerId}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-bold text-slate-500 max-w-[250px] truncate">
        {voucher.notes || (voucher.items ? `${voucher.items.length} ${lang === 'ar' ? 'مواد مصروفة' : 'Items Issued'}` : '---')}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex flex-col items-center">
           <span className="text-sm font-black text-slate-900 tabular-nums">
              {voucher.type === 'production_receipt' ? (voucher.qtyAccepted || 0).toLocaleString('en-US') : (voucher.totalAmount || 0).toLocaleString('en-US')}
           </span>
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
              {voucher.type === 'production_receipt' ? (lang === 'ar' ? 'قطعة' : 'Pcs') : voucher.currency}
           </span>
        </div>
      </td>
    </tr>
  );
}
