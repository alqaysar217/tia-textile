'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Factory, 
  PlayCircle, 
  Timer, 
  CheckCircle2, 
  FileText,
  AlertCircle,
  Filter,
  ArrowRight,
  TrendingUp,
  Boxes,
  Users,
  Layers,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const [search, setSearch] = useState('');

  // بيانات تجريبية تعكس واقع الـ 300 قطعة والمراحل المتعددة
  const orders = [
    {
      id: 'PO-2027-101',
      productAr: 'معوز ملكي فاخر',
      productEn: 'Premium Royal Maawiz',
      targetQty: 300,
      currentStageAr: 'مرحلة الخياطة',
      currentStageEn: 'Sewing Stage',
      completedTotal: 120, // إجمالي ما انتهى من كل المراحل
      wipInCurrentStage: 180, // ما يزال عند الخياطين
      progress: 40,
      status: 'active',
      priority: 'high',
      startDate: '2027-03-01'
    },
    {
      id: 'PO-2027-102',
      productAr: 'معوز حليسي كلاسيك',
      productEn: 'Classic Halisi Maawiz',
      targetQty: 150,
      currentStageAr: 'مرحلة التكريز (التطريز)',
      currentStageEn: 'Embroidery Stage',
      completedTotal: 45,
      wipInCurrentStage: 105,
      progress: 30,
      status: 'active',
      priority: 'normal',
      startDate: '2027-03-05'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Manufacturing'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'أوامر التشغيل' : 'Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تتبع أوامر الإنتاج والمراحل' : 'Production & Stage Tracking'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إنشاء أمر جديد' : 'Open New Order'}
            </Button>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'أوامر نشطة' : 'Active Orders'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">24</span>
              <PlayCircle className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'إجمالي الـ WIP' : 'Total WIP'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">1,420</span>
              <Timer className="w-4 h-4 text-amber-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px) font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'تم استلامه اليوم' : 'Daily Output'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-emerald-600 tabular-nums">85</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'تنبيهات تأخير' : 'Delays'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-rose-600 tabular-nums">3</span>
              <AlertCircle className="w-4 h-4 text-rose-500 mb-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-6 space-y-6 no-scrollbar">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Order Identity */}
                <div className="flex-none w-full lg:w-64 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded tabular-nums tracking-wider uppercase">
                      {order.id}
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {lang === 'ar' ? order.productAr : order.productEn}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {order.startDate}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      {lang === 'ar' ? '4 خياطين' : '4 Workers'}
                    </div>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        {lang === 'ar' ? 'المرحلة النشطة حالياً' : 'Active Stage'}
                      </p>
                      <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black border border-emerald-100 shadow-sm">
                        {lang === 'ar' ? order.currentStageAr : order.currentStageEn}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الإنجاز النهائي' : 'Final Completion'}</p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xl font-black text-slate-900 tabular-nums">{order.progress}%</span>
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <Progress value={order.progress} className="h-2.5 bg-slate-100" />
                    {/* Markers for stages could be added here */}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'Target'}</p>
                      <p className="text-sm font-black text-slate-700 tabular-nums">{order.targetQty}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-[9px] font-black text-amber-700/60 uppercase">{lang === 'ar' ? 'قيد العمل' : 'WIP'}</p>
                      <p className="text-sm font-black text-amber-700 tabular-nums">{order.wipInCurrentStage}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-700/60 uppercase">{lang === 'ar' ? 'مكتمل نهائي' : 'Finished'}</p>
                      <p className="text-sm font-black text-emerald-700 tabular-nums">{order.completedTotal}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex-none flex flex-row lg:flex-col gap-2 justify-center">
                  <Button variant="outline" className="flex-1 lg:w-40 h-10 rounded-xl font-black text-xs gap-2 border-slate-200 hover:bg-slate-50 transition-all">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'ar' ? 'عرض السندات' : 'Vouchers'}
                  </Button>
                  <Button className="flex-1 lg:w-40 h-10 premium-gradient rounded-xl font-black text-xs gap-2 border-none shadow-md shadow-emerald-900/10">
                    {lang === 'ar' ? 'إدارة المرحلة' : 'Process Stage'}
                    <ArrowRight className={cn("w-3.5 h-3.5", dir === 'rtl' && "rotate-180")} />
                  </Button>
                </div>

              </div>
            </div>

            {/* Stage Detail Tracker Footer */}
            <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {lang === 'ar' ? 'الخياطة: 180 قطعة' : 'Sewing: 180 pcs'}
              </div>
              <ChevronRight className={cn("w-3 h-3 text-slate-300", dir === 'rtl' && "rotate-180")} />
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                {lang === 'ar' ? 'التكريز: بانتظار الاستلام' : 'Embroidery: Waiting'}
              </div>
              <ChevronRight className={cn("w-3 h-3 text-slate-300", dir === 'rtl' && "rotate-180")} />
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                {lang === 'ar' ? 'الغسيل والكي' : 'Finishing'}
              </div>
              <div className="ms-auto">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-sm">
                  {lang === 'ar' ? 'آخر تحديث: منذ 12 دقيقة' : 'Last activity: 12m ago'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SYSTEM NOTES */}
      <div className="flex-none p-4 bg-slate-900 text-white/50 flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center"><AlertCircle className="w-4 h-4" /></div>
        <p className="text-[10px] font-medium leading-tight">
          {lang === 'ar' 
            ? 'تنبيه: يتم تحديث تكلفة القطعة آلياً عند إتمام كل مرحلة بناءً على المواد المصروفة وأجور العمال المسجلة في السندات.' 
            : 'Note: Unit cost is recalculated automatically upon stage completion based on issued materials and labor wages.'}
        </p>
      </div>

    </div>
  );
}
