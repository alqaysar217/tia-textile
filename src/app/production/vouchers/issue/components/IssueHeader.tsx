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
import { cn } from '@/lib/utils';

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
  canCreate: boolean;
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
  setIsAddDialogOpen,
  canCreate
}: IssueHeaderProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm transition-colors duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
            <FileInput className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>{isRtl ? 'المخازن' : 'WMS'}</span>
              <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
              <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'سندات الصرف' : 'Material Issues'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {isRtl ? 'صرف المواد الخام للإنتاج' : 'Material Issue Vouchers'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1 lg:w-64">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", dir === 'rtl' ? "right-3" : "left-3")} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              className={cn(
                dir === 'rtl' ? 'pr-10' : 'pl-10',
                "h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100"
              )}
            />
          </div>

          <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-200 dark:border-slate-700">
            <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent">
              <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {isRtl ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent">
                  <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {isRtl ? 'تصفية' : 'Filter'}
                  {(batchFilter !== 'all' || deptFilter !== 'all' || sortOrder !== 'desc') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب النتائج' : 'SORTING'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('date')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /> {isRtl ? 'حسب التاريخ' : 'By Date'}</div>
                  {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('voucherNumber')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /> {isRtl ? 'حسب رقم السند' : 'By Reference'}</div>
                  {sortBy === 'voucherNumber' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('totalAmount')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  <div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /> {isRtl ? 'حسب القيمة' : 'By Total'}</div>
                  {sortBy === 'totalAmount' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="dark:bg-slate-800" />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'تصفية حسب الدفعة' : 'FILTER BY BATCH'}</DropdownMenuLabel>
                <ScrollArea className="h-40">
                  <DropdownMenuItem onClick={() => setBatchFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                    {isRtl ? 'جميع الدفعات' : 'All Batches'}
                    {batchFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </DropdownMenuItem>
                  {activeOrders?.map(o => (
                    <DropdownMenuItem key={o.id} onClick={() => setBatchFilter(o.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                      <span className="truncate max-w-[150px]">{o.orderNumber} - {o.title}</span>
                      {batchFilter === o.id && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>

                <DropdownMenuSeparator className="dark:bg-slate-800" />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'حسب القسم' : 'BY DEPARTMENT'}</DropdownMenuLabel>
                {activeDepartments?.map(d => (
                  <DropdownMenuItem key={d.id} onClick={() => setDeptFilter(d.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                    {isRtl ? d.nameAr : d.nameEn}
                    {deptFilter === d.id && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {canCreate && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-9 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none text-[10px]">
              <Plus className="w-3.5 h-3.5" />
              {isRtl ? 'سند جديد' : 'New Issue'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
