'use client';

import React from 'react';
import { 
  FileText, 
  Eye, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  ShieldCheck 
} from 'lucide-react';
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

interface IssueTableProps {
  loading: boolean;
  vouchers: any[];
  allOrders: any[];
  allWorkers: any[];
  lang: string;
  dir: string;
  onView: (v: any) => void;
  onEdit: (v: any) => void;
  onDelete: (v: any) => void;
}

export function IssueTable({
  loading,
  vouchers,
  allOrders,
  allWorkers,
  lang,
  dir,
  onView,
  onEdit,
  onDelete
}: IssueTableProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
      <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
        <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b dark:border-slate-700">
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'رقم السند' : 'REF #'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'التاريخ' : 'DATE'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'أمر الإنتاج' : 'ORDER'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'العامل / المشرف' : 'RECIPIENT / SUP'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">{isRtl ? 'الأصناف' : 'ITEMS'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">{isRtl ? 'العمليات' : 'ACTIONS'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">{isRtl ? 'جاري سحب الأرشيف...' : 'Loading...'}</TableCell></TableRow>
          ) : vouchers.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300 dark:text-slate-700">{isRtl ? 'لا توجد سندات مسجلة' : 'No records'}</TableCell></TableRow>
          ) : vouchers.map((v) => {
            const order = allOrders?.find(o => o.id === v.orderId);
            const worker = allWorkers?.find(w => w.id === v.workerId);
            const supervisor = allWorkers?.find(w => w.id === v.supervisorId);
            return (
              <TableRow key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0"><FileText className="w-3.5 h-3.5" /></div>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums">{v.voucherNumber}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("px-6 py-3 font-bold text-slate-500 dark:text-slate-500 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.date}</TableCell>
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xs">{order?.orderNumber || '---'}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate max-w-[150px]">{order?.title}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{worker?.fullName || '---'}</span>
                    {supervisor && (
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                        <ShieldCheck className="w-2 h-2" />
                        {isRtl ? 'بمسؤولية:' : 'Under:'} {supervisor.fullName}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-black border-emerald-100 dark:border-emerald-900/30">
                    {v.items?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      onClick={() => onView(v)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-44 rounded-lg shadow-xl dark:bg-slate-900 dark:border-slate-800">
                        <DropdownMenuItem onClick={() => onView(v)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs dark:text-slate-200">
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'عرض السند' : 'View Voucher'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(v)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs dark:text-slate-200">
                          <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'تعديل السند' : 'Edit Voucher'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="dark:bg-slate-800" />
                        <DropdownMenuItem onClick={() => onDelete(v)} className="gap-2 font-bold py-1.5 text-rose-600 dark:text-rose-400 cursor-pointer text-xs">
                          <Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'حذف السند' : 'Delete Voucher'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
