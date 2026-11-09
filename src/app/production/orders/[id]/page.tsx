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
  Loader2,
  Plus,
  ShieldCheck,
  Calendar,
  Zap,
  LayoutGrid,
  BarChart3,
  ClipboardList,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OrderDetailsDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  // Navigation State: 'info' | 'summary' | stageId
  const [activeTab, setActiveTab] = useState<string>('info');

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

  const vouchers = useMemo(() => {
    if (!rawVouchers) return [];
    return [...rawVouchers].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [rawVouchers]);

  const product = useMemo(() => products?.find(p => p.id === order?.productId), [products, order]);

  // Stage Metrics calculation
  const currentStageVouchers = useMemo(() => {
    if (!vouchers || activeTab === 'info' || activeTab === 'summary') return [];
    return vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      if (v.type === 'production_receipt') return v.currentStageId === activeTab;
      // For issues and others, check if the worker belongs to this department
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
      
      {/* 1. UNIFIED NAVIGATION BAR */}
      <div className="flex-none bg-white border-b border-slate-200 shadow-sm z-30">
        <div className="container mx-auto px-4 flex items-center h-20 gap-4 overflow-x-auto no-scrollbar">
          
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-slate-100 h-10 w-10 shrink-0">
            {dir === 'rtl' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </Button>

          <div className="h-10 w-px bg-slate-200 shrink-0" />

          {/* Tab 1: INFORMATION */}
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              "flex items-center gap-2 px-6 h-12 rounded-2xl transition-all whitespace-nowrap border shrink-0 font-black text-xs uppercase tracking-wide",
              activeTab === 'info' ? "bg-slate-900 text-white shadow-lg border-slate-950" : "bg-slate-50 text-slate-400 hover:bg-white border-slate-100"
            )}
          >
            <Info className="w-4 h-4" />
            {lang === 'ar' ? 'معلومات الدفعة' : 'Information'}
          </button>

          {/* STAGES IN BETWEEN */}
          <div className="flex items-center gap-2">
            {departments?.map((dept, idx) => (
              <button
                key={dept.id}
                onClick={() => setActiveTab(dept.id)}
                className={cn(
                  "flex items-center gap-3 px-6 h-12 rounded-2xl transition-all whitespace-nowrap border shrink-0 relative group",
                  activeTab === dept.id 
                    ? "bg-emerald-600 text-white shadow-lg border-emerald-700" 
                    : order.currentStageId === dept.id 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-400 hover:bg-white border-slate-100"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border",
                  activeTab === dept.id ? "bg-emerald-500 border-white/20" : "bg-white border-slate-200"
                )}>
                  {idx + 1}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wide">{dept.nameAr}</span>
                {order.currentStageId === dept.id && activeTab !== dept.id && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 animate-pulse border-2 border-white" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Final: SUMMARY */}
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "flex items-center gap-2 px-6 h-12 rounded-2xl transition-all whitespace-nowrap border shrink-0 font-black text-xs uppercase tracking-wide",
              activeTab === 'summary' ? "bg-blue-600 text-white shadow-lg border-blue-700" : "bg-slate-50 text-slate-400 hover:bg-white border-slate-100"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            {lang === 'ar' ? 'الملخص الإحصائي' : 'Summary'}
          </button>

          <div className="flex-1" />

          <div className="hidden md:flex flex-col items-end shrink-0">
             <Badge className="bg-slate-900 text-white font-black text-[10px] tabular-nums uppercase">{order.orderNumber}</Badge>
             <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{product?.nameAr}</p>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        
        {/* --- VIEW: INFORMATION --- */}
        {activeTab === 'info' && (
          <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 space-y-6 rounded-[2.5rem] border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500"><Workflow className="w-40 h-40" /></div>
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900">{lang === 'ar' ? 'بيانات أمر الإنتاج' : 'Order Details'}</h3>
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <InfoItem icon={<Hash className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'رقم السجل' : 'Reference'} value={order.orderNumber} />
                    <InfoItem icon={<Type className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'عنوان الدفعة' : 'Batch Title'} value={order.title} />
                    <InfoItem icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'المنتج' : 'Product'} value={product?.nameAr} />
                    <InfoItem icon={<Target className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'الكمية المستهدفة' : 'Target Qty'} value={`${order.targetQty} قطعة`} />
                  </div>
                </div>
              </Card>

              <Card className="p-8 space-y-6 rounded-[2.5rem] border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500"><Calendar className="w-40 h-40" /></div>
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900">{lang === 'ar' ? 'الجدولة والأولوية' : 'Scheduling'}</h3>
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <InfoItem icon={<Calendar className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'تاريخ البدء' : 'Start Date'} value={order.startDate} />
                    <InfoItem icon={<Activity className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'الحالة الحالية' : 'Current Status'} value={order.status} isStatus />
                    <InfoItem icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} label={lang === 'ar' ? 'الأولوية' : 'Priority'} value={order.priority} />
                  </div>
                </div>
              </Card>
            </div>

            {order.notes && (
              <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-xl"><FileText className="w-5 h-5 text-emerald-400" /></div>
                    <h4 className="font-black">{lang === 'ar' ? 'تعليمات وملاحظات إضافية' : 'Additional Instructions'}</h4>
                 </div>
                 <p className="text-sm text-slate-400 font-medium leading-relaxed">{order.notes}</p>
              </Card>
            )}

            <div className="flex justify-center gap-4 pt-4">
               <Button className="h-14 px-10 premium-gradient rounded-2xl font-black gap-3 shadow-xl">
                  <Plus className="w-5 h-5" />
                  {lang === 'ar' ? 'إضافة عملية ميدانية' : 'New Transaction'}
               </Button>
               <Button variant="outline" className="h-14 px-10 rounded-2xl font-black border-slate-200">
                  {lang === 'ar' ? 'تعديل بيانات الدفعة' : 'Edit Order Data'}
               </Button>
            </div>
          </div>
        )}

        {/* --- VIEW: STAGE LOG --- */}
        {activeTab !== 'info' && activeTab !== 'summary' && (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
            {/* Stage Summary Bar */}
            <div className="bg-slate-50/50 border-b border-slate-200 py-6">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <MetricCard icon={<FileInput className="w-5 h-5" />} label={lang === 'ar' ? 'سندات صرف' : 'ISSUES'} value={stageMetrics.issuesCount} color="emerald" />
                   <MetricCard icon={<FileOutput className="w-5 h-5" />} label={lang === 'ar' ? 'مخرجات المرحلة' : 'OUTPUT'} value={stageMetrics.receiptsQty} unit="Pcs" color="blue" />
                   <MetricCard icon={<HandCoins className="w-5 h-5" />} label={lang === 'ar' ? 'أجور مقيدة' : 'WAGES'} value={stageMetrics.wagesTotal.toLocaleString('en-US')} unit="YER" color="amber" />
                   <ProgressMetric progress={stageMetrics.progress} />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
               <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 no-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <History className="w-5 h-5 text-emerald-600" />
                      {lang === 'ar' ? 'سجل العمليات في هذه المرحلة' : 'Stage Activity Log'}
                    </h3>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-right border-separate border-spacing-0">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</th>
                          <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'نوع العملية' : 'TYPE'}</th>
                          <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'الموظف / العامل' : 'PERSONNEL'}</th>
                          <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'التفاصيل' : 'REMARKS'}</th>
                          <th className="px-6 py-4 font-black text-[10px] text-slate-400 uppercase text-center">{lang === 'ar' ? 'الأثر' : 'IMPACT'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentStageVouchers.length === 0 ? (
                          <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-bold">
                            <Zap className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            {lang === 'ar' ? 'لا توجد عمليات موثقة في هذه المرحلة' : 'No activity in this stage'}
                          </td></tr>
                        ) : currentStageVouchers.map((v) => (
                          <TableRowItem key={v.id} voucher={v} worker={workers?.find(w => w.id === v.workerId)} lang={lang} />
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               <div className="w-full md:w-80 bg-white border-l border-slate-100 p-6 space-y-8 overflow-auto no-scrollbar">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-600" />
                       {lang === 'ar' ? 'المسؤول الإداري' : 'ADMIN CONTROL'}
                    </h3>
                    {(() => {
                      const supervisor = workers?.find(w => w.departmentId === activeTab && w.isSupervisor && w.active);
                      return (
                        <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-3xl space-y-4">
                          <Avatar className="h-16 w-16 mx-auto border-4 border-white shadow-xl rounded-2xl">
                             <AvatarImage src={supervisor?.photoUrl} />
                             <AvatarFallback className="bg-slate-100 text-slate-400 font-black">{supervisor?.fullName?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="text-center">
                             <p className="text-sm font-black text-slate-800 leading-none">{supervisor?.fullName || (lang === 'ar' ? 'غير محدد' : 'No lead')}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{lang === 'ar' ? 'مشرف القسم الحالي' : 'STAGE SUPERVISOR'}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{lang === 'ar' ? 'إنجاز المسار بالكامل' : 'OVERALL PIPELINE'}</p>
                     <div className="space-y-4">
                        {departments?.map(d => {
                          const doneInDept = (vouchers || [])
                            .filter(v => v.orderId === id && v.currentStageId === d.id && v.status !== 'deleted' && v.type === 'production_receipt')
                            .reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
                          const p = Math.round((doneInDept / (order.targetQty || 1)) * 100);
                          return (
                            <div key={d.id} className="space-y-1.5">
                               <div className="flex justify-between text-[9px] font-bold">
                                  <span className="text-slate-600">{d.nameAr}</span>
                                  <span className="text-emerald-600 tabular-nums">{p}%</span>
                               </div>
                               <Progress value={p} className="h-1 bg-slate-100" />
                            </div>
                          )
                        })}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- VIEW: FULL SUMMARY --- */}
        {activeTab === 'summary' && (
          <div className="container mx-auto px-4 py-10 space-y-10 animate-in zoom-in-95 duration-500 max-w-6xl">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryMainCard 
                title={lang === 'ar' ? 'الجاهز النهائي للبيع' : 'READY FOR SALE'} 
                value={(() => {
                   const finalStage = departments?.[departments.length - 1];
                   return vouchers?.filter(v => v.type === 'production_receipt' && v.currentStageId === finalStage?.id && v.status !== 'deleted')
                    .reduce((sum, v) => sum + (v.qtyAccepted || 0), 0) || 0;
                })()} 
                total={order.targetQty}
                icon={<Package className="w-8 h-8" />}
                color="emerald"
              />
              <SummaryMainCard 
                title={lang === 'ar' ? 'إجمالي الأجور المستحقة' : 'TOTAL WAGES'} 
                value={vouchers?.filter(v => v.type === 'production_receipt' && v.status !== 'deleted')
                  .reduce((sum, v) => sum + (v.wageAmount || 0), 0).toLocaleString('en-US')} 
                icon={<HandCoins className="w-8 h-8" />}
                unit="YER"
                color="amber"
              />
              <SummaryMainCard 
                title={lang === 'ar' ? 'سندات العمليات الموثقة' : 'TOTAL VOUCHERS'} 
                value={vouchers?.filter(v => v.status !== 'deleted').length} 
                icon={<ClipboardList className="w-8 h-8" />}
                color="slate"
              />
            </div>

            <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden shadow-xl">
               <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                  <h3 className="font-black text-slate-900">{lang === 'ar' ? 'تحليل الأداء حسب مراحل الإنتاج' : 'Performance Analysis by Stage'}</h3>
               </div>
               <Table className="text-right">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-right font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'المرحلة' : 'STAGE'}</TableHead>
                      <TableHead className="text-center font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'المنجز (قطعة)' : 'COMPLETED'}</TableHead>
                      <TableHead className="text-center font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'تكلفة الأجور' : 'WAGES'}</TableHead>
                      <TableHead className="text-center font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'نسبة الإنجاز' : 'PROGRESS'}</TableHead>
                      <TableHead className="text-center font-black text-[10px] text-slate-400 uppercase">{lang === 'ar' ? 'حالة المرحلة' : 'STATUS'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments?.map(d => {
                      const stageReceipts = vouchers.filter(v => v.currentStageId === d.id && v.type === 'production_receipt' && v.status !== 'deleted');
                      const done = stageReceipts.reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
                      const cost = stageReceipts.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
                      const p = Math.round((done / (order.targetQty || 1)) * 100);
                      
                      return (
                        <TableRow key={d.id} className="hover:bg-slate-50 transition-colors">
                           <TableCell className="font-black text-slate-900 text-sm">{d.nameAr}</TableCell>
                           <TableCell className="text-center font-bold text-slate-700 tabular-nums">{done.toLocaleString('en-US')}</TableCell>
                           <TableCell className="text-center font-black text-emerald-700 tabular-nums">{cost.toLocaleString('en-US')} YER</TableCell>
                           <TableCell className="text-center">
                              <div className="flex items-center gap-3 justify-center">
                                 <Progress value={p} className="h-1.5 w-20 bg-slate-100" />
                                 <span className="text-[10px] font-black text-slate-400 tabular-nums">{p}%</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              {p >= 100 ? (
                                <Badge className="bg-emerald-50 text-emerald-700 font-black text-[8px] uppercase">COMPLETE</Badge>
                              ) : p > 0 ? (
                                <Badge className="bg-blue-50 text-blue-700 font-black text-[8px] uppercase">ACTIVE</Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-300 font-black text-[8px] uppercase border-slate-200">PENDING</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
               </Table>
            </Card>

            <div className="p-8 bg-slate-950 rounded-[3rem] text-center space-y-4">
               <h4 className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">{lang === 'ar' ? 'التكلفة الإنتاجية المبدئية' : 'ESTIMATED PRODUCTION COST'}</h4>
               <div className="text-5xl md:text-7xl font-black text-white tabular-nums">
                  {vouchers?.filter(v => v.status !== 'deleted').reduce((sum, v) => sum + (v.wageAmount || 0) + (v.totalAmount || 0), 0).toLocaleString('en-US')}
                  <span className="text-lg text-emerald-500 ms-4 uppercase">YER</span>
               </div>
               <p className="text-xs text-slate-500 max-w-lg mx-auto font-medium">
                 {lang === 'ar' ? 'يتم حساب هذه التكلفة بناءً على إجمالي سندات الصرف (مواد خام) مضافاً إليها سندات الأجور المقيدة حتى اللحظة.' : 'Calculated based on raw material issues plus accrued wages to date.'}
               </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function InfoItem({ icon, label, value, isStatus }: { icon: any, label: string, value: string, isStatus?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      {isStatus ? (
        <Badge className="bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase border border-emerald-100">{value}</Badge>
      ) : (
        <span className="text-xs font-black text-slate-700 tabular-nums">{value || '---'}</span>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, unit, color }: { icon: any, label: string, value: any, unit?: string, color: string }) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600"
  };
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={cn("p-2.5 rounded-2xl", colorMap[color])}>{icon}</div>
      <div>
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         <h4 className="text-lg font-black text-slate-900 tabular-nums">{value} {unit && <span className="text-[8px] opacity-40 uppercase ms-1">{unit}</span>}</h4>
      </div>
    </div>
  );
}

function ProgressMetric({ progress }: { progress: number }) {
  return (
    <div className="bg-slate-900 p-4 rounded-3xl shadow-md text-white flex items-center justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity className="w-12 h-12" /></div>
      <div className="relative z-10">
         <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">إنجاز المرحلة</p>
         <h4 className="text-2xl font-black tabular-nums">{progress}%</h4>
      </div>
      <div className="relative z-10 w-12 h-12">
         <svg className="w-full h-full" viewBox="0 0 36 36">
            <path className="text-slate-800" strokeDasharray="100, 100" strokeWidth="4" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-emerald-500" strokeDasharray={`${progress}, 100`} strokeWidth="4" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
         </svg>
      </div>
    </div>
  );
}

function SummaryMainCard({ title, value, total, icon, unit, color }: { title: string, value: any, total?: number, icon: any, unit?: string, color: string }) {
  const colors: any = {
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50/50 border-amber-100",
    slate: "text-slate-600 bg-slate-50/50 border-slate-100"
  };
  return (
    <Card className={cn("p-8 rounded-[2.5rem] border flex flex-col items-center text-center space-y-4 shadow-sm group hover:shadow-lg transition-all", colors[color])}>
       <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
       <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
          <div className="flex items-baseline gap-2 justify-center">
             <h4 className="text-4xl font-black tabular-nums">{value}</h4>
             {unit && <span className="text-sm font-bold opacity-60">{unit}</span>}
             {total && <span className="text-xs font-bold text-slate-400 tabular-nums">/ {total} Pcs</span>}
          </div>
       </div>
    </Card>
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
        {voucher.notes || (voucher.items ? `${voucher.items.length} مواد مصروفة` : '---')}
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
