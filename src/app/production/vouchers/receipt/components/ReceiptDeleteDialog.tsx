'use client';

import React from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { History, Loader2 } from 'lucide-react';

interface ReceiptDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  isSubmitting: boolean;
  onDelete: () => void;
}

export function ReceiptDeleteDialog({
  isOpen, onClose, lang, isSubmitting, onDelete
}: ReceiptDeleteDialogProps) {
  const isRtl = lang === 'ar';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
        <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><History className="w-32 h-32 text-white" /></div>
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
            <History className="w-8 h-8 text-red-500" />
          </div>
          <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'إلغاء السند وعكس التأثير' : 'Move to Trash & Reverse'}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
            {isRtl ? 'تحذير: سيتم خصم المنجز من أمر الإنتاج وإعادة فتح عهدة المواد للعامل وسحب المرتجع من المخزن تلقائياً.' : 'Warning: Progress will be deducted and liabilities restored.'}
          </AlertDialogDescription>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
          <AlertDialogAction onClick={onDelete} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg transition-all active:scale-95">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRtl ? "تأكيد الحذف" : "Confirm")}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose} className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">{isRtl ? 'تراجع' : 'Cancel'} </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
