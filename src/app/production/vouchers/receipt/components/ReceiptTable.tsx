'use client';

import React from 'react';
import { Eye, Edit2, Trash2, MoreVertical, FileText } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ReceiptTableProps {
  loading: boolean;
  vouchers: any[];
  allWorkers: any[];
  allOrders: any[];
  lang: string;
  dir: string;
  onPrint: (v: any) => void;
  onEdit: (v: any) => void;
  onDelete: (v: any) => void;
}

export function ReceiptTable({
  loading, vouchers, allWorkers, allOrders, lang, dir, onPrint, onEdit, onDelete
}: ReceiptTableProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
        <TableHeader className="bg-slate-50 sticky top-0 z-10">
          <TableRow>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{isRtl ? 'رقم السند' : 'REF #'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{isRtl ? 'التاريخ' : 'DATE'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الموظف' : 'WORKER'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{isRtl ? 'المنجز' : 'DONE'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{isRtl ? 'الأجر' : 'WAGE'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{isRtl ? 'العمليات' : 'ACTIONS'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">{isRtl ? 'جاري التحميل...' : 'Loading...'}</TableCell></TableRow>
          ) : vouchers.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">{isRtl ? 'لا توجد سجلات' : 'No records'}</TableCell></TableRow>
          ) : vouchers.map((v) => (
            <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
              <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.voucherNumber}</TableCell>
              <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.date}</TableCell>
              <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", isRtl ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === v.workerId)?.fullName || '---'}</TableCell>
              <TableCell className="px-6 py-3 text-center">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 tabular-nums font-black border-emerald-100">
                  {(v.qtyAccepted || 0).toLocaleString('en-US')} {isRtl ? 'قطعة' : 'Pcs'}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-3 text-center font-black text-slate-900 tabular-nums">
                {(v.wageAmount || 0).toLocaleString('en-US')} <span className="text-[10px] text-slate-400">{v.currency}</span>
              </TableCell>
              <TableCell className="px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onPrint(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                      <DropdownMenuItem onClick={() => onEdit(v)} className="gap-2 font-bold py-2 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {isRtl ? 'تعديل السند' : 'Edit Voucher'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(v)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'نقل للمهملات' : 'Move to Trash'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
