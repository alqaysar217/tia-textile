'use client';

import React from 'react';
import { Eye } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-auto no-scrollbar">
        <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>REFERENCE</TableHead>
              <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>PERSONNEL</TableHead>
              <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">ITEMS</TableHead>
              <TableHead className="w-32 px-6 py-4 text-center border-b border-slate-200">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map(v => (
              <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{v.date}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center border text-[10px] font-black text-slate-400">
                      {allWorkers?.find(w => w.id === v.workerId)?.fullName?.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 text-xs">{allWorkers?.find(w => w.id === v.workerId)?.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-black tabular-nums border-emerald-100">
                    {(v.returnedItems?.length || v.items?.length || 0)} {isRtl ? 'أصناف' : 'Items'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  {activeTab === 'pending' ? (
                    <Button onClick={() => onVerify(v)} size="sm" className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black text-white rounded-lg">
                      {isRtl ? 'توثيق المرتجع' : 'VERIFY'}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => onPrint(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600"><Eye className="w-4 h-4" /></Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300">لا توجد سجلات</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
