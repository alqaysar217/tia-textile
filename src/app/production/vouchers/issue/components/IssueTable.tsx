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
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Table className="text-right border-separate border-spacing-0">
        <TableHeader className="bg-slate-50 sticky top-0 z-10">
          <TableRow>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'أمر الإنتاج' : 'ORDER'}</TableHead>
            <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'العامل / المشرف' : 'RECIPIENT / SUP'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'الأصناف' : 'ITEMS'}</TableHead>
            <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب الأرشيف...</TableCell></TableRow>
          ) : vouchers.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد سندات مسجلة</TableCell></TableRow>
          ) : vouchers.map((v) => {
            const order = allOrders?.find(o => o.id === v.orderId);
            const worker = allWorkers?.find(w => w.id === v.workerId);
            const supervisor = allWorkers?.find(w => w.id === v.supervisorId);
            return (
              <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                  <div className={cn("flex items-center gap-2", dir === 'rtl' ? "justify-start" : "justify-start")}>
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><FileText className="w-3.5 h-3.5" /></div>
                    <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.date}</TableCell>
                <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                  <div className={cn("flex flex-col", dir === 'rtl' ? "items-start" : "items-start")}>
                    <span className="font-black text-slate-800 text-xs">{order?.orderNumber || '---'}</span>
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{order?.title}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-xs">{worker?.fullName || '---'}</span>
                    {supervisor && (
                      <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-2 h-2" />
                        {lang === 'ar' ? 'بمسؤولية:' : 'Under:'} {supervisor.fullName}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-black">
                    {v.items?.length || 0}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={() => onView(v)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-100"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-lg shadow-xl">
                        <DropdownMenuItem onClick={() => onView(v)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'عرض السند' : 'View Voucher'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(v)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs">
                          <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل السند' : 'Edit Voucher'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(v)} className="gap-2 font-bold py-1.5 text-rose-600 cursor-pointer text-xs">
                          <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'حذف السند' : 'Delete Voucher'}
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
