'use client';

import React, { useMemo } from 'react';
import { 
  Factory, 
  PlayCircle, 
  CheckCircle2, 
  Box, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Layers,
  Wallet,
  Receipt,
  Activity,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  Legend,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProductionDashboard() {
  const { lang, t, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  // Real-time Data Fetching
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const workersQuery = useMemo(() => !db ? null : query(collection(db, 'workers'), where('status', '!=', 'deleted')), [db]);
  const vouchersQuery = useMemo(() => !db ? null : collection(db, 'vouchers'), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allMaterials, loading: materialsLoading } = useCollection<any>(materialsQuery);
  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: allVouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  // 1. Stats Processing
  const stats = useMemo(() => {
    if (!allOrders || !allMaterials || !allWorkers || !allVouchers) return null;

    const active = allOrders.filter(o => o.status === 'active').length;
    const lowStock = allMaterials.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length;
    const supervisors = allWorkers.filter(w => w.isSupervisor && w.active).length;
    
    // Summing completed quantities for "Total Finished Goods"
    const totalCompleted = allOrders.reduce((acc, curr) => acc + (curr.completedQty || 0), 0);

    return [
      { title: t.production.stats.totalOrders, value: allOrders.length.toLocaleString('en-US'), change: 'Total', type: 'info', icon: <Factory className="w-5 h-5" /> },
      { title: t.production.stats.activeOrders, value: active.toLocaleString('en-US'), change: 'Live', type: 'increase', icon: <PlayCircle className="w-5 h-5" /> },
      { title: t.production.stats.dailyProduction, value: totalCompleted.toLocaleString('en-US'), change: 'Pcs', type: 'increase', icon: <CheckCircle2 className="w-5 h-5" /> },
      { title: t.production.stats.rawMaterialsCount, value: allMaterials.length.toLocaleString('en-US'), change: `${lowStock} Low`, type: lowStock > 0 ? 'danger' : 'info', icon: <Box className="w-5 h-5" /> },
      { title: t.production.stats.activeWorkers, value: allWorkers.filter(w => w.active).length.toLocaleString('en-US'), change: `${supervisors} Sups`, type: 'info', icon: <Users className="w-5 h-5" /> },
    ];
  }, [allOrders, allMaterials, allWorkers, allVouchers, t.production.stats]);

  // 2. Production Growth Chart Data (Last 6 Months)
  const growthChartData = useMemo(() => {
    if (!allVouchers) return [];
    const receipts = allVouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted');
    
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    receipts.forEach(v => {
      const date = v.date?.slice(0, 7);
      if (months[date] !== undefined) {
        months[date] += (v.qtyAccepted || 0);
      }
    });

    return Object.entries(months).map(([name, qty]) => ({ name, qty }));
  }, [allVouchers]);

  // 3. Worker Productivity Data
  const workerChartData = useMemo(() => {
    if (!allVouchers || !allWorkers) return [];
    const receipts = allVouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted');
    
    const workerStats: Record<string, { name: string, qty: number, wages: number }> = {};

    receipts.forEach(v => {
      const worker = allWorkers.find(w => w.id === v.workerId);
      if (worker) {
        if (!workerStats[worker.id]) workerStats[worker.id] = { name: worker.fullName.split(' ')[0], qty: 0, wages: 0 };
        workerStats[worker.id].qty += (v.qtyAccepted || 0);
        workerStats[worker.id].wages += (v.wageAmount || 0);
      }
    });

    return Object.values(workerStats).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [allVouchers, allWorkers]);

  // 4. Batch Cost Breakdown Data
  const batchCostData = useMemo(() => {
    if (!allOrders || !allVouchers) return [];
    
    return allOrders.filter(o => o.status === 'active').slice(0, 5).map(order => {
      const vouchers = allVouchers.filter(v => v.orderId === order.id && v.status !== 'deleted');
      const mat = vouchers.filter(v => v.type === 'material_issue').reduce((sum, v) => sum + (v.totalAmount || 0), 0);
      const wage = vouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
      const overhead = vouchers.filter(v => v.type === 'overhead_cost').reduce((sum, v) => sum + (v.totalAmount || 0), 0);
      
      return {
        name: order.orderNumber,
        materials: mat,
        labor: wage,
        overhead: overhead
      };
    });
  }, [allOrders, allVouchers]);

  if (ordersLoading || materialsLoading || workersLoading || vouchersLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">جاري سحب المؤشرات الميدانية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth no-scrollbar bg-[#f8fafc]">
      
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1 text-right rtl:text-right ltr:text-left">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-full w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            {isRtl ? 'الرقابة والتحليل المباشر' : 'Live Control & Analytics'}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.production.dashboard}</h1>
          <p className="text-sm text-slate-500 font-medium">
            {isRtl ? 'نظرة بانورامية شاملة على نمو الإنتاج، التكاليف، وأداء القوى العاملة.' : 'Unified view of growth, costs, and labor performance.'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="h-11 px-6 rounded-xl font-black gap-2 border-slate-200 text-slate-600 hover:bg-white transition-all shadow-sm" asChild>
            <Link href="/production/reports/financial"><BarChart3 className="w-4 h-4" /> {isRtl ? 'التقارير المالية' : 'Financials'}</Link>
          </Button>
          <Button className="h-11 px-8 rounded-xl font-black gap-2 shadow-lg premium-gradient border-none transition-all active:scale-95" asChild>
            <Link href="/production/orders"><PlayCircle className="w-4 h-4" /> {isRtl ? 'إدارة الأوامر' : 'Orders'}</Link>
          </Button>
        </div>
      </div>

      {/* COMPACT STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats?.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm group hover:border-emerald-200 transition-all flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className={cn("p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all")}>
                {stat.icon}
              </div>
              <div className={cn("text-[9px] font-black tracking-tighter px-2 py-0.5 rounded-full border", 
                stat.type === 'increase' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                stat.type === 'danger' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                'bg-slate-50 text-slate-400 border-slate-100'
              )}>
                {stat.change}
              </div>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-2xl font-black text-slate-900 tabular-nums">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE ROW - PRIMARY CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* PRODUCTION GROWTH (AREA CHART) */}
        <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
             <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">{isRtl ? 'منحنى نمو الإنتاج' : 'Production Growth Curve'}</h3>
                <p className="text-xs text-slate-400 font-bold">{isRtl ? 'إجمالي القطع الجاهزة خلال الأشهر الستة الماضية' : 'Total finished items over last 6 months'}</p>
             </div>
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].payload.name}</p>
                          <p className="text-lg font-black text-emerald-400">{payload[0].value?.toLocaleString()} <span className="text-[10px]">قطعة</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WORKER PERFORMANCE (BAR CHART) */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
             <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">{isRtl ? 'كفاءة الحرفيين' : 'Workforce Efficiency'}</h3>
                <p className="text-xs text-slate-400 font-bold">{isRtl ? 'أعلى الحرفيين إنتاجية في الفترة الحالية' : 'Top producing artisans this period'}</p>
             </div>
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerChartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }} width={60} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 border-r-4 border-r-purple-600">
                          <p className="text-xs font-black text-slate-900 mb-1">{payload[0].payload.name}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500">الإنتاج: <span className="text-slate-900 font-black">{payload[0].payload.qty} قطعة</span></p>
                            <p className="text-[10px] font-bold text-slate-500">الأجور: <span className="text-purple-600 font-black">{payload[0].payload.wages.toLocaleString()} YER</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="qty" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={12}>
                  {workerChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#7c3aed'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW - COST ANALYSIS & RECENT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* BATCH COST ANALYSIS (STACKED BAR) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
             <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">{isRtl ? 'هيكل تكاليف الدفعات النشطة' : 'Batch Cost Structure'}</h3>
                <p className="text-xs text-slate-400 font-bold">{isRtl ? 'تحليل التكاليف الفعلية للأوامر قيد الإنتاج' : 'Real-time cost breakdown for active batches'}</p>
             </div>
             <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Layers className="w-5 h-5" /></div>
          </div>
          <div className="h-[280px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchCostData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                     cursor={{ fill: '#f8fafc' }}
                     content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         return (
                           <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl space-y-3 min-w-[180px]">
                              <p className="text-xs font-black border-b border-white/10 pb-2 mb-2">{payload[0].payload.name}</p>
                              {payload.map((p, i) => (
                                <div key={i} className="flex justify-between items-center gap-4">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                      <span className="text-[10px] font-bold text-slate-400">{isRtl ? (p.name === 'materials' ? 'مواد' : p.name === 'labor' ? 'أجور' : 'مصاريف') : p.name}</span>
                                   </div>
                                   <span className="text-[10px] font-black tabular-nums">{p.value?.toLocaleString()} YER</span>
                                </div>
                              ))}
                           </div>
                         );
                       }
                       return null;
                     }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }} />
                  <Bar dataKey="materials" name="Materials" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={30} />
                  <Bar dataKey="labor" name="Labor" stackId="a" fill="#7c3aed" />
                  <Bar dataKey="overhead" name="Overhead" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* SYSTEM STATUS & RECENT ORDERS TABLE */}
        <div className="xl:col-span-5 flex flex-col gap-6">
           <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <ShieldCheck className="w-40 h-40 text-emerald-400" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black border border-emerald-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isRtl ? 'بروتوكول الرقابة المالية نشط' : 'FINANCIAL AUDIT ACTIVE'}
                 </div>
                 <h3 className="text-xl font-black">{isRtl ? 'سلامة التدفق النقدي' : 'Cashflow Integrity'}</h3>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">
                   {isRtl 
                    ? 'يتم الآن ربط كل قطعة منتجة بعهدتها المالية والمخزنية. أي انحراف في نسب الإهلاك يتم إرساله فوراً لمدير العمليات للمراجعة.' 
                    : 'Every item produced is now linked to its financial and inventory liability. Any waste deviation is auto-flagged.'}
                 </p>
                 <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-white/5 p-0 h-auto text-xs font-black gap-2">
                    {isRtl ? 'عرض سجل التدقيق' : 'View Audit Logs'} <ExternalLink className="w-3 h-3" />
                 </Button>
              </div>
           </div>

           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-sm font-black text-slate-900">{isRtl ? 'أوامر الإنتاج الأخيرة' : 'Recent Batches'}</h3>
                 <Link href="/production/orders" className="text-[10px] font-black text-emerald-600 hover:underline">{isRtl ? 'عرض الكل' : 'View All'}</Link>
              </div>
              <ScrollArea className="flex-1">
                 <div className="p-4 space-y-3">
                    {allOrders?.filter(o => o.status !== 'deleted').slice(0, 4).map((order, i) => {
                       const p = Math.round(((order.completedQty || 0) / (order.targetQty || 1)) * 100);
                       return (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100/50 transition-colors border border-transparent hover:border-slate-200 group">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                                   <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-slate-900">{order.orderNumber}</span>
                                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{order.startDate}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                   <span className="text-[9px] font-black text-slate-500 tabular-nums">{p}%</span>
                                   <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${p}%` }} /></div>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 text-slate-300", isRtl && "rotate-180")} />
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </ScrollArea>
           </div>
        </div>

      </div>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-slate-900 rounded-lg text-emerald-400 shadow-inner"><ShieldCheck className="w-4 h-4" /></div>
          <p className="text-[10px] font-bold text-slate-500 tracking-tight">
            {isRtl 
              ? 'تنويه: كافة الرسومات البيانية تعتمد على السندات المرحلة رسمياً في النظام لضمان دقة البيانات المالية والمخزنية.' 
              : 'Disclaimer: All charts are derived from officially posted vouchers to ensure financial and inventory accuracy.'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums">
           <span>ERP VERSION 2.1.0</span>
           <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
           <span>{new Date().getFullYear()} TIA SYSTEM</span>
        </div>
      </div>

    </div>
  );
}
