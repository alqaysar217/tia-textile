'use client';

import React from 'react';
import { RefreshCcw, ChevronRight, Search, CalendarDays, Filter, Check, SortAsc, SortDesc, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ReturnHeaderProps {
  lang: string;
  dir: string;
  activeTab: 'pending' | 'verified';
  setActiveTab: (t: 'pending' | 'verified') => void;
  search: string;
  setSearch: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  workerFilter: string;
  setWorkerFilter: (v: string) => void;
  orderFilter: string;
  setOrderFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: any) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  allWorkers: any[];
  allOrders: any[];
  onExport: () => void;
}

export function ReturnHeader({
  lang, dir, activeTab, setActiveTab, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo,
  workerFilter, setWorkerFilter, orderFilter, setOrderFilter, sortBy, setSortBy, sortOrder, setSortOrder,
  allWorkers, allOrders, onExport
}: ReturnHeaderProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><RefreshCcw className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>WMS</span><ChevronRight className="w-3 h-3" /><span>{isRtl ? 'توريد المرتجعات' : 'Returns'}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900">{isRtl ? 'توثيق دخول المرتجعات' : 'Return Audit'}</h1>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full lg:w-auto">
           <div className="flex bg-white p-1 rounded-lg border border-slate-200 w-full md:w-auto">
              <button onClick={() => setActiveTab('pending')} className={cn("flex-1 md:flex-none px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", activeTab === 'pending' ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                {isRtl ? 'بانتظار التوثيق' : 'PENDING'}
              </button>
              <button onClick={() => setActiveTab('verified')} className={cn("flex-1 md:flex-none px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", activeTab === 'verified' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                {isRtl ? 'الأرشيف الموثق' : 'VERIFIED'}
              </button>
           </div>
           
           <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300", isRtl ? "right-3" : "left-3")} />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search...'} className={cn("h-9 w-full text-[10px] font-bold bg-white border-slate-200", dir === 'rtl' ? "pr-8" : "pl-8")} />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all", (dateFrom || dateTo) && "border-emerald-500 bg-emerald-50")}>
                              <CalendarDays className={cn("w-4 h-4", (dateFrom || dateTo) ? "text-emerald-600" : "text-slate-400")} />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent align={dir === 'rtl' ? 'start' : 'end'} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2"><CalendarDays className="w-3.5 h-3.5" />{isRtl ? 'تصفية زمنية' : 'DATE FILTER'}</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">{isRtl ? 'من' : 'FROM'}</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                                <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">{isRtl ? 'إلى' : 'TO'}</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                            </div>
                          </div>
                      </PopoverContent>
                  </Popover>

                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all", (workerFilter !== 'all' || orderFilter !== 'all') && "border-emerald-500 bg-emerald-50")}>
                              <Filter className={cn("w-4 h-4", (workerFilter !== 'all' || orderFilter !== 'all') ? "text-emerald-600" : "text-slate-400")} />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'ترتيب وتصفية' : 'FILTER & SORT'}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex justify-between text-xs font-bold cursor-pointer py-2.5">{isRtl ? 'حسب التاريخ' : 'Sort by Date'}{sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}</DropdownMenuItem>
                          <DropdownMenuSeparator /><DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'الموظف' : 'BY WORKER'}</DropdownMenuLabel>
                          <ScrollArea className="h-40"><DropdownMenuItem onClick={() => setWorkerFilter('all')} className="flex justify-between text-xs font-bold">{isRtl ? 'الكل' : 'All'}{workerFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}</DropdownMenuItem>{allWorkers?.filter(w => w.status !== 'deleted').map(w => (<DropdownMenuItem key={w.id} onClick={() => setWorkerFilter(w.id)} className="flex justify-between text-xs font-bold">{w.fullName}{workerFilter === w.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}</DropdownMenuItem>))}</ScrollArea>
                      </DropdownMenuContent>
                  </DropdownMenu>

                  <Button onClick={onExport} variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all"><FileDown className="w-4 h-4 text-emerald-600" /></Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
