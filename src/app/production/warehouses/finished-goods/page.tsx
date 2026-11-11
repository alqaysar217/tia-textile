'use client';

import React, { useMemo, useState } from 'react';
import { 
  PackageCheck, 
  ChevronRight, 
  Search, 
  FileDown, 
  History, 
  ShoppingBag, 
  ArrowUpRight, 
  TrendingUp, 
  Info, 
  Package, 
  Target, 
  RefreshCcw, 
  Loader2,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc, getDoc, increment, limit } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      
      // 1. Decrease Warehouse Stock
      const whRef = doc(db, 'finishedGoodsWarehouse', productId);
      batch.update(whRef, { totalQty: increment(-qty), updatedAt: serverTimestamp() });

      // 2. Reset Voucher Status
      batch.update(doc(db, 'vouchers', voucherId), { 
        isTransferred: false,
        warehouseTransactionId: null 
      });

      // 3. Mark Transaction as Reversed instead of deleting (for audit trail)
      batch.update(doc(db, 'warehouseTransactions', txId), { 
        status: 'reversed', 
        reversedAt: serverTimestamp() 
      });

      await batch.commit();
      toast({ title: isRtl ? "تم إلغاء الترحيل بنجاح" : "Transfer reversed successfully" });
      setReversingTx(null);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error reversing operation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><PackageCheck className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{isRtl ? 'المستودعات' : 'Warehousing'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600">{isRtl ? 'مخزن المنتجات الجاهزة' : 'Finished Goods'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{isRtl ? 'جرد المعاوز المكتملة والجاهزة للبيع' : 'Sellable Stock Master'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRtl ? "right-3" : "left-3")} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث في المخزن...' : 'Search stock...'} className={cn("h-10 w-64 bg-slate-50 text-xs font-bold", isRtl ? "pr-10" : "pl-10")} />
             </div>
             <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-100 p-1 rounded-lg">
                <TabsList className="bg-transparent h-8">
                   <TabsTrigger value="inventory" className="text-[10px] font-black uppercase px-4 h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">{isRtl ? 'الجرد الحالي' : 'Stock'}</TabsTrigger>
                   <TabsTrigger value="history" className="text-[10px] font-black uppercase px-4 h-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">{isRtl ? 'سجل العمليات' : 'History'}</TabsTrigger>
                </TabsList>
             </Tabs>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <Tabs value={activeTab} className="h-full flex flex-col">
           <TabsContent value="inventory" className="flex-1 min-h-0 m-0 focus-visible:ring-0">
              <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                 <div className="flex-1 overflow-auto no-scrollbar">
                    <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>PRODUCT / المنتج</TableHead>
                          <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>CATEGORY / الفئة</TableHead>
                          <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">AVAILABLE STOCK / الرصيد</TableHead>
                          <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>LAST IN / آخر دخول</TableHead>
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
                                    <span className="text-lg font-black text-slate-900 tabular-nums">{(p.currentStock || 0).toLocaleString('en-US')}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isRtl ? 'قطعة جاهزة' : 'Finished Pcs'}</span>
                                 </div>
                              </TableCell>
                              <TableCell className={cn("px-6 py-4", isRtl ? "text-right" : "text-left")}>
                                 <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold">
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
           </TabsContent>

           <TabsContent value="history" className="flex-1 min-h-0 m-0 focus-visible:ring-0">
              <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                 <div className="flex-1 overflow-auto no-scrollbar">
                    <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
                       <TableHeader className="bg-slate-50 sticky top-0 z-10">
                          <TableRow>
                             <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>TRANSACTION / الحركة</TableHead>
                             <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", isRtl ? "text-right" : "text-left")}>PRODUCT / الصنف</TableHead>
                             <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">QTY / الكمية</TableHead>
                             <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">STATUS / الحالة</TableHead>
                             <TableHead className="w-32 px-6 py-4 text-center border-b border-slate-200"></TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {transactions?.map(tx => {
                            const product = allProducts?.find(p => p.id === tx.productId);
                            const isReversed = tx.status === 'reversed';

                            return (
                              <TableRow key={tx.id} className={cn("border-b border-slate-100 group", isReversed && "opacity-50 grayscale bg-slate-50/50")}>
                                 <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                                    <div className="flex flex-col">
                                       <span className="font-black text-slate-900 text-xs tabular-nums">{tx.voucherNumber}</span>
                                       <span className="text-[9px] text-slate-400 font-bold">{tx.date}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                                    <div className="flex items-center gap-2">
                                       <ShoppingBag className="w-3 h-3 text-slate-300" />
                                       <span className="font-bold text-slate-700 text-xs">{product?.nameAr || '---'}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="px-6 py-3 text-center">
                                    <span className={cn("text-xs font-black tabular-nums", isReversed ? "text-slate-400 line-through" : "text-blue-700")}>
                                       {tx.qty} {isRtl ? 'قطعة' : 'Pcs'}
                                    </span>
                                 </TableCell>
                                 <TableCell className="px-6 py-3 text-center">
                                    <Badge variant="outline" className={cn(
                                       "text-[8px] font-black uppercase",
                                       isReversed ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    )}>
                                       {isReversed ? (isRtl ? 'ملغي' : 'Reversed') : (isRtl ? 'تم التوريد' : 'Posted')}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="px-6 py-3 text-center">
                                    {!isReversed && (
                                       <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => setReversingTx(tx)}
                                          className="h-8 px-3 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-black text-[9px] gap-2 transition-all opacity-0 group-hover:opacity-100"
                                       >
                                          <RefreshCcw className="w-3 h-3" />
                                          {isRtl ? 'إلغاء الترحيل' : 'Reverse'}
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
           </TabsContent>
        </Tabs>
      </div>

      {/* REVERSAL DIALOG */}
      <AlertDialog open={!!reversingTx} onOpenChange={(open) => !open && setReversingTx(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-rose-950 p-8 text-center relative">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
                 <RefreshCcw className="w-8 h-8 text-rose-500" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'إلغاء ترحيل المنجز' : 'Reverse Stock Entry'}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
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

      {/* FOOTER NOTE */}
      <div className="flex-none p-3 bg-slate-900 text-white/40 flex items-center justify-center gap-4">
         <Info className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
            {isRtl 
              ? 'مخزن المبيعات المكتملة: يمكنك عكس أي عملية ترحيل تمت بالخطأ من خلال تبويب (سجل العمليات) لاستعادة الرصيد الأصلي.' 
              : 'Finished Goods: You can reverse any erroneous transfer from the (History) tab to restore original balance.'}
         </p>
      </div>
    </div>
  );
}
