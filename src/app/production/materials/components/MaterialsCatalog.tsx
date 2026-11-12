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
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  PlusCircle,
  Hash,
  Droplet,
  Layers,
  Scissors,
  Zap,
  Package,
  BoxSelect,
  Box,
  Wallet,
  ArrowUp01,
  ArrowDown10,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MaterialsCatalogProps {
  loading: boolean;
  filteredMaterials: any[];
  categories: any[];
  lang: string;
  dir: string;
  onEdit: (mat: any) => void;
  onDelete: (id: string) => void;
  onStockIn: (id: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  toggleSort: (key: any) => void;
}

export function MaterialsCatalog({
  loading, filteredMaterials, categories, lang, dir, onEdit, onDelete, onStockIn,
  sortBy, sortOrder, toggleSort
}: MaterialsCatalogProps) {
  const isRtl = lang === 'ar';

  const getCategoryIcon = (catValue: string) => {
    const icons: Record<string, any> = {
      'yarn': <Hash className="w-4 h-4" />,
      'dye': <Droplet className="w-4 h-4" />,
      'prep': <Layers className="w-4 h-4" />,
      'sewing': <Scissors className="w-4 h-4" />,
      'finish': <Zap className="w-4 h-4" />,
      'packaging': <Package className="w-4 h-4" />,
      'other': <BoxSelect className="w-4 h-4" />
    };
    return icons[catValue] || <Box className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
      <div className="flex-1 overflow-auto relative no-scrollbar">
        <Table className="text-right border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm">
            <TableRow className="border-b border-slate-200 dark:border-slate-700">
              <TableHead className={cn("h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>
                <button onClick={() => toggleSort('code')} className="flex items-center gap-2 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors uppercase">
                  {isRtl ? 'المادة' : 'ITEM'}
                  {sortBy === 'code' ? (sortOrder === 'asc' ? <ArrowUp01 className="w-3 h-3" /> : <ArrowDown10 className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className={cn("h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الفئة' : 'CATEGORY'}</TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">
                <button onClick={() => toggleSort('currentQty')} className="flex items-center gap-2 mx-auto hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors uppercase">
                  {isRtl ? 'المخزون' : 'ON HAND'}
                  {sortBy === 'currentQty' ? (sortOrder === 'asc' ? <ArrowUp01 className="w-3 h-3" /> : <ArrowDown10 className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">
                <button onClick={() => toggleSort('price')} className="flex items-center gap-2 mx-auto hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors uppercase">
                  {isRtl ? 'السعر' : 'PRICE'}
                  {sortBy === 'price' ? (sortOrder === 'asc' ? <ArrowUp01 className="w-3 h-3" /> : <ArrowDown10 className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                </button>
              </TableHead>
              <TableHead className="h-10 font-bold text-[11px] text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">{isRtl ? 'الحالة' : 'STATUS'}</TableHead>
              <TableHead className="h-10 w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-none"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">جاري سحب دليل المواد...</TableCell></TableRow>
            ) : filteredMaterials.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300 dark:text-slate-700">لا توجد مواد مسجلة حالياً</TableCell></TableRow>
            ) : filteredMaterials.map((mat) => {
              const cat = categories.find(c => c.value === mat.category);
              const isLow = (mat.currentQty || 0) <= (mat.minQty || 0);
              const isNegative = (mat.currentQty || 0) < 0;

              return (
                <TableRow key={mat.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                  <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm">
                        <AvatarImage src={mat.photoUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                          {getCategoryIcon(mat.category)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{isRtl ? mat.nameAr : mat.nameEn}</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tabular-nums tracking-wider uppercase">{mat.code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-black uppercase">
                      {cat ? (isRtl ? cat.labelAr : cat.labelEn) : mat.category}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("text-xs font-black tabular-nums", isNegative ? "text-rose-600 underline decoration-wavy" : isLow ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100")}>
                        {(mat.currentQty || 0).toLocaleString('en-US')}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{mat.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="inline-flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                        <Wallet className="w-3 h-3 opacity-30" />
                        {(mat.price || 0).toLocaleString('en-US')}
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">{mat.currency || 'YER'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all",
                      isNegative ? 'bg-rose-600 text-white border-rose-700 animate-pulse' :
                      isLow ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' : 
                      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", isNegative ? "bg-white" : isLow ? "bg-rose-600" : "bg-emerald-600")} />
                      {isNegative ? (isRtl ? 'خطأ مخزني' : 'Inv. Error') :
                       isLow ? (isRtl ? 'مخزون منخفض' : 'Low Stock') : 
                       (isRtl ? 'جيد' : 'Available')}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border-l border-slate-100 dark:border-slate-800">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent transition-colors"><MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl min-w-[200px]">
                        <DropdownMenuItem onClick={() => onStockIn(mat.id)} className="gap-3 font-bold text-xs py-2.5 cursor-pointer dark:text-slate-200 focus:bg-slate-50 dark:focus:bg-slate-800">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'توريد كمية' : 'Add Stock'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="dark:bg-slate-800" />
                        <DropdownMenuItem onClick={() => onEdit(mat)} className="gap-3 font-bold text-xs py-2.5 cursor-pointer dark:text-slate-200 focus:bg-slate-50 dark:focus:bg-slate-800">
                          <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'تعديل البيانات' : 'Update Record'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="dark:bg-slate-800" />
                        <DropdownMenuItem onClick={() => onDelete(mat.id)} className="gap-3 font-bold text-xs text-red-600 dark:text-rose-400 py-2.5 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-900/20">
                          <Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'نقل للأرشيف' : 'Archive'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
