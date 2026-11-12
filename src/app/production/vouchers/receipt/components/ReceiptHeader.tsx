'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  FileOutput, 
  FileDown, 
  Filter, 
  Calendar, 
  Hash, 
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

interface ReceiptHeaderProps {
  lang: string;
  dir: string;
  search: string;
  setSearch: (v: string) => void;
  batchFilter: string;
  setBatchFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: any) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  activeOrders: any[];
  onAdd: () => void;
  onExport: () => void;
  canCreate: boolean;
}

export function ReceiptHeader({
  lang, dir, search, setSearch, batchFilter, setBatchFilter, 
  sortBy, setSortBy, sortOrder, setSortOrder, activeOrders, onAdd, onExport, canCreate
}: ReceiptHeaderProps) {
  const isRtl = lang === 'ar';

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm transition-colors duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg"><FileOutput className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>{isRtl ? 'الإنتاج' : 'Production'}</span>
              <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
              <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'استلام وتسوية' : 'Settlement'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">{isRtl ? 'إدارة سندات استلام المنجز' : 'Production Receipts'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1 lg:w-64">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={isRtl ? 'بحث...' : 'Search...'} 
              className={cn("h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100", isRtl ? "pr-10" : "pl-10")} 
            />
          </div>

          <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-200 dark:border-slate-700">
            <Button onClick={onExport} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent">
              <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {isRtl ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent">
                  <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {isRtl ? 'تصفية' : 'Filter'}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {canCreate && (
            <Button onClick={onAdd} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {isRtl ? 'استلام جديد' : 'New Receipt'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
