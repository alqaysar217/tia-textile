'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { VoucherTemplate } from '@/components/production/VoucherTemplate';

interface ReturnPrintPreviewProps {
  voucher: any;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  allOrders: any[];
  allWorkers: any[];
  allDepartments: any[];
  allProducts: any[];
  isDownloading: boolean;
  onDownload: () => void;
}

export function ReturnPrintPreview({
  voucher, isOpen, onClose, lang, allOrders, allWorkers, allDepartments, allProducts, isDownloading, onDownload
}: ReturnPrintPreviewProps) {
  if (!voucher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
        <DialogHeader className="sr-only"><DialogTitle>{lang === 'ar' ? 'معاينة سند المرتجع' : 'Return Voucher Preview'}</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[85vh]">
          <div className="p-12 bg-white relative z-0" id="printable-voucher">
            <VoucherTemplate 
              voucher={voucher}
              order={allOrders?.find(o => o.id === voucher.orderId)}
              worker={allWorkers?.find(w => w.id === voucher.workerId)}
              supervisor={allWorkers?.find(w => w.id === (allWorkers?.find(work => work.id === voucher.workerId)?.supervisorId))}
              departments={allDepartments}
              products={allProducts}
              lang={lang}
            />
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
           <Button onClick={onDownload} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all">
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {lang === 'ar' ? 'تحميل كصورة PNG' : 'Download PNG'}
           </Button>
           <Button variant="ghost" onClick={onClose} className="font-black h-12 px-8 rounded-xl border border-slate-200 text-slate-500">{lang === 'ar' ? 'إغلاق' : 'Close'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
