
'use client';

import React, { useState } from 'react';
import { 
  Factory, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  Layers
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

  // Mock data for initial Phase 3 setup
  const departments = [
    { id: '1', nameAr: 'قسم الخياطة', nameEn: 'Sewing Department', descAr: 'خياطة المعاوز وتجهيز الأطراف', workers: 25, active: true },
    { id: '2', nameAr: 'قسم التطريز', nameEn: 'Embroidery Department', descAr: 'إضافة النقوش الملكية واليدوية', workers: 15, active: true },
    { id: '3', nameAr: 'قسم الصباغة', nameEn: 'Dyeing Department', descAr: 'تلوين الخيوط ومعالجة الألوان', workers: 8, active: true },
    { id: '4', nameAr: 'قسم الفحص والجودة', nameEn: 'Quality Control', descAr: 'المراجعة النهائية قبل التغليف', workers: 5, active: true },
    { id: '5', nameAr: 'قسم الغسيل والكي', nameEn: 'Washing & Ironing', descAr: 'تجهيز المنتج النهائي', workers: 10, active: false },
  ];

  const filtered = departments.filter(d => 
    d.nameAr.includes(search) || d.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1 text-right rtl:text-right ltr:text-left w-full">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full w-fit">
            <Layers className="w-3 h-3" />
            {lang === 'ar' ? 'إدارة مراكز التكلفة' : 'Cost Centers Management'}
          </div>
          <h1 className="text-3xl font-black text-gray-900">
            {lang === 'ar' ? 'أقسام ومراحل الإنتاج' : 'Production Departments'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {lang === 'ar' ? 'تهيئة أقسام المصنع ومراحل العمل التسلسلية' : 'Configure factory departments and workflow stages'}
          </p>
        </div>
        <Button className="h-12 px-8 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          {lang === 'ar' ? 'إضافة قسم جديد' : 'New Department'}
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="production-card !p-4">
        <div className="relative max-w-md group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary transition-colors" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن قسم...' : 'Search departments...'}
            className="pr-12 h-12 bg-gray-50/50 border-gray-100 focus:bg-white rounded-xl text-sm font-bold"
          />
        </div>
      </div>

      {/* Departments Table */}
      <div className="production-card !p-0 overflow-hidden">
        <Table className="text-right rtl:text-right ltr:text-left">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="production-table-header w-[80px]">{lang === 'ar' ? 'م' : 'ID'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'اسم القسم' : 'Department Name'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'الوصف' : 'Description'}</TableHead>
              <TableHead className="production-table-header text-center">{lang === 'ar' ? 'عدد العمال' : 'Workers'}</TableHead>
              <TableHead className="production-table-header text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="production-table-header w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((dept, i) => (
              <TableRow key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="production-table-cell tabular-nums text-gray-400">{i + 1}</TableCell>
                <TableCell className="production-table-cell">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900">{lang === 'ar' ? dept.nameAr : dept.nameEn}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{lang === 'ar' ? dept.nameEn : dept.nameAr}</span>
                  </div>
                </TableCell>
                <TableCell className="production-table-cell text-gray-500 max-w-[300px] truncate">
                  {lang === 'ar' ? dept.descAr : 'No description provided'}
                </TableCell>
                <TableCell className="production-table-cell text-center font-black tabular-nums">
                  <Badge variant="outline" className="rounded-lg px-3 py-1 border-gray-100 text-primary">
                    {dept.workers}
                  </Badge>
                </TableCell>
                <TableCell className="production-table-cell text-center">
                  <span className={`status-badge ${dept.active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {dept.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'متوقف' : 'Inactive')}
                  </span>
                </TableCell>
                <TableCell className="production-table-cell">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={lang === 'ar' ? 'end' : 'start'} className="rounded-xl border-gray-100">
                      <DropdownMenuItem className="gap-2 font-bold text-xs py-2.5">
                        <Edit2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Details'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 font-bold text-xs py-2.5 text-rose-500 focus:text-rose-600">
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

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="production-card bg-primary/5 border-primary/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{lang === 'ar' ? 'الأقسام النشطة' : 'Active Units'}</p>
            <p className="text-xl font-black text-primary tabular-nums">4 / 5</p>
          </div>
        </div>
      </div>
    </div>
  );
}
