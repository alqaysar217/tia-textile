
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
  TrendingDown,
  Sparkles,
  PieChart,
  UserCheck
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
  Cell,
  Legend
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  // Formatting helper to force English numbers
  const formatNum = (val: number | string) => {
    return Number(val).toLocaleString('en-US');
  };

  // 1. Stats Processing
  const stats = useMemo(() => {
    if (!allOrders || !allMaterials || !allWorkers) return null;
    const active = allOrders.filter(o => o.status === 'active').length;
    const lowStock = allMaterials.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length;
    const totalCompleted = allOrders.reduce((acc, curr) => acc + (curr.completedQty || 0), 0);

    return [
      { title: t.production.stats.totalOrders, value: allOrders.length, change: 'Orders', type: 'info', icon: <Factory className="w-4 h-4" />, gradient: 'from-blue-600 to-blue-400' },
      { title: t.production.stats.activeOrders, value: active, change: 'Live', type: 'increase', icon: <PlayCircle className="w-4 h-4" />, gradient: 'from-emerald-600 to-emerald-400' },
      { title: t.production.stats.dailyProduction, value: totalCompleted, change: 'Total Pcs', type: 'increase', icon: <CheckCircle2 className="w-4 h-4" />, gradient: 'from-violet-600 to-violet-400' },
      { title: t.production.stats.rawMaterialsCount, value: allMaterials.length, change: `${lowStock} Low`, type: lowStock > 0 ? 'danger' : 'info', icon: <Box className="w-4 h-4" />, gradient: 'from-amber-600 to-amber-400' },
      { title: t.production.stats.activeWorkers, value: allWorkers.filter(w => w.active).length, change: 'Staff', type: 'info', icon: <Users className="w-4 h-4" />, gradient: 'from-rose-600 to-rose-400' },
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

  // 4. Detailed Cost Analysis for Active Orders (Using REAL Data)
  const orderCostBreakdown = useMemo(() => {
    if (!allOrders || !allVouchers || !allProducts) return [];
    
    return allOrders.filter(o => o.status === 'active').map(order => {
      const product = allProducts.find(p => p.id === order.productId);
      const vouchers = allVouchers.filter(v => v.orderId === order.id && v.status !== 'deleted');
      
      // Calculate REAL sums from vouchers
      const materialCost = vouchers
        .filter(v => v.type === 'material_issue')
        .reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
      
      const laborCost = vouchers
        .filter(v => v.type === 'production_receipt')
        .reduce((sum, v) => sum + (Number(v.wageAmount) || 0), 0);
      
      const overheadCost = vouchers
        .filter(v => v.type === 'overhead_cost')
        .reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);

      const total = materialCost + laborCost + overheadCost;
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
          { category: isRtl ? 'مواد' : 'Mat', amount: materialCost, fill: '#f59e0b' },
          { category: isRtl ? 'أجور' : 'Labor', amount: laborCost, fill: '#7c3aed' },
          { category: isRtl ? 'مصاريف' : 'Misc', amount: overheadCost, fill: '#ef4444' }
        ]
      };
    });
  }, [allOrders, allVouchers, allProducts, isRtl]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
           <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 bg-[#F3F5F9] no-scrollbar">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-xl text-emerald-400 shadow-xl"><Sparkles className="w-6 h-6" /></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.production.dashboard}</h1>
           </div>
           <p className="text-sm text-slate-500 font-bold opacity-80 ps-12">
             {isRtl ? 'نظام الرقابة الذكي والتحليل المالي المتقدم للجمعية.' : 'Advanced smart control and financial analysis system.'}
           </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <ShieldCheck className="w-5 h-5 text-emerald-500" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secured Management Session</span>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats?.map((stat, idx) => (
          <Card key={idx} className="p-5 border-none shadow-xl bg-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform", stat.gradient)} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg", stat.gradient)}>{stat.icon}</div>
              <Badge className="bg-slate-50 text-slate-400 font-black text-[9px] border-none px-2">{stat.change}</Badge>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-slate-900 tabular-nums">{formatNum(stat.value)}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* ROW 1: GROWTH CHART */}
      <Card className="p-8 border-none shadow-2xl bg-white rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full" />
              {isRtl ? 'مؤشر نمو الإنتاج التراكمي' : 'Production Growth Pulse'}
            </h3>
            <p className="text-[11px] text-slate-400 font-bold ps-5 uppercase tracking-widest">{isRtl ? 'إحصائيات الوحدات المنجزة شهرياً' : 'Completed pieces stats'}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthChartData}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#10b981', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={4} fill="url(#colorGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROW 2: LABOR OUTPUT BY CENTER */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-violet-600 rounded-lg text-white"><UserCheck className="w-5 h-5" /></div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">{isRtl ? 'تحليل كفاءة الحرفيين حسب مركز الإنتاج' : 'Workforce Efficiency Analysis'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {laborByStage.map((stage, idx) => (
            <Card key={idx} className="p-6 border-none shadow-xl bg-white rounded-2xl flex flex-col h-[320px] hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">CENTER / PHASE</span>
                   <span className="text-base font-black text-slate-900">{stage.deptName}</span>
                </div>
                <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-100 px-4 py-1 font-black tabular-nums">{formatNum(stage.workers.length)} {isRtl ? 'حرفي' : 'Staff'}</Badge>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stage.workers} layout="vertical" margin={{ left: -10, right: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} width={70} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }} 
                      content={({ active, payload }) => active && payload ? (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border-none text-[11px] font-black">
                          {payload[0].payload.fullName}
                          <div className="mt-1 text-emerald-400">{formatNum(payload[0].value)} {isRtl ? 'قطعة' : 'Pcs'}</div>
                        </div>
                      ) : null} 
                    />
                    <Bar dataKey="qty" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={16}>
                       {stage.workers.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 0 ? '#7c3aed' : '#a78bfa'} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ROW 3: FINANCIALS BY ORDER (Using REAL sums) */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500 rounded-lg text-white"><PieChart className="w-5 h-5" /></div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">{isRtl ? 'هيكل التكاليف الحقيقي للأوامر النشطة' : 'Real-time Cost Architecture'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {orderCostBreakdown.map((order, idx) => (
            <Card key={idx} className="p-6 border-none shadow-xl bg-white rounded-2xl space-y-6 flex flex-col h-[380px] hover:shadow-2xl transition-all">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-[10px] font-black text-emerald-600 border-emerald-100 tabular-nums bg-emerald-50">{order.orderNumber}</Badge>
                  <div className={cn("p-1.5 rounded-lg text-white shadow-md", order.profit >= 0 ? "bg-emerald-500" : "bg-rose-500")}>
                    {order.profit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-900 truncate mt-2">{order.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{order.productName}</p>
              </div>
              
              <div className="flex-1 w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={order.data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} hide />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      content={({ active, payload }) => active && payload ? (
                        <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black tabular-nums border-none shadow-xl">
                          {formatNum(payload[0].value)} YER
                        </div>
                      ) : null} 
                    />
                    <Bar dataKey="amount" radius={[5, 5, 0, 0]} barSize={28}>
                      {order.data.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-none">TOTAL COST</span>
                  <span className="text-sm font-black text-slate-900 tabular-nums mt-1">{formatNum(order.total)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase leading-none">EST. PROFIT</span>
                  <span className={cn("text-sm font-black tabular-nums mt-1", order.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {formatNum(order.profit)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SYSTEM INTEGRITY NOTE */}
      <div className="p-4 bg-slate-900 text-white/40 rounded-2xl flex items-center justify-between gap-6 border border-slate-800 shadow-2xl mt-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner">
             <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold tracking-tight leading-relaxed max-w-2xl">
            {isRtl 
              ? 'تنويه: كافة الرسومات البيانية تعكس "البيانات الحقيقية" المستخرجة من السندات المرحلة رسمياً (مواد، أجور، مصاريف). الأرقام تُحدث لحظياً مع كل عملية ترحيل لضمان أعلى درجات النزاهة المالية والمخزنية.' 
              : 'Security Note: All visualizations reflect "Live Real Data" extracted from officially posted vouchers. Numerical values update instantly with each transaction for maximum audit integrity.'}
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
           <div className="flex items-center gap-3 text-[10px] font-black text-emerald-400 uppercase tracking-widest tabular-nums">
              <span>ERP ENGINE v2.5.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>TIA SYSTEM</span>
           </div>
           <span className="text-[8px] font-bold text-slate-600 uppercase">Proprietary Management Cluster</span>
        </div>
      </div>

    </div>
  );
}
