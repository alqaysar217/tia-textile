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

export default function ProductionDashboard() {
  const stats = [
    { title: 'إجمالي أوامر الإنتاج', value: '142', change: '+12%', type: 'increase', icon: <Factory className="w-6 h-6" />, color: 'blue' },
    { title: 'أوامر الإنتاج النشطة', value: '28', change: '85% سعة', type: 'info', icon: <PlayCircle className="w-6 h-6" />, color: 'green' },
    { title: 'الإنتاج اليومي المقبول', value: '450', change: '+5% عن أمس', type: 'increase', icon: <CheckCircle2 className="w-6 h-6" />, color: 'emerald' },
    { title: 'الإنتاج تحت التشغيل', value: '1,240', change: 'متراكم', type: 'warning', icon: <Timer className="w-6 h-6" />, color: 'amber' },
    { title: 'المنتجات الجاهزة', value: '3,840', change: 'بانتظار الاستلام', type: 'info', icon: <Package className="w-6 h-6" />, color: 'indigo' },
    { title: 'المواد الخام (الأصناف)', value: '62', change: '8 أصناف منخفضة', type: 'danger', icon: <Box className="w-6 h-6" />, color: 'rose' },
    { title: 'العمال النشطون', value: '85', change: 'كامل الفريق', type: 'info', icon: <Users className="w-6 h-6" />, color: 'cyan' },
    { title: 'الأجور المستحقة', value: '420,000', change: 'ريال يمني', type: 'info', icon: <Wallet className="w-6 h-6" />, color: 'orange' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full w-fit">
            <TrendingUp className="w-3 h-3" />
            نظرة عامة على العمليات
          </div>
          <h1 className="text-3xl font-black text-gray-900">لوحة التحكم التنفيذية</h1>
          <p className="text-sm text-gray-500 font-medium">متابعة لحظية لسير الإنتاج في معامل الجمعية (بيانات توضيحية)</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button className="h-12 px-8 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20">
            <PlayCircle className="w-5 h-5" />
            أمر إنتاج جديد
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-2xl font-black gap-2 border-gray-200">
            <ClipboardList className="w-5 h-5" />
            التقارير اليومية
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
            <div>
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
            <div className="space-y-1">
              <h3 className="text-lg font-black">أحدث أوامر الإنتاج</h3>
              <p className="text-xs text-gray-400 font-bold">آخر 5 عمليات تم تحديثها اليوم</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-black text-primary gap-2" asChild>
              <Link href="/production/orders">عرض الكل <ExternalLink className="w-3 h-3" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="production-table-header">رقم الأمر</th>
                  <th className="production-table-header">المنتج</th>
                  <th className="production-table-header">الكمية</th>
                  <th className="production-table-header">الحالة</th>
                  <th className="production-table-header">المشرف</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'PO-2027-01', name: 'معوز ملكي فاخر', qty: '200', status: 'نشط', supervisor: 'محمد اليافعي' },
                  { id: 'PO-2027-02', name: 'معوز حليسي كلاسيك', qty: '150', status: 'بانتظار المواد', supervisor: 'سالم عبدالله' },
                  { id: 'PO-2027-03', name: 'معوز بيضاني ممتاز', qty: '100', status: 'مكتمل', supervisor: 'علي المفلحي' },
                  { id: 'PO-2027-04', name: 'شال يمني يدوي', qty: '80', status: 'نشط', supervisor: 'أحمد صالح' },
                  { id: 'PO-2027-05', name: 'معوز سلاطيني نخب أ', qty: '300', status: 'فحص الجودة', supervisor: 'خالد باحاج' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="production-table-cell text-primary font-black tabular-nums">{row.id}</td>
                    <td className="production-table-cell font-black">{row.name}</td>
                    <td className="production-table-cell tabular-nums">{row.qty} قطعة</td>
                    <td className="production-table-cell">
                      <span className={`status-badge ${
                        row.status === 'نشط' ? 'bg-emerald-50 text-emerald-600' :
                        row.status === 'مكتمل' ? 'bg-blue-50 text-blue-600' :
                        row.status === 'فحص الجودة' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {row.status}
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
          <div className="production-card space-y-6">
            <h3 className="text-lg font-black flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              تنبيهات المخزون
            </h3>
            <div className="space-y-4">
              {[
                { item: 'خيوط قطن (أخضر)', level: '12%', status: 'critical' },
                { item: 'خيوط حرير (ذهبي)', level: '24%', status: 'low' },
                { item: 'صبغة ملكية غامقة', level: '18%', status: 'low' },
              ].map((alert, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black">{alert.item}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">مخزون حرج</span>
                  </div>
                  <div className={`text-xs font-black tabular-nums ${alert.status === 'critical' ? 'text-rose-500' : 'text-amber-500'}`}>
                    {alert.level}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-black border-dashed border-gray-300">عرض كافة التنبيهات</Button>
          </div>

          <div className="production-card bg-primary text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-700">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black leading-tight">التزام بالجودة والأصالة</h3>
                <p className="text-xs text-white/60 font-medium">كل منتج يخرج من معاملنا هو سفير لتراثنا اليمني.</p>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">نصيحة اليوم</p>
                <p className="text-xs font-bold mt-1 leading-relaxed">تأكد من مطابقة نقوش المعوز الملكي للمواصفات الفنية المعتمدة قبل تسليم السند.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
