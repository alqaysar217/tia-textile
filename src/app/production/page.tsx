'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  PieChart as PieChartIcon, 
  UserCheck,
  Package,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
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
  PieChart,
  Pie
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProduction } from './ProductionContext';

export default function ProductionDashboard() {
  const { lang, t, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isAdmin, permissions } = useProduction();

  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useDoc<any>(settingsRef);
  
  const isDarkMode = mounted && (savedSettings?.themeMode === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')));

  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const workersQuery = useMemo(() => !db ? null : query(collection(db, 'workers'), where('status', '!=', 'deleted')), [db]);
  const vouchersQuery = useMemo(() => !db ? null : collection(db, 'vouchers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const whQuery = useMemo(() => !db ? null : collection(db, 'finishedGoodsWarehouse'), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allMaterials, loading: materialsLoading } = useCollection<any>(materialsQuery);
  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: allVouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: whData, loading: whLoading } = useCollection<any>(whQuery);

  const loading = ordersLoading || materialsLoading || workersLoading || vouchersLoading || whLoading;

  const formatNum = (val: number | string) => {
    return Number(val).toLocaleString('en-US');
  };

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const stats = useMemo(() => {
    if (!allOrders || !allMaterials || !allWorkers || !allVouchers || !whData) return null;
    
    const active = allOrders.filter(o => o.status === 'active').length;
    const lowStock = allMaterials.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayProduction = allVouchers
      .filter(v => v.type === 'production_receipt' && v.date === todayStr && v.status !== 'deleted')
      .reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);

    const totalFinishedGoods = whData.reduce((acc, curr) => acc + (curr.totalQty || 0), 0);

    return [
      { title: t.production.stats.totalOrders, value: allOrders.length, change: 'Orders', type: 'info', icon: <Factory className="w-4 h-4" />, gradient: 'from-blue-600 to-blue-400' },
      { title: t.production.stats.activeOrders, value: active, change: 'Live', type: 'increase', icon: <PlayCircle className="w-4 h-4" />, gradient: 'from-emerald-600 to-emerald-400' },
      { title: t.production.stats.dailyProduction, value: todayProduction, change: 'Today', type: 'increase', icon: <Activity className="w-4 h-4" />, gradient: 'from-violet-600 to-violet-400' },
      { title: t.production.stats.readyProducts, value: totalFinishedGoods, change: 'In Stock', type: 'increase', icon: <Package className="w-4 h-4" />, gradient: 'from-emerald-800 to-emerald-600' },
      { title: t.production.stats.rawMaterialsCount, value: allMaterials.length, change: `${lowStock} Low`, type: lowStock > 0 ? 'danger' : 'info', icon: <Box className="w-4 h-4" />, gradient: 'from-amber-600 to-amber-400' },
    ];
  }, [allOrders, allMaterials, allWorkers, allVouchers, whData, t.production.stats]);

  const growthChartData = useMemo(() => {
    if (!allVouchers) return [];
    const receipts = allVouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted');
    
    const months: Record<string, number> = {};
    const now = new Date();
    
    // توليد مفاتيح لآخر 6 أشهر لضمان دقة الرسم
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    // تجميع الكميات من السندات الحقيقية
    receipts.forEach(v => {
      if (v.date) {
        const dateKey = v.date.slice(0, 7); // YYYY-MM
        if (months[dateKey] !== undefined) {
          months[dateKey] += (Number(v.qtyAccepted) || 0);
        }
      }
    });

    return Object.entries(months).map(([name, qty]) => ({ name, qty }));
  }, [allVouchers]);

  const laborByOrder = useMemo(() => {
    if (!allVouchers || !allWorkers || !allOrders) return [];
    const receipts = allVouchers.filter(v => v.type === 'production_receipt' && v.status !== 'deleted');
    
    return allOrders.filter(o => o.status === 'active').map(order => {
      const orderReceipts = receipts.filter(r => r.orderId === order.id);
      const workersData = orderReceipts.reduce((acc: any[], curr: any) => {
        const worker = allWorkers.find(w => w.id === curr.workerId);
        if (!worker) return acc;
        const existing = acc.find(a => a.workerId === worker.id);
        if (existing) {
          existing.qty += (curr.qtyAccepted || 0);
        } else {
          acc.push({ 
            workerId: worker.id, 
            name: worker.fullName.split(' ')[0], 
            fullName: worker.fullName,
            qty: (curr.qtyAccepted || 0),
            dept: allDepartments?.find(d => d.id === worker.departmentId)?.nameAr || '---'
          });
        }
        return acc;
      }, []).sort((a, b) => b.qty - a.qty).slice(0, 5);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTitle: order.title,
        workers: workersData
      };
    }).filter(o => o.workers.length > 0);
  }, [allVouchers, allWorkers, allOrders, allDepartments]);

  const orderCostBreakdown = useMemo(() => {
    if (!allOrders || !allVouchers || !allProducts) return [];
    
    return allOrders.filter(o => o.status === 'active').map(order => {
      const product = allProducts.find(p => p.id === order.productId);
      const vouchers = allVouchers.filter(v => v.orderId === order.id && v.status !== 'deleted');
      
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
        materialCost,
        laborCost,
        overheadCost,
        data: [
          { name: isRtl ? 'مواد' : 'Materials', value: materialCost, fill: '#F59E0B' }, 
          { name: isRtl ? 'أجور' : 'Wages', value: laborCost, fill: '#8B5CF6' }, 
          { name: isRtl ? 'مصاريف' : 'Expenses', value: overheadCost, fill: '#EF4444' }
        ].filter(d => d.value > 0)
      };
    });
  }, [allOrders, allVouchers, allProducts, isRtl]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
           <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 no-scrollbar">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-0.5">
           <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-emerald-400 shadow-md"><Sparkles className="w-5 h-5" /></div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.production.dashboard}</h1>
           </div>
           <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold ps-9">
             {isRtl ? 'الرقابة المباشرة على جودة الإنتاج وهيكل التكاليف.' : 'Real-time oversight of production quality and cost structure.'}
           </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <ShieldCheck className="w-4 h-4 text-emerald-500" />
           <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Secure ERP Session</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats?.map((stat, idx) => (
          <Card key={idx} className="p-4 border-none shadow-lg bg-white dark:bg-slate-900 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
            <div className={cn("absolute top-0 right-0 w-20 h-20 bg-gradient-to-br opacity-5 rounded-full -mr-6 -mt-6 group-hover:scale-150 transition-transform", stat.gradient)} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white shadow-md", stat.gradient)}>{stat.icon}</div>
              <Badge className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-[8px] border-none px-1.5">{stat.change}</Badge>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{stat.title}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{formatNum(stat.value)}</h3>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              {isRtl ? 'منحنى نمو الإنتاج الشهري' : 'Production Growth Pulse'}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ps-4 uppercase tracking-widest">{isRtl ? 'إجمالي القطع الجاهزة النهائية بناءً على سندات الاستلام' : 'Completed pieces stats from real vouchers'}</p>
          </div>
          <div className="flex items-center gap-2">
             <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 cursor-help"><Info className="w-5 h-5" /></div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[10px] font-bold p-3 dark:bg-slate-800">
                    {isRtl 
                      ? 'لاختبار المنحنى: قم بإضافة "سندات استلام" لشهور سابقة. سيقوم النظام تلقائياً بتجميعها هنا لرسم خط الإنتاج التاريخي.' 
                      : 'To test: Add "Production Receipts" for past months. The system will auto-aggregate them to plot the trend line.'}
                  </TooltipContent>
                </UITooltip>
             </TooltipProvider>
             <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthChartData}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" x1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#10b981', fontWeight: 900, fontSize: '11px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '9px', marginBottom: '3px' }}
              />
              <Area type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={3} fill="url(#colorGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-violet-600 rounded-md text-white"><UserCheck className="w-4 h-4" /></div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{isRtl ? 'تحليل إنتاجية الحرفيين حسب الدفعة' : 'Artisan Performance'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {laborByOrder.map((orderData, idx) => (
            <Card key={idx} className="p-5 border-none shadow-lg bg-white dark:bg-slate-900 rounded-2xl flex flex-col h-[320px] hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <div className="flex flex-col">
                   <Badge variant="outline" className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 tabular-nums w-fit mb-0.5">{orderData.orderNumber}</Badge>
                   <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[150px]">{orderData.orderTitle}</span>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 block uppercase">OUTPUT</span>
                   <span className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums">{formatNum(orderData.workers.reduce((s:number, w:any) => s+w.qty, 0))}</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderData.workers} layout="vertical" margin={{ left: -15, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={70} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }} 
                      content={({ active, payload }) => active && payload ? (
                        <div className="bg-slate-900 text-white p-2 rounded-lg shadow-xl border-none text-[10px] font-black">
                          {payload[0].payload.fullName}
                          <div className="text-slate-400 text-[8px] mt-0.5">{payload[0].payload.dept}</div>
                          <div className="mt-1 text-emerald-400">{formatNum(payload[0].value)} {isRtl ? 'قطعة' : 'Pcs'}</div>
                        </div>
                      ) : null} 
                    />
                    <Bar dataKey="qty" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={12}>
                       {orderData.workers.map((entry:any, index:number) => (
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

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500 rounded-md text-white"><PieChartIcon className="w-4 h-4" /></div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{isRtl ? 'تحليل هيكل التكاليف للأوامر النشطة' : 'Real-time Cost Architecture'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orderCostBreakdown.map((order, idx) => (
            <Card key={idx} className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-[1.5rem] flex flex-col h-[440px] hover:shadow-xl transition-all overflow-hidden">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex flex-col gap-0.5 border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 tabular-nums bg-emerald-50 dark:bg-emerald-900/20">{order.orderNumber}</Badge>
                    <div className={cn("p-1 rounded-md text-white shadow-sm", order.profit >= 0 ? "bg-emerald-500" : "bg-rose-500")}>
                      {order.profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate mt-1">{order.title}</h4>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{order.productName}</p>
                </div>
                
                <div className="flex-1 w-full flex flex-col items-center justify-center">
                  <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={order.data}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={0}
                          minAngle={15}
                          dataKey="value"
                          animationDuration={1200}
                          stroke="none"
                        >
                          {order.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full mt-4">
                     {order.data.map((item, i) => (
                       <div key={i} className="flex flex-col items-center text-center gap-0.5">
                          <div className="flex items-center gap-1.5">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                             <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{item.name}</span>
                          </div>
                          <div className="flex flex-col leading-none">
                             <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(item.value)}</span>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-4 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">TOTAL COST</span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">EST. PROFIT</span>
                  <span className={cn("text-base font-black tabular-nums", order.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(order.profit)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-900 dark:bg-slate-900/50 text-white/40 rounded-xl flex items-center justify-between gap-4 border border-slate-800 shadow-xl mt-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 shadow-inner">
             <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold tracking-tight leading-relaxed max-w-xl">
            {isRtl 
              ? 'تنويه: كافة الرسومات البيانية تعكس البيانات الحقيقية من واقع السندات المعتمدة (مواد، أجور، مصاريف).' 
              : 'Audit Note: All visualizations reflect live data from officially posted vouchers.'}
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end">
           <div className="flex items-center gap-2 text-[8px] font-black text-emerald-400 uppercase tracking-widest tabular-nums">
              <span>TIA ERP v2.5</span>
           </div>
        </div>
      </div>

    </div>
  );
}

// استيراد أدوات التلميح الإضافية لتحسين تجربة الاختبار للمدير
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
