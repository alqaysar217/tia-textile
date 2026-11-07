'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Calendar,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ChevronRight
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
import { Avatar } from '@/components/ui/avatar';

export default function WorkersPage() {
  const { lang, dir } = useTranslation();
  const [search, setSearch] = useState('');

  // Mock data for Phase 3
  const workers = [
    { id: 'WRK-001', name: 'سالم أحمد باحاج', dept: 'قسم الخياطة', phone: '777123456', joined: '2023-01-15', status: 'active' },
    { id: 'WRK-002', name: 'محمد علي اليافعي', dept: 'قسم التطريز', phone: '777987654', joined: '2023-05-10', status: 'active' },
    { id: 'WRK-003', name: 'عبدالله صالح', dept: 'قسم الخياطة', phone: '770111222', joined: '2024-02-20', status: 'on_leave' },
    { id: 'WRK-004', name: 'خالد باحاج', dept: 'قسم الصباغة', phone: '771333444', joined: '2022-11-05', status: 'active' },
    { id: 'WRK-005', name: 'سعيد المحضار', dept: 'فحص الجودة', phone: '777555666', joined: '2023-08-12', status: 'active' },
  ];

  const filtered = workers.filter(w => w.name.includes(search) || w.id.includes(search));

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      
      {/* 1. Header Hub */}
      <div className="flex-none px-4 md:px-8 pt-6 pb-4 bg-white border-b border-gray-200/60 shadow-sm z-30">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-1.5 h-10 bg-primary rounded-full hidden md:block" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                  <span>{lang === 'ar' ? 'الموارد البشرية' : 'HR'}</span>
                  <ChevronRight className={`w-2.5 h-2.5 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
                  <span className="text-primary">{lang === 'ar' ? 'سجل العمال' : 'Workers Registry'}</span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                  {lang === 'ar' ? 'قاعدة بيانات الحرفيين' : 'Artisans Database'}
                </h1>
              </div>
            </div>
            <Button className="h-10 px-6 bg-primary hover:bg-primary/95 text-white gap-2.5 rounded-xl shadow-lg shadow-primary/10 font-black transition-all">
              <UserPlus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة عامل جديد' : 'Add New'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-gray-50 border border-gray-200/60 p-2 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم العامل أو الكود...' : 'Search...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 bg-white border-gray-200 rounded-lg text-xs font-bold`}
              />
            </div>
            <Button variant="ghost" className="h-10 px-4 rounded-lg font-black text-xs gap-2 border border-dashed border-gray-200 text-gray-500 hover:text-primary">
              <Filter className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'تصفية حسب القسم' : 'Filter'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Scroll Area */}
      <div className="flex-1 min-h-0 px-4 md:px-8 py-6 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto relative">
            <Table className="text-right border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md">
                <TableRow className="border-b border-gray-200/60">
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'العامل' : 'Worker'}</TableHead>
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'القسم' : 'Department'}</TableHead>
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'رقم الجوال' : 'Phone'}</TableHead>
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableHead>
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center whitespace-nowrap">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="h-12 w-[80px] sticky right-0 bg-gray-50/95"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((worker) => (
                  <TableRow key={worker.id} className="group hover:bg-gray-50/30 transition-all border-b border-gray-100/60">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-primary text-[10px]">
                          {worker.name.charAt(0)}
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900">{worker.name}</span>
                          <span className="text-[10px] text-primary/60 font-black tabular-nums tracking-widest">{worker.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-bold text-gray-600 text-xs">
                      {worker.dept}
                    </TableCell>
                    <TableCell className="px-6 py-4 tabular-nums text-gray-500 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 opacity-30" />
                        {worker.phone}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 tabular-nums text-gray-500 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 opacity-30" />
                        {worker.joined}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        worker.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {worker.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مجاز' : 'On Leave')}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50/30">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
