'use client';

import React, { useMemo } from 'react';
import { 
  Factory, 
  PlayCircle, 
  CheckCircle2, 
  Box, 
  Users, 
  TrendingUp, 
  ShieldCheck,
  Loader2,
  Layers,
  Wallet,
  Receipt,
  Activity,
  BarChart3,
  ChevronRight,
  Target,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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
  Cell
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function ProductionDashboard() {
  const { lang, t, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  // Data Fetching
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const workersQuery = useMemo(() => !db ? null : query(collection(db, 'workers'), where('status', '!=', 'deleted')), [db]);
  const vouchersQuery = useMemo(() => !db ? null : collection(db, 'vouchers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allMaterials, loading: materialsLoading } = useCollection<any>(materialsQuery);
  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: allVouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const loading = ordersLoading || materialsLoading || workersLoading || vouchersLoading;

  // 1. Stats Processing
  const stats = useMemo(() => {
    if (!allOrders || !allMaterials || !allWorkers) return null;
    const active = allOrders.filter(o => o.status === 'active').length;
    const lowStock = allMaterials.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length;
    const totalCompleted = allOrders.reduce((acc, curr) => acc + (curr.completedQty || 0), 0);

    return [
      { title: t.production.stats.totalOrders, value: allOrders.length, change: 'Orders', type: 'info', icon: <Factory className="w-4 h-4" /> },
      { title: t.production.stats.activeOrders, value: active, change: 'Live', type: 'increase', icon: <PlayCircle className="w-4 h-4" /> },
      { title: t.production.stats.dailyProduction, value: totalCompleted, change: 'Pcs', type: 'increase', icon: <CheckCircle2 className="w-4 h-4" /> },
      { title: t.production.stats.rawMaterialsCount, value: allMaterials.length, change: `${lowStock} Low`, type: lowStock > 0 ? 'danger' : 'info', icon: <Box className="w-4 h-4" /> },
      { title: t.production.stats.activeWorkers, value: allWorkers.filter(w => w.active).length, change: 'Staff', type: 'info', icon: <Users className="w-4 h-4" /> },
    ];
  }, [allOrders, allMaterials, allWorkers, t.production.stats]);

  // 2. Production Growth Chart Data
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
      if (months[date] !== undefined) months[date] += (v.qtyAccepted || 0);
    });
    return Object.entries(months).map(([name, qty]) => ({ name, qty }));
  }, [allVouchers]);

  // 3. Dynamic Labor Productivity by Department
  const laborByStage = useMemo(() => {
    if (!allVouchers || !allWorkers || !allDepartments) return [];
    const receipts = allVouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted');
    
    return allDepartments.filter(d => d.status === 'active').map(dept => {
      const deptWorkers = allWorkers.filter(w => w.departmentId === dept.id);
      const workerData = deptWorkers.map(w => {
        const qty = receipts.filter(r => r.workerId === w.id).reduce((sum, r) => sum + (r.qtyAccepted || 0), 0);
        return { name: w.fullName.split(' ')[0], qty, fullName: w.fullName };
      }).filter(w => w.qty > 0).sort((a, b) => b.qty - a.qty);

      return {
        deptId: dept.id,
        deptName: dept.nameAr,
        workers: workerData
      };
    }).filter(d => d.workers.length > 0);
  }, [allVouchers, allWorkers, allDepartments]);

  // 4. Detailed Cost Analysis for each Active Order
  const orderCostBreakdown = useMemo(() => {
    if (!allOrders || !allVouchers || !allProducts) return [];
    
    return allOrders.filter(o => o.status === 'active').map(order => {
      const product = allProducts.find(p => p.id === order.productId);
      const vouchers = allVouchers.filter(v => v.orderId === order.id && v.status !== 'deleted');
      const materials = vouchers.filter(v => v.type === 'material_issue').reduce((sum, v) => sum + (v.totalAmount || 0), 0);
      const labor = vouchers.filter(v => v.type === 'production_receipt').reduce((sum, v) => sum + (v.wageAmount || 0), 0);
      const overhead = vouchers.filter(v => v.type === 'overhead_cost').reduce((sum, v) => sum + (v.totalAmount || 0), 0);
      const total = materials + labor + overhead;
      
      const revenue = (order.completedQty || 0) * (product?.price || 0);
      const profit = revenue - total;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        title: order.title,
        productName: product?.nameAr,
        total,
        profit,
        data: [
          { category: isRtl ? 'مواد' : 'Mat', amount: materials, fill: '#f59e0b' },
          { category: isRtl ? 'أجور' : 'Labor', amount: labor, fill: '#7c3aed' },
          { category: isRtl ? 'مصاريف' : 'Misc', amount: overhead, fill: '#ef4444' }
        ]
      };
    });
  }, [allOrders, allVouchers, allProducts, isRtl]);

  if (loading) {
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
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-[#f8fafc] no-scrollbar">
      
      {/* HEADER: COMPACT & PROFESSIONAL */}
      <div className="flex flex-col space-y-1 text-right rtl:text-right ltr:text-left">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.production.dashboard}</h1>
        <p className="text-xs text-slate-500 font-medium">
          {isRtl ? 'الرقابة المباشرة على جودة الإنتاج وهيكل التكاليف.' : 'Live control over production quality and cost structure.'}
        </p>
      </div>

      {/* STATS ROW: FULL WIDTH */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats?.map((stat, idx) => (
          <Card key={idx} className="p-3 border-slate-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden rounded-lg">
            <div className="flex items-center justify-between relative z-10">
              <div className="p-2 rounded-lg bg-slate-50 text-slate-400">{stat.icon}</div>
              <Badge variant="outline" className={cn("text-[8px] font-black tabular-nums border-none", 
                stat.type === 'increase' ? 'bg-emerald-50 text-emerald-600' :
                stat.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
              )}>{stat.change}</Badge>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-xl font-black text-slate-900 tabular-nums">{stat.value.toLocaleString()}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* ROW 1: PRODUCTION GROWTH */}
      <Card className="p-6 border-slate-200 shadow-sm rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              {isRtl ? 'منحنى نمو الإنتاج الشهري' : 'Monthly Production Growth'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">{isRtl ? 'إجمالي القطع الجاهزة النهائية' : 'Total finished pieces'}</p>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthChartData}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip content={({ active, payload }) => active && payload ? (
                <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black border border-slate-800">
                  {payload[0].value} {isRtl ? 'قطعة' : 'Pcs'}
                </div>
              ) : null} />
              <Area type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={3} fill="url(#colorGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROW 2: LABOR OUTPUT BY STAGE (Dynamic Grid) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{isRtl ? 'تحليل إنتاجية الحرفيين حسب المرحلة' : 'Productivity by Work Center'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {laborByStage.map((stage, idx) => (
            <Card key={idx} className="p-4 border-slate-200 shadow-sm rounded-lg flex flex-col h-64">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">{stage.deptName}</span>
                <span className="text-[9px] font-bold text-slate-400">{stage.workers.length} {isRtl ? 'حرفي' : 'Staff'}</span>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stage.workers} layout="vertical" margin={{ left: -10, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }} width={60} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => active && payload ? (
                      <div className="bg-white p-2 rounded-lg shadow-xl border border-slate-100 text-[10px] font-black">
                        {payload[0].payload.fullName}: {payload[0].value} {isRtl ? 'قطعة' : 'Pcs'}
                      </div>
                    ) : null} />
                    <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ROW 3: FINANCIALS BY ORDER (Individual Visualizations) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{isRtl ? 'تحليل هيكل التكاليف للأوامر النشطة' : 'Active Orders Cost Structure'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {orderCostBreakdown.map((order, idx) => (
            <Card key={idx} className="p-4 border-slate-200 shadow-sm rounded-lg space-y-4 flex flex-col h-72">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-emerald-600 tabular-nums">{order.orderNumber}</span>
                  <Badge className={cn("text-[8px] font-black", order.profit >= 0 ? "bg-emerald-500" : "bg-rose-500")}>
                    {order.profit >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  </Badge>
                </div>
                <h4 className="text-[11px] font-black text-slate-900 truncate">{order.title}</h4>
              </div>
              
              <div className="flex-1 w-full bg-slate-50/50 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={order.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} hide />
                    <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => active && payload ? (
                      <div className="bg-slate-900 text-white p-2 rounded-lg text-[9px] font-black">
                        {payload[0].value.toLocaleString()} YER
                      </div>
                    ) : null} />
                    <Bar dataKey="amount" radius={[3, 3, 0, 0]} barSize={24}>
                      {order.data.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{isRtl ? 'إجمالي التكلفة' : 'TOTAL COST'}</span>
                  <span className="text-xs font-black text-slate-900 tabular-nums">{order.total.toLocaleString()} <span className="text-[9px] opacity-40">YER</span></span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{isRtl ? 'الربح التقديري' : 'EST. PROFIT'}</span>
                  <span className={cn("text-xs font-black tabular-nums", order.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {order.profit.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SYSTEM NOTE */}
      <div className="p-3 bg-slate-900 text-white/30 rounded-lg flex items-center justify-between gap-4 border border-slate-800 shadow-inner mt-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <p className="text-[9px] font-bold tracking-tight">
            {isRtl 
              ? 'تنويه: كافة الرسومات البيانية تعتمد على السندات المعتمدة والمُرحلة رسمياً لضمان دقة الرقابة المالية والمخزنية.' 
              : 'Note: All charts are derived from officially posted vouchers for fiscal and inventory integrity.'}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest tabular-nums">
           <span>ERP v2.2.0</span>
           <span className="w-1 h-1 rounded-full bg-slate-700" />
           <span>TIA SYSTEM</span>
        </div>
      </div>

    </div>
  );
}
