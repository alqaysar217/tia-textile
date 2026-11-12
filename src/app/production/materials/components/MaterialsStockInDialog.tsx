'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { 
  PackagePlus, 
  Box, 
  ArrowUpToLine, 
  Info, 
  Save, 
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaterialsStockInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: any) => void;
  formData: any;
  setFormData: (v: any) => void;
  materials: any[];
  isSubmitting: boolean;
  lang: string;
}

export function MaterialsStockInDialog({
  isOpen, onClose, onSubmit, formData, setFormData, materials, isSubmitting, lang
}: MaterialsStockInDialogProps) {
  const isRtl = lang === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900 transition-colors duration-300">
        <div className="bg-slate-900 dark:bg-slate-950 p-6 text-white relative">
          <DialogHeader className={cn("text-right", !isRtl && "text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <PackagePlus className="w-5 h-5 text-emerald-400" />
              {isRtl ? 'توريد كمية جديدة' : 'Stock Replenishment'}
            </DialogTitle>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Increasing existing inventory balance</p>
          </DialogHeader>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 bg-white dark:bg-slate-900">
          <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
            <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
              {isRtl ? 'اختر الصنف المراد توريده' : 'SELECT MATERIAL'} <Box className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            </Label>
            <select 
              value={formData.materialId} 
              onChange={(e) => setFormData({...formData, materialId: e.target.value})}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 transition-colors"
              required
            >
              <option value="">-- {isRtl ? 'اختر الصنف' : 'Select Material'} --</option>
              {materials?.filter(m => m.status !== 'deleted').map(m => (
                <option key={m.id} value={m.id}>{m.nameAr} ({m.code})</option>
              ))}
            </select>
          </div>

          <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
            <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
              {isRtl ? 'الكمية الواردة الجديدة' : 'QUANTITY TO ADD'} <ArrowUpToLine className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            </Label>
            <div className="relative">
              <Input 
                type="number" 
                min="0.01" 
                step="any"
                value={formData.qty || ''} 
                onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                className="h-14 font-black text-2xl text-center tabular-nums bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-inner" 
                required 
              />
              <div className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600/40 dark:text-emerald-400/30 uppercase pointer-events-none", isRtl ? "right-4" : "left-4")}>
                {materials?.find(m => m.id === formData.materialId)?.unit || ''}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-start gap-3 transition-colors">
            <div className="flex-1 text-right">
               <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                  {isRtl 
                    ? 'سيتم إضافة هذه الكمية إلى الرصيد الحالي فوراً وتوثيق العملية في سجل التوريدات.' 
                    : 'This quantity will be added to the current balance and logged in the supply history.'}
               </p>
            </div>
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting || !formData.materialId || formData.qty <= 0} className="flex-1 h-12 premium-gradient text-white rounded-md font-black text-sm border-none shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
              {isRtl ? 'تأكيد التوريد' : 'Confirm Stock In'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-6 h-12 font-black text-slate-400 dark:text-slate-500 rounded-md border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
