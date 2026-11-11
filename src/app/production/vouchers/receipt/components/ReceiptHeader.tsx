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
}

export function ReceiptHeader({
  lang, dir, search, setSearch, batchFilter, setBatchFilter, 
  sortBy, setSortBy, sortOrder, setSortOrder, activeOrders, onAdd, onExport
}: ReceiptHeaderProps) {
  const isRtl = lang === 'ar';

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><FileOutput className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{isRtl ? 'الإنتاج' : 'Production'}</span>
              <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
              <span className="text-emerald-600">{isRtl ? 'استلام وتسوية' : 'Settlement'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'إدارة سندات استلام المنجز' : 'Production Receipts'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={isRtl ? 'بحث...' : 'Search...'} 
              className={cn("h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold", isRtl ? "pr-10" : "pl-10")} 
            />
          </div>

          <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-100">
            <Button onClick={onExport} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-slate-50 border border-transparent">
              <FileDown className="w-4 h-4 text-emerald-600" />
              {isRtl ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-slate-50 border border-transparent">
                  <Filter className="w-4 h-4" />
                  {isRtl ? 'تصفية' : 'Filter'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'ترتيب النتائج' : 'SORTING'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('date')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {isRtl ? 'حسب التاريخ' : 'By Date'}</div>
                  {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('voucherNumber')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                  <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400" /> {isRtl ? 'حسب رقم السند' : 'By Reference'}</div>
                  {sortBy === 'voucherNumber' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'تصفية حسب الدفعة' : 'FILTER BY BATCH'}</DropdownMenuLabel>
                <ScrollArea className="h-40">
                  <DropdownMenuItem onClick={() => setBatchFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                    {isRtl ? 'جميع الدفعات' : 'All Batches'}
                    {batchFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </DropdownMenuItem>
                  {activeOrders?.map(o => (
                    <DropdownMenuItem key={o.id} onClick={() => setBatchFilter(o.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                      <span className="truncate max-w-[150px]">{o.orderNumber} - {o.title}</span>
                      {batchFilter === o.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button onClick={onAdd} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
            <Plus className="w-4 h-4" /> {isRtl ? 'استلام جديد' : 'New Receipt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
