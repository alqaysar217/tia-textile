'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  FileInput, 
  FileDown, 
  Filter, 
  Calendar, 
  Hash, 
  Wallet, 
  SortAsc, 
  SortDesc, 
  ArrowUpDown, 
  Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IssueHeaderProps {
  lang: string;
  dir: string;
  search: string;
  setSearch: (val: string) => void;
  handleExportCSV: () => void;
  batchFilter: string;
  setBatchFilter: (val: string) => void;
  deptFilter: string;
  setDeptFilter: (val: string) => void;
  toggleSort: (field: 'voucherNumber' | 'date' | 'totalAmount') => void;
  sortBy: 'voucherNumber' | 'date' | 'totalAmount';
  sortOrder: 'asc' | 'desc';
  activeOrders: any[];
  activeDepartments: any[];
  setIsAddDialogOpen: (val: boolean) => void;
}

export function IssueHeader({
  lang,
  dir,
  search,
  setSearch,
  handleExportCSV,
  batchFilter,
  setBatchFilter,
  deptFilter,
  setDeptFilter,
  toggleSort,
  sortBy,
  sortOrder,
  activeOrders,
  activeDepartments,
  setIsAddDialogOpen
}: IssueHeaderProps) {
  return (
    <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
            <FileInput className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{lang === 'ar' ? 'المخازن' : 'WMS'}</span>
              <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
              <span className="text-emerald-600">{lang === 'ar' ? 'سندات الصرف' : 'Material Issues'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              {lang === 'ar' ? 'صرف المواد الخام للإنتاج' : 'Material Issue Vouchers'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث برقم السند أو العامل...' : 'Search by voucher or worker...'}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`}
            />
          </div>

          <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-100">
            <Button onClick={handleExportCSV} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-slate-50 border border-transparent">
              <FileDown className="w-4 h-4 text-emerald-600" />
              {lang === 'ar' ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-slate-50 border border-transparent">
                  <Filter className="w-4 h-4" />
                  {lang === 'ar' ? 'تصفية' : 'Filter'}
                  {(batchFilter !== 'all' || deptFilter !== 'all' || sortOrder !== 'desc') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'ترتيب النتائج' : 'SORTING'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('date')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'حسب التاريخ' : 'By Date'}</div>
                  {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('voucherNumber')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                  <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'حسب رقم السند' : 'By Reference'}</div>
                  {sortBy === 'voucherNumber' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('totalAmount')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                  <div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'حسب القيمة' : 'By Total'}</div>
                  {sortBy === 'totalAmount' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'تصفية حسب الدفعة' : 'FILTER BY BATCH'}</DropdownMenuLabel>
                <ScrollArea className="h-40">
                  <DropdownMenuItem onClick={() => setBatchFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                    {lang === 'ar' ? 'جميع الدفعات' : 'All Batches'}
                    {batchFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </DropdownMenuItem>
                  {activeOrders?.map(o => (
                    <DropdownMenuItem key={o.id} onClick={() => setBatchFilter(o.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                      <span className="truncate max-w-[180px]">{o.orderNumber} - {o.title}</span>
                      {batchFilter === o.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'حسب القسم' : 'BY DEPARTMENT'}</DropdownMenuLabel>
                {activeDepartments?.map(d => (
                  <DropdownMenuItem key={d.id} onClick={() => setDeptFilter(d.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                    {lang === 'ar' ? d.nameAr : d.nameEn}
                    {deptFilter === d.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
            <Plus className="w-4 h-4" />
            {lang === 'ar' ? 'سند جديد' : 'New Issue'}
          </Button>
        </div>
      </div>
    </div>
  );
}