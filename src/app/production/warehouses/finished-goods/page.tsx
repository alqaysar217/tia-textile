'use client';

import React, { useMemo, useState } from 'react';
import { 
  PackageCheck, 
  ChevronRight, 
  Search, 
  FileDown, 
  History, 
  ShoppingBag, 
  RefreshCcw, 
  Loader2,
  XCircle,
  Truck,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc, serverTimestamp, increment, limit } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FinishedGoodsWarehousePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reversingTx, setReversingTx] = useState<any | null>(null);

  const isRtl = lang === 'ar';

  // Fetch Data
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const whQuery = useMemo(() => !db ? null : collection(db, 'finishedGoodsWarehouse'), [db]);
  const txQuery = useMemo(() => !db ? null : query(collection(db, 'warehouseTransactions'), orderBy('createdAt', 'desc'), limit(50)), [db]);

  const { data: allProducts, loading: pL } = useCollection<any>(productsQuery);
  const { data: whData, loading: wL } = useCollection<any>(whQuery);
  const { data: transactions, loading: tL } = useCollection<any>(txQuery);

  const filteredInventory = useMemo(() => {
    if (!allProducts) return [];
    let list = allProducts.filter(p => p.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.nameAr?.includes(s) || p.sku?.toLowerCase().includes(s));
    }
    return list.map(p => {
      const wh = whData?.find(w => w.id === p.id);
      return { ...p, currentStock: wh?.totalQty || 0, lastIn: wh?.updatedAt };
    });
  }, [allProducts, whData, search]);

  const handleReverseTransfer = async () => {
    if (!db || !reversingTx || isSubmitting) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      const { productId, qty, voucherId, id: txId } = reversingTx;
      
      const whRef = doc(db, 'finishedGoodsWarehouse', productId);
      batch.update(whRef, { totalQty: increment(-qty), updatedAt: serverTimestamp() });

      batch.update(doc(db, 'vouchers', voucherId), { 
        isTransferred: false,
        warehouseTransactionId: null 
      });

      batch.update(doc(db, 'warehouseTransactions', txId), { 
        status: 'reversed', 
        reversedAt: serverTimestamp() 
      });

      await batch.commit();
      toast({ title: isRtl ? "تم إلغاء الترحيل بنجاح" : "Transfer reversed successfully" });
      setReversingTx(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: isRtl ? "خطأ في معالجة العملية" : "Error reversing operation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dictionary = {
    title: isRtl ? 'مستودع المنتجات الجاهزة' : 'Finished Goods Warehouse',
    inventoryTab: isRtl ? 'الجرد الحالي' : 'Current Stock',
    historyTab: isRtl ? 'سجل العمليات' : 'Transaction History',
    searchPlaceholder: isRtl ? 'بحث في المخزن...' : 'Search stock...',
    productCol: isRtl ? 'المنتج' : 'Product',
    categoryCol: isRtl ? 'الفئة' : 'Category',
    stockCol: isRtl ? 'الرصيد المتاح' : 'Available Stock',
    lastInCol: isRtl ? 'آخر دخول' : 'Last In',
    txCol: isRtl ? 'الحركة' : 'Transaction',
    qtyCol: isRtl ? 'الكمية' : 'Quantity',
    statusCol: isRtl ? 'الحالة' : 'Status',
    pcsLabel: isRtl ? 'قطعة جاهزة' : 'Ready Pieces',
    reverseBtn: isRtl ? 'إلغاء الترحيل' : 'Reverse Transfer',
    postedStatus: isRtl ? 'تم التوريد' : 'Posted',
    reversedStatus: isRtl ? 'ملغي' : 'Reversed',
    auditNote: isRtl 
      ? 'مخزن المبيعات المكتملة: يمكنك عكس أي عملية ترحيل تمت بالخطأ من خلال تبويب (سجل العمليات) لاستعادة الرصيد الأصلي.' 
      : 'Finished Goods: You can reverse any erroneous transfer from the (History) tab to restore original balance.',
    navWarehouse: isRtl ? 'المستودعات' : 'Warehousing',
    navFinished: isRtl ? 'المنتجات الجاهزة' : 'Finished Goods'
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      {/* HEADER SECTION */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className={cn("flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full", isRtl ? "text-right" : "text-left")}>
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{dictionary.navWarehouse}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-emerald-600">{dictionary.navFinished}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{dictionary.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="relative flex-1 lg:flex-none">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
                <Input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder={dictionary.searchPlaceholder} 
                  className={cn("h-10 w-full lg:w-64 bg-slate-50 text-xs font-bold", isRtl ? "pr-10 pl-4" : "pl-10 pr-4")} 
                />
             </div>
             <div className="bg-slate-100 p-1 rounded-lg shrink-0 flex items-center gap-1">
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "text-[10px] font-black uppercase px-4 h-7 rounded-md transition-all",
                    activeTab === 'inventory' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {dictionary.inventoryTab}
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "text-[10px] font-black uppercase px-4 h-7 rounded-md transition-all",
                    activeTab === 'history' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {dictionary.historyTab}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        {activeTab === 'inventory' ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-auto no-scrollbar relative">
              <Table className={cn("border-separate border-spacing-0 w-full", isRtl ? "text-right" : "text-left")}>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                      {dictionary.productCol}
                    </TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                      {dictionary.categoryCol}
                    </TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200 text-center")}>
                      {dictionary.stockCol}
                    </TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                      {dictionary.lastInCol}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredInventory.map(p => (
                     <TableRow key={p.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                        <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 rounded-xl border shadow-sm shrink-0">
                                 <AvatarImage src={p.image} className="object-cover" />
                                 <AvatarFallback>FG</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                 <span className="font-black text-slate-900 text-xs">{p.nameAr}</span>
                                 <span className="text-[9px] text-emerald-700 font-bold tabular-nums tracking-widest uppercase">{p.sku}</span>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                           <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">{p.category}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center">
                              <span className="text-lg font-black text-emerald-700 tabular-nums">{(p.currentStock || 0).toLocaleString('en-US')}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dictionary.pcsLabel}</span>
                           </div>
                        </TableCell>
                        <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                           <div className={cn("flex items-center gap-2 text-slate-400 text-[9px] font-bold tabular-nums", isRtl ? "justify-start" : "justify-start")}>
                              <History className="w-3 h-3 opacity-40" />
                              {p.lastIn?.toDate?.().toLocaleString(isRtl ? 'ar-YE' : 'en-US') || '---'}
                           </div>
                        </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
             <div className="flex-1 overflow-auto no-scrollbar relative">
                <Table className={cn("border-separate border-spacing-0 w-full", isRtl ? "text-right" : "text-left")}>
                   <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                         <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                           {dictionary.txCol}
                         </TableHead>
                         <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                           {dictionary.productCol}
                         </TableHead>
                         <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200 text-center")}>
                           {dictionary.qtyCol}
                         </TableHead>
                         <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>
                           {dictionary.statusCol}
                         </TableHead>
                         <TableHead className="w-32 px-6 py-4 border-b border-slate-200"></TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {transactions?.map(tx => {
                        const product = allProducts?.find(p => p.id === tx.productId);
                        const isReversed = tx.status === 'reversed';

                        return (
                          <TableRow key={tx.id} className={cn("border-b border-slate-100 group transition-all", isReversed && "opacity-50 grayscale bg-slate-50/50")}>
                             <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-900 text-xs tabular-nums">{tx.voucherNumber}</span>
                                   <span className="text-[9px] text-slate-400 font-bold tabular-nums">{tx.date}</span>
                                </div>
                             </TableCell>
                             <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                                <div className="flex items-center gap-2">
                                   <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
                                   <span className="font-bold text-slate-700 text-xs">{product?.nameAr || '---'}</span>
                                </div>
                             </TableCell>
                             <TableCell className="px-6 py-3 text-center">
                                <span className={cn("text-xs font-black tabular-nums", isReversed ? "text-slate-400 line-through" : "text-blue-700")}>
                                   {tx.qty} {isRtl ? 'قطعة' : 'Pcs'}
                                </span>
                             </TableCell>
                             <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                                <Badge variant="outline" className={cn(
                                   "text-[8px] font-black uppercase",
                                   isReversed ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                )}>
                                   {isReversed ? dictionary.reversedStatus : dictionary.postedStatus}
                                </Badge>
                             </TableCell>
                             <TableCell className="px-6 py-3">
                                {!isReversed && (
                                   <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => setReversingTx(tx)}
                                      className="h-8 px-3 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-black text-[9px] gap-2 transition-all"
                                   >
                                      <RefreshCcw className="w-3 h-3" />
                                      {dictionary.reverseBtn}
                                   </Button>
                                )}
                             </TableCell>
                          </TableRow>
                        )
                      })}
                   </TableBody>
                </Table>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4 border-t border-white/5">
         <Info className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
            {dictionary.auditNote}
         </p>
      </div>

      {/* REVERSE DIALOG */}
      <AlertDialog open={!!reversingTx} onOpenChange={(open) => !open && setReversingTx(null)}>
        <AlertDialogContent className="max-w-[450px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-rose-950 p-8 text-center relative">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
                 <RefreshCcw className="w-8 h-8 text-rose-500" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">
                {isRtl ? 'إلغاء ترحيل المنجز' : 'Reverse Stock Entry'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
                 {isRtl 
                   ? `سيتم سحب عدد (${reversingTx?.qty}) قطعة من رصيد المستودع الحالي، وإعادة فتح السند في خطوط الإنتاج. هل أنت متأكد من هذا التراجع؟` 
                   : `This will deduct (${reversingTx?.qty}) items from current stock and reopen the production voucher. Confirm?`}
              </AlertDialogDescription>
           </div>
           <div className="bg-white p-6 flex gap-3">
              <AlertDialogAction onClick={handleReverseTransfer} disabled={isSubmitting} className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <XCircle className="w-4 h-4 me-2" />}
                 {isRtl ? 'تأكيد التراجع' : 'Confirm Reverse'}
              </AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-12 bg-slate-50 border-slate-200 text-slate-400 rounded-xl font-black">{isRtl ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}