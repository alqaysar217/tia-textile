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

interface IssueDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  isSubmitting: boolean;
  handleDelete: () => void;
}

export function IssueDeleteDialog({
  isOpen,
  onClose,
  lang,
  isSubmitting,
  handleDelete
}: IssueDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-slate-950 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <History className="w-8 h-8 text-red-500" />
          </div>
          <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'إلغاء سند الصرف' : 'Cancel Voucher'}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
            {lang === 'ar' ? 'تحذير: حذف السند سيؤدي لإلغاء الحركة المالية وإرجاع كافة الكميات المصروفة إلى مخازن الجمعية تلقائياً.' : 'Warning: Deleting will return items to inventory.'}
          </AlertDialogDescription>
        </div>
        <div className="bg-white p-6 flex gap-3">
          <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === 'ar' ? 'تأكيد الحذف' : 'Confirm')}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose} disabled={isSubmitting} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">إلغاء</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}