
'use client';

import React, { useMemo, useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function OrderDetailsDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Fetch Data
  const orderRef = useMemo(() => !db ? null : doc(db, 'productionOrders', id as string), [db, id]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('orderId', '==', id), orderBy('date', 'desc')), [db, id]);
  const deptsQuery = useMemo(() => !db ? null : query(collection(db, 'departments'), where('status', '!=', 'deleted')), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);
  const { data: departments, loading: deptsLoading } = useCollection<any>(deptsQuery);
  const { data: workers } = useCollection<any>(workersQuery);
  const { data: products } = useCollection<any>(productsQuery);

  const product = useMemo(() => products?.find(p => p.id === order?.productId), [products, order]);

  // Initial stage setup
  useMemo(() => {
    if (departments?.length && !activeStageId) {
      setActiveStageId(order?.currentStageId || departments[0].id);
    }
  }, [departments, order, activeStageId]);

  const currentStageVouchers = useMemo(() => {
    if (!vouchers || !activeStageId) return [];
    return vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      const worker = workers?.find(w => w.id === v.workerId);
      // Logic: For receipts, we have stageId. For issues/payments, we infer from worker's dept or the current filter
      if (v.type === 'production_receipt') return v.currentStageId === activeStageId;
      return worker?.departmentId === activeStageId;
    });
  }, [vouchers, activeStageId, workers]);

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
      
      {/* PROFESSIONAL ORDER HEADER */}
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
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black">{product?.nameAr}</Badge>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{order.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{lang === 'ar' ? 'المستهدف الكلي' : 'TOTAL TARGET'}</p>
              <p className="text-lg font-black text-slate-700 tabular-nums">{order.targetQty} <span className="text-[10px] opacity-40 uppercase">{lang === 'ar' ? 'قطعة' : 'Pcs'}</span></p>
            </div>
            <div className="h-10 w-px bg-slate-100 mx-2" />
            <Button className="h-11 px-6 premium-gradient hover:opacity-90 text-white rounded-xl shadow-lg shadow-emerald-900/10 font-black gap-2 border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'عملية جديدة' : 'New Transaction'}
            </Button>
          </div>
        </div>
      </div>

      {/* STAGE NAVIGATION BAR */}
      <div className="flex-none bg-white border-b border-slate-200 overflow-x-auto no-scrollbar shadow-inner">
        <div className="container mx-auto px-4 flex items-center h-16 gap-2">
          {departments?.map((dept, idx) => {
            const isActive = activeStageId === dept.id;
            const isCompleted = order.currentStageId !== dept.id; // Simple logic for visual indicator
            
            return (
              <button
                key={dept.id}
                onClick={() => setActiveStageId(dept.id)}
                className={cn(
                  "flex items-center gap-3 px-6 h-10 rounded-full transition-all whitespace-nowrap relative group",
                  isActive ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-white hover:text-emerald-600 border border-slate-100"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                  isActive ? "bg-emerald-500 border-white/20" : "bg-white border-slate-200"
                )}>
                  {idx + 1}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wide">{dept.nameAr}</span>
                {isActive && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT SIDE: STAGE SUMMARY & LOG */}
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-8 no-scrollbar">
          
          {/* STAGE METRICS CARD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FileInput className="w-5 h-5" /></div>
                   <Badge variant="outline" className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">Issues</Badge>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي المنصرف' : 'TOTAL ISSUED'}</p>
                   <h4 className="text-2xl font-black text-slate-900 tabular-nums">
                     {currentStageVouchers.filter(v => v.type === 'material_issue').reduce((sum, v) => sum + (v.items?.length || 0), 0)}
                   </h4>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileOutput className="w-5 h-5" /></div>
                   <Badge variant="outline" className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">Production</Badge>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي المنجز' : 'TOTAL RECEIVED'}</p>
                   <h4 className="text-2xl font-black text-slate-900 tabular-nums">
                     {currentStageVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.qtyAccepted || 0), 0)}
                   </h4>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><HandCoins className="w-5 h-5" /></div>
                   <Badge variant="outline" className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">Wages</Badge>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'أجور المرحلة' : 'TOTAL WAGES'}</p>
                   <h4 className="text-2xl font-black text-slate-900 tabular-nums">
                     {currentStageVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.wageAmount || 0), 0).toLocaleString('en-US')}
                     <span className="text-[10px] ms-1 uppercase opacity-30">YER</span>
                   </h4>
                </div>
             </div>

             <div className="bg-emerald-900 p-6 rounded-[2rem] shadow-xl text-white space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Activity className="w-20 h-20" /></div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">{lang === 'ar' ? 'نسبة إنجاز المرحلة' : 'STAGE PROGRESS'}</p>
                   <div className="flex items-baseline gap-2 mt-1">
                      <h4 className="text-4xl font-black tabular-nums">
                        {Math.round((currentStageVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.qtyAccepted || 0), 0) / order.targetQty) * 100) || 0}%
                      </h4>
                   </div>
                   <Progress value={Math.round((currentStageVouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.qtyAccepted || 0), 0) / order.targetQty) * 100) || 0} className="h-2 mt-4 bg-emerald-800" />
                </div>
             </div>
          </div>

          {/* UNIFIED STAGE LOG */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <History className="w-6 h-6 text-emerald-600" />
              {lang === 'ar' ? 'سجل العمليات في هذه المرحلة' : 'Unified Stage Log'}
            </h3>

            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-right border-separate border-spacing-0">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</th>
                      <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'العملية' : 'TYPE'}</th>
                      <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'الموظف' : 'PERSONNEL'}</th>
                      <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'التفاصيل' : 'DETAILS'}</th>
                      <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase text-center">{lang === 'ar' ? 'المبلغ/الكمية' : 'IMPACT'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStageVouchers.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold">{lang === 'ar' ? 'لا توجد سندات مسجلة في هذه المرحلة بعد' : 'No records found for this stage'}</td></tr>
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
        </div>

        {/* RIGHT SIDE: CONTEXTUAL SIDEBAR */}
        <div className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col p-6 space-y-8 shadow-2xl z-10 overflow-auto no-scrollbar">
           
           <div className="space-y-6">
              <h3 className="text-lg font-black flex items-center gap-3">
                 <Info className="w-5 h-5 text-emerald-600" />
                 {lang === 'ar' ? 'معلومات الدفعة' : 'Batch Info'}
              </h3>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                 <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-2xl border-4 border-white shadow-md">
                       <AvatarImage src={product?.image} className="object-cover" />
                       <AvatarFallback className="bg-emerald-50 text-emerald-600"><ShoppingBag /></AvatarFallback>
                    </Avatar>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'المنتج' : 'PRODUCT'}</p>
                       <h5 className="font-black text-slate-900 leading-none">{product?.nameAr}</h5>
                       <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase">{product?.category}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</p>
                       <Badge className={cn("mt-1 text-[10px] font-black", order.priority === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700')}>
                          {order.priority}
                       </Badge>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'تاريخ البدء' : 'STARTED'}</p>
                       <p className="text-xs font-black text-slate-700 mt-1 tabular-nums">{order.startDate}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-600" />
                 {lang === 'ar' ? 'المسؤولية الإدارية' : 'ADMIN ACCOUNTABILITY'}
              </h3>
              {departments?.map((dept, i) => {
                const sup = workers?.find(w => w.departmentId === dept.id && w.isSupervisor && w.active);
                return (
                  <div key={dept.id} className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                    order.currentStageId === dept.id ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 opacity-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", order.currentStageId === dept.id ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                      <div>
                        <p className="text-[10px] font-black text-slate-800 leading-none">{dept.nameAr}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{sup?.fullName || 'No Lead'}</p>
                      </div>
                    </div>
                    {order.currentStageId === dept.id && <Badge className="bg-emerald-600 text-[8px] font-black">ACTIVE</Badge>}
                  </div>
                )
              })}
           </div>

           <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="p-4 bg-slate-900 rounded-[2rem] text-white space-y-3 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="w-12 h-12" /></div>
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي الجاهز للبيع' : 'READY TO SELL'}</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums">
                       {vouchers?.filter(v => {
                          const finalStage = departments?.[departments.length - 1];
                          return v.type === 'production_receipt' && v.currentStageId === finalStage?.id && v.status !== 'deleted';
                       }).reduce((sum, v) => sum + (v.qtyAccepted || 0), 0)}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">/ {order.targetQty}</span>
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
    'material_issue': { labelAr: 'صرف مواد', labelEn: 'Issue', icon: <FileInput className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50' },
    'production_receipt': { labelAr: 'استلام إنتاج', labelEn: 'Receipt', icon: <FileOutput className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
    'wage_payment': { labelAr: 'صرف أجور', labelEn: 'Wage Pay', icon: <HandCoins className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50' }
  };

  const config = typeMap[voucher.type] || { labelAr: 'أخرى', icon: <FileText />, color: 'text-slate-500' };

  return (
    <tr className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
      <td className="px-6 py-4 font-bold text-slate-400 text-[11px] tabular-nums">{voucher.date}</td>
      <td className="px-6 py-4">
        <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase", config.color)}>
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
          <span className="text-xs font-black text-slate-700">{worker?.fullName || 'System'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-bold text-slate-500 max-w-[200px] truncate">
        {voucher.notes || (voucher.items ? `${voucher.items.length} ${lang === 'ar' ? 'أصناف' : 'Items'}` : '---')}
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
