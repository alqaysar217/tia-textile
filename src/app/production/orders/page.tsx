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
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { Progress } from '@/components/ui/progress';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const [search, setSearch] = useState('');

  // بيانات توضيحية تعكس الهيكل الجديد للطلبيات متعددة المراحل
  const orders = [
    {
      id: 'PO-2027-101',
      product: 'معوز ملكي فاخر',
      targetQty: 300,
      currentStage: 'الخياطة',
      completedInStage: 120,
      totalProgress: 40,
      status: 'active',
      startDate: '2027-03-01',
      priority: 'high'
    },
    {
      id: 'PO-2027-102',
      product: 'معوز حليسي كلاسيك',
      targetQty: 150,
      currentStage: 'التكريز',
      completedInStage: 45,
      totalProgress: 15,
      status: 'pending_materials',
      startDate: '2027-03-05',
      priority: 'normal'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Manufacturing'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'أوامر التشغيل' : 'Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'إدارة أوامر الإنتاج' : 'Production Management'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'أمر إنتاج جديد' : 'New Order'}
            </Button>
          </div>
        </div>

        {/* METRICS QUICK VIEW */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><PlayCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'نشط حالياً' : 'Active'}</p>
              <p className="text-lg font-black text-slate-700 tabular-nums">28</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Timer className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'تحت التشغيل' : 'WIP'}</p>
              <p className="text-lg font-black text-slate-700 tabular-nums">1,240</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Boxes className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'بانتظار الفرز' : 'Pending'}</p>
              <p className="text-lg font-black text-slate-700 tabular-nums">8</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'متأخر' : 'Delayed'}</p>
              <p className="text-lg font-black text-slate-700 tabular-nums">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-6 space-y-4 no-scrollbar">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Order ID & Status */}
              <div className="flex-none w-full md:w-48 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 tabular-nums tracking-wider uppercase">{order.id}</span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <h3 className="text-base font-black text-slate-900 leading-tight">{order.product}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'ar' ? 'تاريخ البدء' : 'Started'}: {order.startDate}</p>
              </div>

              {/* Progress & Current Stage */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      {lang === 'ar' ? 'المرحلة الحالية' : 'Current Stage'}
                    </p>
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black">
                      {order.currentStage}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الإنجاز الكلي' : 'Overall'}</span>
                    <p className="text-sm font-black text-slate-900 tabular-nums">{order.totalProgress}%</p>
                  </div>
                </div>
                <Progress value={order.totalProgress} className="h-2 bg-slate-100" />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span className="tabular-nums">0 {lang === 'ar' ? 'قطعة' : 'pcs'}</span>
                  <span className="text-slate-600 font-black tabular-nums">{order.completedInStage} / {order.targetQty} {lang === 'ar' ? 'مكتملة' : 'done'}</span>
                  <span className="tabular-nums">{order.targetQty} {lang === 'ar' ? 'المستهدف' : 'target'}</span>
                </div>
              </div>

              {/* Actions Area */}
              <div className="flex-none w-full md:w-auto flex md:flex-col gap-2">
                <Button variant="outline" className="flex-1 h-10 rounded-xl font-black text-xs gap-2 border-slate-200">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? 'تفاصيل السندات' : 'Vouchers'}
                </Button>
                <Button className="flex-1 h-10 premium-gradient rounded-xl font-black text-xs gap-2 border-none">
                  {lang === 'ar' ? 'إدارة المرحلة' : 'Manage Stage'}
                  <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Expanded Brief Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <Users className="w-3.5 h-3.5 opacity-40" />
                  {lang === 'ar' ? 'العمال المخصصين: 4' : 'Assigned Workers: 4'}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <Boxes className="w-3.5 h-3.5 opacity-40" />
                  {lang === 'ar' ? 'المواد المصروفة: 125 كجم' : 'Materials Issued: 125kg'}
                </div>
              </div>
              <div className="text-[10px] font-black uppercase text-emerald-700 tracking-tighter">
                {lang === 'ar' ? 'آخر تحديث: قبل 12 دقيقة' : 'Last activity: 12m ago'}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}