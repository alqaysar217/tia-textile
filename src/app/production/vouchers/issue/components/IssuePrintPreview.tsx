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

interface IssuePrintPreviewProps {
  voucher: any;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  allOrders: any[];
  allWorkers: any[];
  allDepartments: any[];
  allProducts: any[];
  isDownloading: boolean;
  handleDownload: () => void;
}

export function IssuePrintPreview({
  voucher,
  isOpen,
  onClose,
  lang,
  allOrders,
  allWorkers,
  allDepartments,
  allProducts,
  isDownloading,
  handleDownload
}: IssuePrintPreviewProps) {
  if (!voucher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white">
        <DialogHeader className="sr-only"><DialogTitle>معاينة طباعة سند الصرف</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[85vh]">
          <div className="p-12 bg-white relative z-0" id="printable-voucher">
            <VoucherTemplate 
              voucher={voucher}
              order={allOrders?.find(o => o.id === voucher.orderId)}
              worker={allWorkers?.find(w => w.id === voucher.workerId)}
              supervisor={allWorkers?.find(w => w.id === voucher.supervisorId)}
              departments={allDepartments}
              products={allProducts}
              lang={lang}
            />
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 bg-slate-50 border-t print:hidden">
          <Button onClick={handleDownload} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl">
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {lang === 'ar' ? 'تحميل السند كصورة' : 'Download Image'}
          </Button>
          <Button variant="ghost" onClick={onClose} className="font-black h-12 px-8 rounded-xl border border-slate-200 text-slate-500">إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}