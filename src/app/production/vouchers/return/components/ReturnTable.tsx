'use client';

import React from 'react';
import { Eye, Clock } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReturnTableProps {
  list: any[];
  allWorkers: any[];
  allOrders: any[];
  activeTab: 'pending' | 'verified';
  lang: string;
  dir: string;
  onVerify: (v: any) => void;
  onPrint: (v: any) => void;
}

export function ReturnTable({
  list, allWorkers, allOrders, activeTab, lang, dir, onVerify, onPrint
}: ReturnTableProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-300">
      <div className="flex-1 overflow-auto no-scrollbar">
        <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
          <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
            <TableRow className="border-b dark:border-slate-700">
              <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المرجع' : 'REFERENCE'}</TableHead>
              <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الموظف' : 'PERSONNEL'}</TableHead>
              <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">{isRtl ? 'الأصناف' : 'ITEMS'}</TableHead>
              <TableHead className="w-32 px-6 py-4 text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'العمليات' : 'ACTIONS'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map(v => (
              <TableRow key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums">{v.voucherNumber}</span>
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 mt-0.5">
                       <Clock className="w-2.5 h-2.5" />
                       <span className="text-[9px] font-bold tabular-nums">{v.date}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-600">
                      {allWorkers?.find(w => w.id === v.workerId)?.fullName?.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{allWorkers?.find(w => w.id === v.workerId)?.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-black tabular-nums border-emerald-100 dark:border-emerald-900/30">
                    {(v.returnedItems?.length || v.items?.length || 0)} {isRtl ? 'أصناف' : 'Items'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  {activeTab === 'pending' ? (
                    <Button 
                      onClick={() => onVerify(v)} 
                      size="sm" 
                      className="h-8 px-4 bg-amber-600 hover:bg-amber-700 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-400 text-[10px] font-black text-white rounded-lg border-none shadow-sm transition-all"
                    >
                      {isRtl ? 'توثيق المرتجع' : 'VERIFY'}
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onPrint(v)} 
                      className="h-8 w-8 text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300 dark:text-slate-800">{isRtl ? 'لا توجد سجلات حالياً' : 'No records found'}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
