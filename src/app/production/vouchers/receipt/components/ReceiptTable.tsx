'use client';

import React from 'react';
import { Eye, Edit2, Trash2, MoreVertical, FileText, Truck, CheckCircle2 } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  onTransfer: (v: any) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ReceiptTable({
  loading, vouchers, allWorkers, allOrders, lang, dir, onPrint, onEdit, onDelete, onTransfer, canEdit, canDelete
}: ReceiptTableProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
        <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b dark:border-slate-700">
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'رقم السند' : 'REF #'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'التاريخ' : 'DATE'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الموظف' : 'WORKER'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'المنجز' : 'DONE'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'الأجر' : 'WAGE'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'العمليات' : 'ACTIONS'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">{isRtl ? 'جاري التحميل...' : 'Loading...'}</TableCell></TableRow>
          ) : vouchers.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300 dark:text-slate-700">{isRtl ? 'لا توجد سجلات' : 'No records'}</TableCell></TableRow>
          ) : vouchers.map((v) => (
            <TableRow key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
              <TableCell className={cn("px-6 py-3 font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.voucherNumber}</TableCell>
              <TableCell className={cn("px-6 py-3 font-bold text-slate-500 dark:text-slate-500 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.date}</TableCell>
              <TableCell className={cn("px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs", isRtl ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === v.workerId)?.fullName || '---'}</TableCell>
              <TableCell className="px-6 py-3 text-center">
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 tabular-nums font-black border-emerald-100 dark:border-emerald-900/30 py-1 px-3">
                  {(v.qtyAccepted || 0).toLocaleString('en-US')} {isRtl ? 'قطعة' : 'Pcs'}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-3 text-center font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {(v.wageAmount || 0).toLocaleString('en-US')} <span className="text-[10px] text-slate-400 dark:text-slate-500 ms-1 uppercase">{v.currency}</span>
              </TableCell>
              <TableCell className="px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onPrint(v)} className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors rounded-lg">
                    <Eye className="w-4 h-4" />
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={v.isTransferred || !canEdit}
                          onClick={() => onTransfer(v)} 
                          className={cn(
                            "h-8 w-8 transition-colors rounded-lg",
                            v.isTransferred 
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 cursor-default" 
                              : "text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          )}
                        >
                          {v.isTransferred ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black">{v.isTransferred ? (isRtl ? 'تم الترحيل' : 'Transferred') : (isRtl ? 'ترحيل للمستودع' : 'Transfer to Warehouse')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl dark:bg-slate-900 dark:border-slate-800">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => onEdit(v)} disabled={v.isTransferred} className="gap-2 font-bold py-2 cursor-pointer text-xs dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                          <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'تعديل السند' : 'Edit Voucher'}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator className="dark:bg-slate-800" />
                          <DropdownMenuItem onClick={() => onDelete(v)} disabled={v.isTransferred} className="gap-2 font-bold py-2 text-rose-600 dark:text-rose-400 cursor-pointer text-xs focus:bg-rose-50 dark:focus:bg-rose-900/20">
                            <Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'نقل للمهملات' : 'Move to Trash'}
                          </DropdownMenuItem>
                        </>
                      )}
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
