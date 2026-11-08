
'use client';

import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  Target, 
  Activity, 
  LayoutGrid, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Factory,
  Layers,
  ArrowUpRight,
  Boxes,
  Loader2,
  Filter,
  Search,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function ProductionMonitoringPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allReceipts } = useCollection<any>(receiptsQuery);

  const loading = ordersLoading;

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(o => {
      if (o.status === 'deleted' || o.status === 'completed') return false;
      const s = search.toLowerCase();
      return o.orderNumber?.toLowerCase().includes(s) || o.title?.toLowerCase().includes(s);
    });
  }, [allOrders, search]);

  const monitoringStats = useMemo(() => {
    if (!allOrders || !allDepartments || !allReceipts) return null;
    const active = allOrders.filter(o => o.status === 'active');
    
    // Final stage is the indicator of true "Finished Goods"
    const finalStage = allDepartments[allDepartments.length - 1];
    
    const totalTarget = active.reduce((acc, curr) => acc + (curr.targetQty || 0), 0);
    
    // We only sum receipts that belong to the FINAL STAGE
    const totalFinished = allReceipts
      .filter(r => r.type === 'production_receipt' && r.status !== 'deleted' && r.currentStageId === finalStage?.id)
      .reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);

    const avgProgress = totalTarget > 0 ? Math.round((totalFinished / totalTarget) * 100) : 0;

    return { totalTarget, totalFinished, avgProgress, activeCount: active.length };
  }, [allOrders, allDepartments, allReceipts]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'العمليات' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'متابعة الإنتاج المباشر' : 'Live Monitoring'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'نبض خطوط الإنتاج' : 'Manufacturing Heartbeat'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative hidden md:block">
                <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث باسم الأمر...' : 'Search batch...'} className={cn("h-10 w-64 bg-slate-50 text-xs font-bold", dir === 'rtl' ? "pr-10" : "pl-10")} />
             </div>
             <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <div className="px-3 py-1 text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الأوامر النشطة' : 'ACTIVE'}</p>
                   <p className="text-sm font-black text-emerald-600 tabular-nums">{monitoringStats?.activeCount}</p>
                </div>
                <div className="w-px h-6 bg-slate-200 self-center" />
                <div className="px-3 py-1 text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'إجمالي الجاهز' : 'READY'}</p>
                   <p className="text-sm font-black text-slate-700 tabular-nums">{monitoringStats?.avgProgress}%</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MAIN MONITORING GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-8 no-scrollbar">
        {loading ? (
           <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري سحب البيانات الميدانية...</p>
           </div>
        ) : filteredOrders.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Zap className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400">{lang === 'ar' ? 'لا توجد عمليات إنتاج نشطة حالياً' : 'No active production pulses'}</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredOrders.map(order => {
              const product = allProducts?.find(p => p.id === order.productId);
              
              // Calculate TRUE completion (only final stage)
              const finalStage = allDepartments?.[allDepartments.length - 1];
              const finalReceipts = allReceipts?.filter(r => r.orderId === order.id && r.currentStageId === finalStage?.id && r.status !== 'deleted') || [];
              const finalDone = finalReceipts.reduce((sum, r) => sum + (r.qtyAccepted || 0), 0);
              const progress = Math.round((finalDone / (order.targetQty || 1)) * 100);
              
              return (
                <Card key={order.id} className="p-6 rounded-[2rem] border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] -z-0 pointer-events-none transform scale-150 rotate-12">
                    <Factory className="w-40 h-40" />
                  </div>
                  
                  <div className="relative z-10 space-y-6">
                    {/* TOP BAR */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 text-right rtl:text-right ltr:text-left">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[10px] font-black tabular-nums bg-slate-50">{order.orderNumber}</Badge>
                           <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black">{product?.nameAr}</Badge>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{order.title}</h3>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'جاهز نهائي' : 'FINISHED GOOD'}</p>
                         <div className="flex items-baseline justify-end gap-1">
                            <span className="text-3xl font-black text-emerald-600 tabular-nums">{progress}%</span>
                         </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="space-y-2">
                       <Progress value={progress} className="h-3 bg-slate-100" />
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 tabular-nums">
                          <span>{(finalDone).toLocaleString('en-US')} {lang === 'ar' ? 'جاهز' : 'READY'}</span>
                          <span>{(order.targetQty || 0).toLocaleString('en-US')} {lang === 'ar' ? 'المستهدف' : 'TARGET'}</span>
                       </div>
                    </div>

                    {/* DEPARTMENT BREAKDOWN (WIP Tracking) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {allDepartments?.slice(0, 4).map((dept) => {
                          const doneInDept = (allReceipts || [])
                            .filter(r => r.orderId === order.id && r.currentStageId === dept.id && r.status !== 'deleted')
                            .reduce((sum, r) => sum + (r.qtyAccepted || 0), 0);
                          
                          return (
                            <div key={dept.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[9px] font-black text-slate-500 truncate uppercase">{dept.nameAr}</span>
                               </div>
                               <p className="text-lg font-black text-slate-800 tabular-nums">{(doneInDept).toLocaleString('en-US')}</p>
                            </div>
                          )
                       })}
                    </div>

                    {/* STATUS FOOTER */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Clock className="w-3 h-3" />
                          {lang === 'ar' ? 'تاريخ البدء:' : 'Started:'} {order.startDate}
                       </div>
                       <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-emerald-600 gap-2 hover:bg-emerald-50">
                          {lang === 'ar' ? 'تحليل المسار الكامل' : 'Full Pipeline Trace'}
                          <ArrowUpRight className="w-3 h-3" />
                       </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-2.5 bg-slate-900 text-white/40 flex items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Activity className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-bold tracking-tight">
          {lang === 'ar' 
            ? 'بروتوكول الفرز: يتم حساب الجاهزية النهائية بناءً على مخرجات المرحلة الأخيرة فقط لضمان دقة المخازن.' 
            : 'Sorting Protocol: Readiness is calculated solely on final stage output for inventory accuracy.'}
        </p>
      </div>

    </div>
  );
}
