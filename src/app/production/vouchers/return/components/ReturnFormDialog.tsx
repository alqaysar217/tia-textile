'use client';

import React from 'react';
import { 
  RefreshCcw, 
  CheckCircle2, 
  Loader2,
  Calendar,
  User,
  Workflow
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ReturnFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  isSubmitting: boolean;
  formData: any;
  setFormData: (v: any) => void;
  allWorkers: any[];
  allOrders: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export function ReturnFormDialog({
  isOpen, onClose, lang, isSubmitting, formData, setFormData, allWorkers, allOrders, onSubmit
}: ReturnFormDialogProps) {
  const isRtl = lang === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
        <div className="premium-gradient p-6 text-white">
          <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
              <RefreshCcw className="w-5 h-5 text-emerald-300" />
              {isRtl ? 'توثيق توريد المرتجع للمخزن' : 'Verify Material Return'}
            </DialogTitle>
            <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Authenticating raw material re-entry into inventory</p>
          </DialogHeader>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6 bg-white dark:bg-slate-900 max-h-[85vh] overflow-y-auto no-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                  {isRtl ? 'التاريخ' : 'DATE'} <Calendar className="w-3 h-3 text-emerald-600" />
                </Label>
                <Input value={formData.date} className="h-11 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 font-bold border-slate-200 dark:border-slate-700" disabled />
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                  {isRtl ? 'الموظف' : 'WORKER'} <User className="w-3 h-3 text-emerald-600" />
                </Label>
                <Input value={allWorkers?.find(w => w.id === formData.workerId)?.fullName || ''} className="h-11 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 font-bold border-slate-200 dark:border-slate-700" disabled />
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end">
                  {isRtl ? 'الدفعة' : 'BATCH'} <Workflow className="w-3 h-3 text-emerald-600" />
                </Label>
                <Input value={allOrders?.find(o => o.id === formData.orderId)?.title || ''} className="h-11 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 font-bold border-slate-200 dark:border-slate-700" disabled />
              </div>
           </div>
           
           <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table className={cn("text-right w-full", !isRtl && "text-left")}>
                 <TableHeader className="bg-slate-50 dark:bg-slate-800">
                   <TableRow className="border-b dark:border-slate-700">
                     <TableHead className={cn("px-4 py-3 font-black text-[9px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{isRtl ? 'المادة' : 'MATERIAL'}</TableHead>
                     <TableHead className="px-4 py-3 font-black text-[9px] text-slate-500 dark:text-slate-400 uppercase text-center">QTY</TableHead>
                     <TableHead className="px-4 py-3 font-black text-[9px] text-slate-500 dark:text-slate-400 uppercase text-center">UNIT</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {formData.items.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                         <TableCell className={cn("px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300", isRtl ? "text-right" : "text-left")}>{item.nameAr}</TableCell>
                         <TableCell className="text-center font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{item.qty}</TableCell>
                         <TableCell className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tabular-nums">{item.unit}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </div>
           
           <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{isRtl ? 'ملاحظات التدقيق' : 'AUDIT NOTES'}</Label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                className="w-full min-h-[80px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200 transition-all" 
              />
           </div>

           <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 premium-gradient text-white font-black text-base shadow-xl border-none transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                {isRtl ? 'تأكيد دخول المخزن وتصفية العهدة' : 'Confirm Inventory Re-entry'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="px-8 h-14 font-black text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">إلغاء</Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
