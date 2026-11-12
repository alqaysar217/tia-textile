'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Box, 
  FileDown, 
  Filter, 
  PlusCircle,
  Hash,
  Languages,
  Activity,
  Wallet,
  SortAsc,
  SortDesc,
  Check,
  History
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
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface MaterialsHeaderProps {
  lang: string;
  dir: string;
  search: string;
  setSearch: (v: string) => void;
  stats: any;
  loading: boolean;
  onExport: () => void;
  onAdd: () => void;
  onStockIn: () => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sortBy: string;
  toggleSort: (key: any) => void;
  sortOrder: 'asc' | 'desc';
  categories: any[];
  canCreate: boolean;
}

export function MaterialsHeader({
  lang, dir, search, setSearch, stats, loading, onExport, onAdd, onStockIn,
  categoryFilter, setCategoryFilter, statusFilter, setStatusFilter,
  sortBy, toggleSort, sortOrder, categories, canCreate
}: MaterialsHeaderProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm transition-colors duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>{isRtl ? 'المخازن' : 'WMS'}</span>
              <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
              <span className="text-slate-600 dark:text-slate-400">{isRtl ? 'سجل المواد' : 'Items Catalog'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
              {isRtl ? 'دليل المواد الخام والمستلزمات' : 'Raw Materials Master Data'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="px-3 py-1 text-center">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isRtl ? 'المواد' : 'Items'}</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{loading ? '..' : stats.totalCount}</p>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center" />
            <div className="px-3 py-1 text-center">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isRtl ? 'نقص مخزون' : 'Low Stock'}</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">{loading ? '..' : stats.lowStockCount}</p>
            </div>
          </div>
          
          {canCreate && (
            <>
              <Button onClick={onStockIn} variant="outline" className="h-10 px-6 border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg shadow-sm font-black gap-2 transition-all">
                <PlusCircle className="w-4 h-4" />
                {isRtl ? 'توريد كمية' : 'Stock In'}
              </Button>

              <Button onClick={onAdd} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
                <Plus className="w-4 h-4" />
                {isRtl ? 'إضافة مادة' : 'Add Material'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", dir === 'rtl' ? "right-3" : "left-3")} />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث بالكود أو اسم المادة...' : 'Quick catalog search...'}
            className={cn("h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-emerald-500/10 dark:text-slate-100", dir === 'rtl' ? "pr-10" : "pl-10")}
          />
        </div>

        {/* INTEGRATED TABS SWITCHER */}
        <TabsList className="flex h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-lg shadow-sm shrink-0">
          <TabsTrigger value="catalog" className="font-black text-[10px] uppercase px-4 h-7 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Box className="w-3 h-3 me-2" />
            {isRtl ? 'الأصناف' : 'Catalog'}
          </TabsTrigger>
          <TabsTrigger value="logs" className="font-black text-[10px] uppercase px-4 h-7 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <History className="w-3 h-3 me-2" />
            {isRtl ? 'السجل' : 'Log'}
          </TabsTrigger>
        </TabsList>
        
        <div className={cn("flex items-center gap-1.5 px-1.5 border-slate-200 dark:border-slate-700", isRtl ? "border-r" : "border-l")}>
          <Button onClick={onExport} variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {isRtl ? 'تصدير' : 'Export'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {isRtl ? 'تصفية' : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => toggleSort('code')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {isRtl ? 'الكود' : 'SKU'}</div>
                {sortBy === 'code' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('nameAr')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                <div className="flex items-center gap-2"><Languages className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {isRtl ? 'الاسم' : 'Name'}</div>
                {sortBy === 'nameAr' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('currentQty')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {isRtl ? 'الكمية' : 'Quantity'}</div>
                {sortBy === 'currentQty' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('price')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                <div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /> {isRtl ? 'السعر' : 'Price'}</div>
                {sortBy === 'price' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="dark:bg-slate-800" />
              <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'حسب الفئة' : 'CATEGORY'}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200">
                {isRtl ? 'الكل' : 'All'}
                {categoryFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </DropdownMenuItem>
              {categories.map(c => (
                <DropdownMenuItem key={c.value} onClick={() => setCategoryFilter(c.value)} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200">
                  {isRtl ? c.labelAr : c.labelEn}
                  {categoryFilter === c.value && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
