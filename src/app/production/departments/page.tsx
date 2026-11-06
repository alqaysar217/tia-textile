'use client';

import React, { useState } from 'react';
import { 
  Factory, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers,
  MoreVertical,
  CheckCircle2,
  Filter,
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function DepartmentsPage() {
  const { lang } = useTranslation();
  const [search, setSearch] = useState('');

  const departments = [
    { id: '1', nameAr: 'قسم الخياطة', nameEn: 'Sewing Department', descAr: 'خياطة المعاوز وتجهيز الأطراف', workers: 25, active: true, code: 'DEPT-SEW' },
    { id: '2', nameAr: 'قسم التطريز', nameEn: 'Embroidery Department', descAr: 'إضافة النقوش الملكية واليدوية', workers: 15, active: true, code: 'DEPT-EMB' },
    { id: '3', nameAr: 'قسم الصباغة', nameEn: 'Dyeing Department', descAr: 'تلوين الخيوط ومعالجة الألوان', workers: 8, active: true, code: 'DEPT-DYE' },
    { id: '4', nameAr: 'قسم الفحص والجودة', nameEn: 'Quality Control', descAr: 'المراجعة النهائية قبل التغليف', workers: 5, active: true, code: 'DEPT-QC' },
    { id: '5', nameAr: 'قسم الغسيل والكي', nameEn: 'Washing & Ironing', descAr: 'تجهيز المنتج النهائي', workers: 10, active: false, code: 'DEPT-FIN' },
  ];

  const filtered = departments.filter(d => 
    d.nameAr.includes(search) || d.nameEn.toLowerCase().includes(search.toLowerCase()) || d.code.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
            <Layers className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'تنظيم المصنع' : 'Factory Organization'}
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {lang === 'ar' ? 'أقسام ومراحل الإنتاج' : 'Production Departments'}
          </h1>
          <p className="text-xs text-gray-400 font-bold">
            {lang === 'ar' ? 'إدارة مراكز التكلفة ومراحل العمل التسلسلية' : 'Manage cost centers and sequential workflow stages'}
          </p>
        </div>
        <Button className="btn-production bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          {lang === 'ar' ? 'إضافة قسم جديد' : 'New Department'}
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="production-card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary border border-primary/10">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'الأقسام النشطة' : 'Active'}</p>
            <p className="text-lg font-black tabular-nums">4 / 5</p>
          </div>
        </div>
        <div className="production-card !p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary border border-secondary/10">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي العمال' : 'Total Workers'}</p>
            <p className="text-lg font-black tabular-nums">63</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 border border-gray-200/60 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث باسم القسم أو الكود...' : 'Search by name or code...'}
            className="pr-10 h-11 bg-gray-50/50 border-gray-200 rounded-lg text-sm font-bold focus:bg-white"
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-lg font-bold gap-2 border-gray-200 text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          {lang === 'ar' ? 'تصفية' : 'Filter'}
        </Button>
      </div>

      {/* Main Data Table */}
      <div className="production-card !p-0 overflow-hidden border-gray-200/60">
        <Table className="text-right">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="production-table-header w-[100px]">{lang === 'ar' ? 'الكود' : 'Code'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'القسم' : 'Department'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'وصف العملية' : 'Process Description'}</TableHead>
              <TableHead className="production-table-header text-center">{lang === 'ar' ? 'القوى العاملة' : 'Workforce'}</TableHead>
              <TableHead className="production-table-header text-center">{lang === 'ar' ? 'الحالة التشغيلية' : 'Status'}</TableHead>
              <TableHead className="production-table-header w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((dept) => (
              <TableRow key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="production-table-cell font-black text-primary/70 text-xs tabular-nums">
                  {dept.code}
                </TableCell>
                <TableCell className="production-table-cell">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900">{lang === 'ar' ? dept.nameAr : dept.nameEn}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{lang === 'ar' ? dept.nameEn : dept.nameAr}</span>
                  </div>
                </TableCell>
                <TableCell className="production-table-cell text-gray-500 max-w-[250px] truncate text-xs font-bold">
                  {lang === 'ar' ? dept.descAr : 'No description'}
                </TableCell>
                <TableCell className="production-table-cell text-center">
                  <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                    <span className="text-xs font-black tabular-nums text-gray-700">{dept.workers}</span>
                  </div>
                </TableCell>
                <TableCell className="production-table-cell text-center">
                  <span className={`status-badge ${dept.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full me-2 ${dept.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {dept.active ? (lang === 'ar' ? 'نشط تشغيلياً' : 'Active') : (lang === 'ar' ? 'متوقف حالياً' : 'Inactive')}
                  </span>
                </TableCell>
                <TableCell className="production-table-cell">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-gray-200 shadow-xl min-w-[160px]">
                      <DropdownMenuItem className="gap-3 font-bold text-xs py-2.5 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Details'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-3 font-bold text-xs py-2.5 cursor-pointer">
                        <ArrowLeftRight className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل العمال' : 'Transfer Workers'}
                      </DropdownMenuItem>
                      <div className="h-px bg-gray-100 my-1" />
                      <DropdownMenuItem className="gap-3 font-bold text-xs py-2.5 cursor-pointer text-rose-600 focus:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'حذف القسم' : 'Delete Dept'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Info Section */}
      <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-4 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
          <Factory className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">{lang === 'ar' ? 'دليل مراحل العمل' : 'Workflow Guide'}</p>
          <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
            {lang === 'ar' 
              ? 'تستخدم هذه الأقسام كمراكز تكلفة في النظام. أي تغيير في حالة القسم سيؤثر على إمكانية إسناد أوامر الإنتاج الجديدة إليه. يرجى مراجعة حالة "الغسيل والكي" قبل البدء في المرحلة القادمة.' 
              : 'These departments serve as cost centers. Changing a status affects new order assignments. Please review "Washing & Ironing" before starting the next phase.'}
          </p>
        </div>
      </div>
    </div>
  );
}
