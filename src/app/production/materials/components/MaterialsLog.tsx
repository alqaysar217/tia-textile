'use client';

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialsLogProps {
  loading: boolean;
  transactions: any[];
  materials: any[];
  lang: string;
}

export function MaterialsLog({ loading, transactions, materials, lang }: MaterialsLogProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
      <div className="flex-1 overflow-auto relative no-scrollbar">
        <Table className="text-right border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-sm">
            <TableRow className="border-b border-slate-200 dark:border-slate-700">
              <TableHead className={cn("h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>
                <div className="flex items-center gap-2 uppercase"><Calendar className="w-3 h-3" /> {isRtl ? 'التاريخ والوقت' : 'DATE & TIME'}</div>
              </TableHead>
              <TableHead className={cn("h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المادة الخام' : 'MATERIAL'}</TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">{isRtl ? 'نوع العملية' : 'TYPE'}</TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">{isRtl ? 'الكمية المضافة' : 'IN QTY'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">جاري جلب سجلات التوريد...</TableCell></TableRow>
            ) : transactions.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300 dark:text-slate-700">لا توجد حركات توريد مسجلة</TableCell></TableRow>
            ) : transactions.map((t) => {
              const mat = materials?.find(m => m.id === t.materialId);
              return (
                <TableRow key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                  <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold tabular-nums">
                      <Clock className="w-3 h-3 opacity-30" />
                      {t.createdAt?.toDate?.().toLocaleString(isRtl ? 'ar-YE' : 'en-US')}
                    </div>
                  </TableCell>
                  <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                    <div className="flex items-center gap-2">
                       <Box className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                       <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{isRtl ? (mat?.nameAr || '---') : (mat?.nameEn || '---')}</span>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">({mat?.code})</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase shadow-sm",
                      t.type === 'opening' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30" :
                      t.type === 'supply' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" :
                      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                    )}>
                      {t.type === 'opening' ? (isRtl ? 'رصيد أول المدة' : 'Opening') :
                       t.type === 'supply' ? (isRtl ? 'توريد إضافي' : 'Manual Add') :
                       (isRtl ? 'مرتجع إنتاج' : 'Return')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    + {t.qty?.toLocaleString('en-US')} <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase ms-1">{mat?.unit}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
