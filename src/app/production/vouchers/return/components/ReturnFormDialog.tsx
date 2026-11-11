'use client';

import React from 'react';
import { 
  RefreshCcw, 
  CheckCircle2, 
  Loader2 
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
      <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
        <div className="premium-gradient p-6 text-white">
          <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
            <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
              <RefreshCcw className="w-5 h-5 text-emerald-300" />
              {isRtl ? 'توثيق توريد المرتجع للمخزن' : 'Verify Material Return'}
            </DialogTitle>
            <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Authenticating raw material re-entry into inventory</p>
          </DialogHeader>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
           <div className="grid grid-cols-3 gap-4">
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}><Label className="text-[10px] font-black uppercase text-slate-400">DATE</Label><Input type="date" value={formData.date} className="h-11 bg-slate-50 font-bold" disabled /></div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}><Label className="text-[10px] font-black uppercase text-slate-400">WORKER</Label><Input value={allWorkers?.find(w => w.id === formData.workerId)?.fullName || ''} className="h-11 bg-slate-50 font-bold" disabled /></div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}><Label className="text-[10px] font-black uppercase text-slate-400">BATCH</Label><Input value={allOrders?.find(o => o.id === formData.orderId)?.title || ''} className="h-11 bg-slate-50 font-bold" disabled /></div>
           </div>
           
           <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <Table className={cn("text-right", !isRtl && "text-left")}>
                 <TableHeader className="bg-slate-50">
                   <TableRow>
                     <TableHead className={cn("px-4 py-2 font-black text-[9px] uppercase", isRtl ? "text-right" : "text-left")}>MATERIAL</TableHead>
                     <TableHead className="px-4 py-2 font-black text-[9px] uppercase text-center">QTY</TableHead>
                     <TableHead className="px-4 py-2 font-black text-[9px] uppercase text-center">UNIT</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                    {formData.items.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-b border-slate-50 bg-white">
                         <TableCell className={cn("px-4 py-3 text-xs font-bold text-slate-700", isRtl ? "text-right" : "text-left")}>{item.nameAr}</TableCell>
                         <TableCell className="text-center font-black text-emerald-700 tabular-nums">{item.qty}</TableCell>
                         <TableCell className="text-center text-[10px] font-bold text-slate-400 uppercase">{item.unit}</TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </div>
           
           <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className="text-[10px] font-black uppercase text-slate-400">AUDIT NOTES</Label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white" />
           </div>

           <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 premium-gradient text-white font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                {isRtl ? 'تأكيد دخول المخزن وتصفية العهدة' : 'Confirm Inventory Re-entry'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="px-8 h-14 font-black text-slate-400 rounded-xl">إلغاء</Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}