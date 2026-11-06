
'use client';

import React from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';

export default function ProductionDashboard() {
  const { lang, t } = useTranslation();

  const stats = [
    { title: t.production.stats.totalOrders, value: '142', change: '+12%', type: 'increase', icon: <Factory className="w-6 h-6" />, color: 'blue' },
    { title: t.production.stats.activeOrders, value: '28', change: '85% Capacity', type: 'info', icon: <PlayCircle className="w-6 h-6" />, color: 'green' },
    { title: t.production.stats.dailyProduction, value: '450', change: '+5%', type: 'increase', icon: <CheckCircle2 className="w-6 h-6" />, color: 'emerald' },
    { title: t.production.stats.wipCount, value: '1,240', change: 'Queued', type: 'warning', icon: <Timer className="w-6 h-6" />, color: 'amber' },
    { title: t.production.stats.readyProducts, value: '3,840', change: 'Pending Receipt', type: 'info', icon: <Package className="w-6 h-6" />, color: 'indigo' },
    { title: t.production.stats.rawMaterialsCount, value: '62', change: '8 Low Items', type: 'danger', icon: <Box className="w-6 h-6" />, color: 'rose' },
    { title: t.production.stats.activeWorkers, value: '85', change: 'Full Team', type: 'info', icon: <Users className="w-6 h-6" />, color: 'cyan' },
    { title: t.production.stats.pendingWages, value: '420,000', change: 'YER', type: 'info', icon: <Wallet className="w-6 h-6" />, color: 'orange' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1 text-right rtl:text-right ltr:text-left w-full">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full w-fit">
            <TrendingUp className="w-3 h-3" />
            {lang === 'ar' ? 'نظرة عامة على العمليات' : 'Operations Overview'}
          </div>
          <h1 className="text-3xl font-black text-gray-900">{t.production.dashboard}</h1>
          <p className="text-sm text-gray-500 font-medium">
            {lang === 'ar' ? 'متابعة لحظية لسير الإنتاج في معامل الجمعية' : 'Real-time monitoring of production in association workshops'}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button className="h-12 px-8 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20">
            <PlayCircle className="w-5 h-5" />
            {lang === 'ar' ? 'أمر إنتاج جديد' : 'New Order'}
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-2xl font-black gap-2 border-gray-200">
            <ClipboardList className="w-5 h-5" />
            {lang === 'ar' ? 'التقارير اليومية' : 'Daily Reports'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="production-card space-y-4 group">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl bg-gray-50 group-hover:bg-primary group-hover:text-white transition-all`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black tracking-tighter ${
                stat.type === 'increase' ? 'text-emerald-600' :
                stat.type === 'danger' ? 'text-rose-600' :
                stat.type === 'warning' ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {stat.type === 'increase' ? <ArrowUpRight className="w-3 h-3" /> : 
                 stat.type === 'danger' ? <ArrowDownRight className="w-3 h-3" /> : null}
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
        {/* Recent Activity Table */}
        <div className="lg:col-span-8 production-card !p-0 overflow-hidden flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <div className="space-y-1 text-right rtl:text-right ltr:text-left">
              <h3 className="text-lg font-black">{lang === 'ar' ? 'أحدث أوامر الإنتاج' : 'Recent Orders'}</h3>
              <p className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'آخر 5 عمليات تم تحديثها اليوم' : 'Last 5 updated today'}</p>
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
                  <th className="production-table-header">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="production-table-header">{lang === 'ar' ? 'المشرف' : 'Supervisor'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'PO-2027-01', name: 'معوز ملكي فاخر', qty: '200', status: 'نشط', statusEn: 'Active', supervisor: 'محمد اليافعي' },
                  { id: 'PO-2027-02', name: 'معوز حليسي كلاسيك', qty: '150', status: 'بانتظار المواد', statusEn: 'Waiting', supervisor: 'سالم عبدالله' },
                  { id: 'PO-2027-03', name: 'معوز بيضاني ممتاز', qty: '100', status: 'مكتمل', statusEn: 'Done', supervisor: 'علي المفلحي' },
                  { id: 'PO-2027-04', name: 'شال يمني يدوي', qty: '80', status: 'نشط', statusEn: 'Active', supervisor: 'أحمد صالح' },
                  { id: 'PO-2027-05', name: 'معوز سلاطيني نخب أ', qty: '300', status: 'فحص الجودة', statusEn: 'QC', supervisor: 'خالد باحاج' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="production-table-cell text-primary font-black tabular-nums">{row.id}</td>
                    <td className="production-table-cell font-black">{row.name}</td>
                    <td className="production-table-cell tabular-nums">{row.qty} {lang === 'ar' ? 'قطعة' : 'pcs'}</td>
                    <td className="production-table-cell">
                      <span className={`status-badge ${
                        row.status === 'نشط' ? 'bg-emerald-50 text-emerald-600' :
                        row.status === 'مكتمل' ? 'bg-blue-50 text-blue-600' :
                        row.status === 'فحص الجودة' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {lang === 'ar' ? row.status : row.statusEn}
                      </span>
                    </td>
                    <td className="production-table-cell text-gray-500">{row.supervisor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="production-card space-y-6 text-right rtl:text-right ltr:text-left">
            <h3 className="text-lg font-black flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              {lang === 'ar' ? 'تنبيهات المخزون' : 'Stock Alerts'}
            </h3>
            <div className="space-y-4">
              {[
                { itemAr: 'خيوط قطن (أخضر)', itemEn: 'Cotton (Green)', level: '12%', status: 'critical' },
                { itemAr: 'خيوط حرير (ذهبي)', itemEn: 'Silk (Gold)', level: '24%', status: 'low' },
                { itemAr: 'صبغة ملكية غامقة', itemEn: 'Dye (Dark Royal)', level: '18%', status: 'low' },
              ].map((alert, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black">{lang === 'ar' ? alert.itemAr : alert.itemEn}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {lang === 'ar' ? 'مخزون حرج' : 'Critical Stock'}
                    </span>
                  </div>
                  <div className={`text-xs font-black tabular-nums ${alert.status === 'critical' ? 'text-rose-500' : 'text-amber-500'}`}>
                    {alert.level}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="production-card bg-primary text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-700">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-4 text-right rtl:text-right ltr:text-left">
              <div className="space-y-1">
                <h3 className="text-lg font-black leading-tight">
                  {lang === 'ar' ? 'التزام بالجودة والأصالة' : 'Quality Commitment'}
                </h3>
                <p className="text-xs text-white/60 font-medium">
                  {lang === 'ar' ? 'كل منتج يخرج من معاملنا هو سفير لتراثنا.' : 'Every product is an ambassador of our heritage.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
