
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
  AlertCircle
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
  const { lang } = useTranslation();
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1 text-right rtl:text-right ltr:text-left w-full">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full w-fit">
            <Users className="w-3 h-3" />
            {lang === 'ar' ? 'إدارة الموارد البشرية' : 'HR Management'}
          </div>
          <h1 className="text-3xl font-black text-gray-900">
            {lang === 'ar' ? 'سجل الحرفيين والعمال' : 'Artisans & Workers Registry'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {lang === 'ar' ? 'إدارة بيانات العمال وتوزيعهم على أقسام الإنتاج' : 'Manage worker profiles and department assignments'}
          </p>
        </div>
        <Button className="h-12 px-8 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20">
          <UserPlus className="w-5 h-5" />
          {lang === 'ar' ? 'إضافة عامل جديد' : 'Add New Worker'}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-primary" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث باسم العامل أو الكود...' : 'Search worker name or ID...'}
            className="pr-12 h-12 bg-white border-gray-100 rounded-xl font-bold"
          />
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-xl font-black gap-2 border-gray-100 bg-white">
          <Filter className="w-4 h-4" />
          {lang === 'ar' ? 'تصفية حسب القسم' : 'Filter by Dept'}
        </Button>
      </div>

      {/* Workers Table */}
      <div className="production-card !p-0 overflow-hidden">
        <Table className="text-right rtl:text-right ltr:text-left">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="production-table-header">{lang === 'ar' ? 'العامل' : 'Worker'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'القسم' : 'Department'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'رقم الجوال' : 'Phone'}</TableHead>
              <TableHead className="production-table-header">{lang === 'ar' ? 'تاريخ الانضمام' : 'Joined Date'}</TableHead>
              <TableHead className="production-table-header text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="production-table-header w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((worker) => (
              <TableRow key={worker.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="production-table-cell">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-primary text-xs">
                      {worker.name.charAt(0)}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900">{worker.name}</span>
                      <span className="text-[10px] text-primary font-black tabular-nums">{worker.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="production-table-cell font-bold text-gray-600">
                  {worker.dept}
                </TableCell>
                <TableCell className="production-table-cell tabular-nums text-gray-500">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 opacity-30" />
                    {worker.phone}
                  </div>
                </TableCell>
                <TableCell className="production-table-cell tabular-nums text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 opacity-30" />
                    {worker.joined}
                  </div>
                </TableCell>
                <TableCell className="production-table-cell text-center">
                  <span className={`status-badge ${
                    worker.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {worker.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مجاز' : 'On Leave')}
                  </span>
                </TableCell>
                <TableCell className="production-table-cell">
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
  );
}
