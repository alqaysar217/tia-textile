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
  ArrowUpToLine,
  PackagePlus,
  RefreshCcw,
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
    <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto no-scrollbar relative">
        <Table className="text-right">
          <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-sm">
            <TableRow>
              <TableHead className={cn("h-10 font-bold text-[11px] text-slate-500 px-6", isRtl ? "text-right" : "text-left")}>
                <div className="flex items-center gap-2 uppercase"><Calendar className="w-3 h-3" /> {isRtl ? 'التاريخ والوقت' : 'DATE & TIME'}</div>
              </TableHead>
              <TableHead className={cn("h-10 font-bold text-[11px] text-slate-500 px-6", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المادة الخام' : 'MATERIAL'}</TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{isRtl ? 'نوع العملية' : 'TYPE'}</TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 px-6 text-center">{isRtl ? 'الكمية المضافة' : 'IN QTY'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري جلب سجلات التوريد...</TableCell></TableRow>
            ) : transactions.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300">لا توجد حركات توريد مسجلة</TableCell></TableRow>
            ) : transactions.map((t) => {
              const mat = materials?.find(m => m.id === t.materialId);
              return (
                <TableRow key={t.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                  <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold tabular-nums">
                      <Clock className="w-3 h-3 opacity-30" />
                      {t.createdAt?.toDate?.().toLocaleString(isRtl ? 'ar-YE' : 'en-US')}
                    </div>
                  </TableCell>
                  <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                    <div className="flex items-center gap-2">
                       <Box className="w-3 h-3 text-slate-300" />
                       <span className="font-black text-slate-900 text-xs">{isRtl ? (mat?.nameAr || '---') : (mat?.nameEn || '---')}</span>
                       <span className="text-[10px] font-bold text-slate-400 tabular-nums">({mat?.code})</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase",
                      t.type === 'opening' ? "bg-blue-50 text-blue-700 border-blue-100" :
                      t.type === 'supply' ? "bg-purple-50 text-purple-700 border-purple-100" :
                      "bg-emerald-50 text-emerald-700 border-emerald-100"
                    )}>
                      {t.type === 'opening' ? (isRtl ? 'رصيد أول المدة' : 'Opening') :
                       t.type === 'supply' ? (isRtl ? 'توريد إضافي' : 'Manual Add') :
                       (isRtl ? 'مرتجع إنتاج' : 'Return')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center font-black text-emerald-600 tabular-nums">
                    + {t.qty?.toLocaleString('en-US')} <span className="text-[9px] text-slate-400 uppercase ms-1">{mat?.unit}</span>
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
