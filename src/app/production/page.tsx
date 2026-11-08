
'use client';

import React, { useMemo } from 'react';
import { 
  Factory, 
  PlayCircle, 
  CheckCircle2, 
  Timer, 
  Package, 
  Box, 
  Users, 
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  ClipboardList,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';

export default function ProductionDashboard() {
  const { lang, t } = useTranslation();
  const db = useFirestore();

  // Real-time Data Fetching
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const workersQuery = useMemo(() => !db ? null : query(collection(db, 'workers'), where('status', '!=', 'deleted')), [db]);
  const recentOrdersQuery = useMemo(() => !db ? null : query(collection(db, 'productionOrders'), where('status', '!=', 'deleted'), limit(5)), [db]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: allMaterials, loading: materialsLoading } = useCollection<any>(materialsQuery);
  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: recentOrders } = useCollection<any>(recentOrdersQuery);

  const stats = useMemo(() => {
    if (!allOrders || !allMaterials || !allWorkers) return null;

    const active = allOrders.filter(o => o.status === 'active').length;
    const lowStock = allMaterials.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length;
    const supervisors = allWorkers.filter(w => w.isSupervisor && w.active).length;
    
    // Summing completed quantities for "Daily Production" (mocking daily by total for now)
    const totalCompleted = allOrders.reduce((acc, curr) => acc + (curr.completedQty || 0), 0);

    return [
      { title: t.production.stats.totalOrders, value: allOrders.length.toString(), change: '+', type: 'info', icon: <Factory className="w-6 h-6" /> },
      { title: t.production.stats.activeOrders, value: active.toString(), change: 'Live', type: 'increase', icon: <PlayCircle className="w-6 h-6" /> },
      { title: t.production.stats.dailyProduction, value: totalCompleted.toLocaleString(), change: 'Total', type: 'increase', icon: <CheckCircle2 className="w-6 h-6" /> },
      { title: t.production.stats.rawMaterialsCount, value: allMaterials.length.toString(), change: `${lowStock} Low`, type: lowStock > 0 ? 'danger' : 'info', icon: <Box className="w-6 h-6" /> },
      { title: t.production.stats.activeWorkers, value: allWorkers.filter(w => w.active).length.toString(), change: `${supervisors} Sups`, type: 'info', icon: <Users className="w-6 h-6" /> },
    ];
  }, [allOrders, allMaterials, allWorkers, t.production.stats]);

  if (ordersLoading || materialsLoading || workersLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth no-scrollbar">
      {/* Welcome & Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1 text-right rtl:text-right ltr:text-left w-full">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full w-fit">
            <TrendingUp className="w-3 h-3" />
            {lang === 'ar' ? 'نظرة عامة على العمليات الحقيقية' : 'Live Operations Overview'}
          </div>
          <h1 className="text-3xl font-black text-gray-900">{t.production.dashboard}</h1>
          <p className="text-sm text-gray-500 font-medium">
            {lang === 'ar' ? 'متابعة لحظية لسير الإنتاج بناءً على السندات الموثقة' : 'Real-time monitoring based on posted vouchers'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button className="h-12 px-8 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20" asChild>
            <Link href="/production/orders"><PlayCircle className="w-5 h-5" /> {lang === 'ar' ? 'أوامر الإنتاج' : 'Work Orders'}</Link>
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-2xl font-black gap-2 border-gray-200" asChild>
            <Link href="/production/vouchers/issue"><ClipboardList className="w-5 h-5" /> {lang === 'ar' ? 'سندات الصرف' : 'Issue Vouchers'}</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {stats?.map((stat, idx) => (
          <div key={idx} className="production-card space-y-4 group">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl bg-gray-50 group-hover:bg-primary group-hover:text-white transition-all`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black tracking-tighter ${
                stat.type === 'increase' ? 'text-emerald-600' :
                stat.type === 'danger' ? 'text-rose-600' :
                'text-gray-400'
              }`}>
                {stat.change}
              </div>
            </div>
            <div className="text-right rtl:text-right ltr:text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 tabular-nums">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders - Real Data */}
        <div className="lg:col-span-8 production-card !p-0 overflow-hidden flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <div className="space-y-1 text-right rtl:text-right ltr:text-left">
              <h3 className="text-lg font-black">{lang === 'ar' ? 'متابعة الأوامر النشطة' : 'Active Orders Track'}</h3>
              <p className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'عرض حالة الإنجاز الفعلية من واقع السندات' : 'Real progress from posted receipts'}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-black text-primary gap-2" asChild>
              <Link href="/production/orders">{lang === 'ar' ? 'عرض الكل' : 'View All'} <ExternalLink className="w-3 h-3" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left">
              <thead>
                <tr>
                  <th className="production-table-header">{lang === 'ar' ? 'رقم الأمر' : 'Order ID'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'الكمية المستهدفة' : 'Target'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'المنجز' : 'Done'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'نسبة الإنجاز' : 'Progress'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((order, i) => {
                  const progress = Math.round(((order.completedQty || 0) / (order.targetQty || 1)) * 100);
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="production-table-cell text-primary font-black tabular-nums">{order.orderNumber}</td>
                      <td className="production-table-cell tabular-nums font-bold text-slate-400">{order.targetQty}</td>
                      <td className="production-table-cell tabular-nums font-black text-emerald-600">{order.completedQty || 0}</td>
                      <td className="production-table-cell font-black">
                        <div className="flex items-center gap-2">
                           <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                              <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                           </div>
                           <span className="text-[10px] tabular-nums">{progress}%</span>
                        </div>
                      </td>
                      <td className="production-table-cell">
                        <span className={`status-badge ${
                          order.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {recentOrders?.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-300 font-bold">لا توجد أوامر مسجلة حالياً</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Alerts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="production-card space-y-6 text-right rtl:text-right ltr:text-left">
            <h3 className="text-lg font-black flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-500" />
              {lang === 'ar' ? 'تنبيهات المخزون الحرجة' : 'Critical Stock Alerts'}
            </h3>
            <div className="space-y-4">
              {allMaterials?.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).slice(0, 4).map((m, i) => (
                <div key={i} className="p-3 bg-rose-50/50 rounded-xl flex items-center justify-between border border-rose-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700">{m.nameAr}</span>
                    <span className="text-[9px] text-rose-600 font-black uppercase tracking-widest mt-0.5">
                      {lang === 'ar' ? `المتبقي: ${m.currentQty} ${m.unit}` : `Left: ${m.currentQty} ${m.unit}`}
                    </span>
                  </div>
                  <div className="p-1 bg-white rounded shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                </div>
              ))}
              {allMaterials?.filter(m => (m.currentQty || 0) <= (m.minQty || 0)).length === 0 && (
                <div className="text-center py-6">
                   <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المخزون في حالة ممتازة</p>
                </div>
              )}
            </div>
          </div>

          <div className="production-card bg-slate-900 text-white space-y-6 relative overflow-hidden group border-none">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-700">
              <ShieldCheck className="w-32 h-32 text-emerald-400" />
            </div>
            <div className="relative z-10 space-y-4 text-right rtl:text-right ltr:text-left">
              <h3 className="text-lg font-black leading-tight">
                {lang === 'ar' ? 'الرقابة والمحاسبة المالية' : 'Fiscal Accountability'}
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'النظام الآن يربط كل سند صرف باستحقاق مالي قادم. تأكد من مراجعة جودة الاستلام لضمان دقة كشوف الرواتب.' 
                  : 'Every issue voucher is now linked to a future wage entitlement. Ensure QC review on receipts for payroll accuracy.'}
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  بروتوكول الربط المالي نشط
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
