'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  ChevronRight, 
  Info, 
  Timer,
  Skull,
  AlertTriangle,
  Factory,
  Users,
  User,
  Box,
  ShoppingBag,
  Tag,
  Workflow,
  FileText,
  RefreshCcw,
  FileOutput,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { useFirestore, useCollection } from '@/firebase';
import { collection, updateDoc, doc, serverTimestamp, query, where, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function TrashPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'restore' | 'purge' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries for all deletable entities
  const deptsTrashQuery = useMemo(() => !db ? null : query(collection(db, 'departments'), where('status', '==', 'deleted')), [db]);
  const workersTrashQuery = useMemo(() => !db ? null : query(collection(db, 'workers'), where('status', '==', 'deleted')), [db]);
  const materialsTrashQuery = useMemo(() => !db ? null : query(collection(db, 'materials'), where('status', '==', 'deleted')), [db]);
  const productsTrashQuery = useMemo(() => !db ? null : query(collection(db, 'products'), where('status', '==', 'deleted')), [db]);
  const ordersTrashQuery = useMemo(() => !db ? null : query(collection(db, 'productionOrders'), where('status', '==', 'deleted')), [db]);
  const vouchersTrashQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('status', '==', 'deleted')), [db]);

  const { data: archivedDepts, loading: dL } = useCollection<any>(deptsTrashQuery);
  const { data: archivedWorkers, loading: wL } = useCollection<any>(workersTrashQuery);
  const { data: archivedMaterials, loading: mL } = useCollection<any>(materialsTrashQuery);
  const { data: archivedProducts, loading: pL } = useCollection<any>(productsTrashQuery);
  const { data: archivedOrders, loading: oL } = useCollection<any>(ordersTrashQuery);
  const { data: archivedVouchers, loading: vL } = useCollection<any>(vouchersTrashQuery);

  const loading = dL || wL || mL || pL || oL || vL;

  const allArchivedItems = useMemo(() => {
    const d = (archivedDepts || []).map(x => ({ ...x, type: 'department' }));
    const w = (archivedWorkers || []).map(x => ({ ...x, type: 'worker' }));
    const m = (archivedMaterials || []).map(x => ({ ...x, type: 'material' }));
    const p = (archivedProducts || []).map(x => ({ ...x, type: 'product' }));
    const o = (archivedOrders || []).map(x => ({ ...x, type: 'order' }));
    const v = (archivedVouchers || []).map(x => ({ ...x, type: 'voucher' }));
    return [...d, ...w, ...m, ...p, ...o, ...v].sort((a, b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0));
  }, [archivedDepts, archivedWorkers, archivedMaterials, archivedProducts, archivedOrders, archivedVouchers]);

  const filtered = useMemo(() => {
    return allArchivedItems.filter(item => {
      const s = search.toLowerCase();
      const n = (item.nameAr || item.fullName || item.title || item.orderNumber || item.voucherNumber || '').toLowerCase();
      const c = (item.code || item.workerId || item.sku || item.orderNumber || item.voucherNumber || '').toLowerCase();
      return n.includes(s) || c.includes(s);
    });
  }, [allArchivedItems, search]);

  const handleAction = async () => {
    if (!db || !selectedItem || !actionType || isSubmitting) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    const targetId = selectedItem.id;
    let col = 'departments';
    if (selectedItem.type === 'worker') col = 'workers';
    if (selectedItem.type === 'material') col = 'materials';
    if (selectedItem.type === 'product') col = 'products';
    if (selectedItem.type === 'order') col = 'productionOrders';
    if (selectedItem.type === 'voucher') col = 'vouchers';
    
    try {
      if (actionType === 'restore') {
        if (selectedItem.type === 'voucher' && selectedItem.type === 'production_receipt') {
          const orderRef = doc(db, 'productionOrders', selectedItem.orderId);
          const oSnap = await getDoc(orderRef);
          batch.update(orderRef, { completedQty: (oSnap.data()?.completedQty || 0) + (selectedItem.qtyAccepted || 0) });
        }
        
        batch.update(doc(db, col, targetId), { 
          status: col === 'products' ? 'available' : 'active', 
          active: true, 
          updatedAt: serverTimestamp() 
        });
      } else {
        batch.delete(doc(db, col, targetId));
      }

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم الإجراء بنجاح" : "Success" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setSelectedItem(null);
      setActionType(null);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-600 rounded-lg text-white shadow-lg shadow-amber-900/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإدارة' : 'Management'}</span>
                <ChevronRight className={cn("w-3 h-3", isRtl ? "rotate-180" : "")} />
                <span className="text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'سلة المهملات' : 'Smart Trash'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {lang === 'ar' ? 'الأرشيف الذكي الموحد' : 'Unified Smart Archive'}
              </h1>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{lang === 'ar' ? 'إجمالي المحذوفات' : 'TOTAL TRASH'}</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-500 tabular-nums">{(allArchivedItems.length).toLocaleString('en-US')}</p>
          </div>
        </div>
        
        {/* SEARCH BAR */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search archive...'} 
              className={cn(
                "h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100",
                isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
              )} 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b dark:border-slate-700">
                  <TableHead className={cn("px-6 py-3 font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{lang === 'ar' ? 'العنصر' : 'ITEM'}</TableHead>
                  <TableHead className={cn("px-6 py-3 font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{lang === 'ar' ? 'النوع' : 'TYPE'}</TableHead>
                  <TableHead className={cn("px-6 py-3 font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>{lang === 'ar' ? 'تاريخ الحذف' : 'DELETED AT'}</TableHead>
                  <TableHead className="w-[200px] border-b dark:border-slate-700"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">جاري الفحص...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300 dark:text-slate-800">السلة فارغة</TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 dark:text-slate-600">
                          {item.type === 'department' ? <Factory className="w-4 h-4" /> : 
                           item.type === 'worker' ? <User className="w-4 h-4" /> : 
                           item.type === 'material' ? <Box className="w-4 h-4" /> : 
                           item.type === 'order' ? <Workflow className="w-4 h-4" /> :
                           item.type === 'voucher' ? <FileText className="w-4 h-4" /> :
                           <ShoppingBag className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{item.nameAr || item.fullName || item.title || item.voucherNumber || 'سجل بدون عنوان'}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tabular-nums">{item.code || item.workerId || item.sku || item.orderNumber || item.voucherNumber}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] font-black uppercase">
                        {item.type === 'voucher' ? (lang === 'ar' ? 'سند' : 'Voucher') : 
                         item.type === 'department' ? (lang === 'ar' ? 'قسم' : 'Dept') : 
                         item.type === 'worker' ? (lang === 'ar' ? 'عامل' : 'Worker') : 
                         item.type === 'material' ? (lang === 'ar' ? 'مادة' : 'Material') : 
                         item.type === 'order' ? (lang === 'ar' ? 'أمر إنتاج' : 'Order') : 
                         (lang === 'ar' ? 'منتج' : 'Product')}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-slate-500 dark:text-slate-400 text-[11px] font-bold tabular-nums">
                      {item.deletedAt?.toDate?.().toLocaleDateString('en-US') || '---'}
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => { setSelectedItem(item); setActionType('restore'); }} variant="outline" className="h-8 px-3 rounded text-[10px] font-black gap-1.5 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                          <RotateCcw className="w-3 h-3" /> {lang === 'ar' ? 'استعادة' : 'Restore'}
                        </Button>
                        <Button onClick={() => { setSelectedItem(item); setActionType('purge'); }} variant="outline" className="h-8 px-3 rounded text-[10px] font-black gap-1.5 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                          <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'حذف نهائي' : 'Purge'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* SYSTEM FOOTER */}
        <div className="mt-4 flex-none bg-slate-900 dark:bg-slate-900/80 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner transition-colors duration-300">
          <div className="w-8 h-8 bg-amber-500/20 rounded flex items-center justify-center text-amber-400 shrink-0"><Info className="w-4 h-4" /></div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">
              {lang === 'ar' ? 'بروتوكول تصفية الأرشيف' : 'Archive Purge Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-400 font-bold opacity-80 leading-relaxed">
              {lang === 'ar' ? 'يتم الاحتفاظ بالعناصر المحذوفة لمدة 30 يوماً قبل الحذف التلقائي النهائي لضمان عدم فقدان البيانات الهامة.' : 'Deleted items are kept for 30 days before automatic final deletion to ensure data safety.'}
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={!!actionType} onOpenChange={() => !isSubmitting && setActionType(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900 transition-colors duration-300">
          <div className={cn("p-8 text-center relative overflow-hidden", actionType === 'restore' ? "premium-gradient" : "bg-rose-950")}>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 relative z-10">
              {actionType === 'restore' ? <RotateCcw className="w-8 h-8 text-white" /> : <Skull className="w-8 h-8 text-rose-500" />}
            </div>
            <AlertDialogTitle className="text-white text-xl font-black relative z-10">
              {actionType === 'restore' ? (lang === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore') : (lang === 'ar' ? 'حذف نهائي' : 'Permanent Purge')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 font-bold mt-2 text-xs leading-relaxed relative z-10">
              {actionType === 'restore' 
                ? (lang === 'ar' ? 'سيتم إعادة هذا السجل وتفعيل تأثيره المالي والمخزني فوراً.' : 'Item will be restored and its fiscal impact re-applied.') 
                : (lang === 'ar' ? 'تحذير: سيتم مسح هذا السجل تماماً من النظام ولا يمكن التراجع عن هذا الإجراء.' : 'Warning: This action cannot be undone. Data will be purged forever.')}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
            <AlertDialogAction onClick={handleAction} disabled={isSubmitting} className={cn("flex-1 h-11 font-black text-white border-none transition-all active:scale-95 shadow-lg", actionType === 'restore' ? "premium-gradient" : "bg-rose-600 hover:bg-rose-700")}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === 'ar' ? 'تأكيد' : 'Confirm')}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isSubmitting} className="flex-1 h-11 font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
