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
  Tag
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
import { collection, updateDoc, doc, serverTimestamp, query, where, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

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

  const { data: archivedDepts, loading: dL } = useCollection<any>(deptsTrashQuery);
  const { data: archivedWorkers, loading: wL } = useCollection<any>(workersTrashQuery);
  const { data: archivedMaterials, loading: mL } = useCollection<any>(materialsTrashQuery);
  const { data: archivedProducts, loading: pL } = useCollection<any>(productsTrashQuery);

  const loading = dL || wL || mL || pL;

  const allArchivedItems = useMemo(() => {
    const d = (archivedDepts || []).map(x => ({ ...x, type: 'department' }));
    const w = (archivedWorkers || []).map(x => ({ ...x, type: 'worker' }));
    const m = (archivedMaterials || []).map(x => ({ ...x, type: 'material' }));
    const p = (archivedProducts || []).map(x => ({ ...x, type: 'product' }));
    return [...d, ...w, ...m, ...p].sort((a, b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0));
  }, [archivedDepts, archivedWorkers, archivedMaterials, archivedProducts]);

  const filtered = useMemo(() => {
    return allArchivedItems.filter(item => {
      const s = search.toLowerCase();
      const n = (item.nameAr || item.fullName || '').toLowerCase();
      const c = (item.code || item.workerId || item.sku || '').toLowerCase();
      return n.includes(s) || c.includes(s);
    });
  }, [allArchivedItems, search]);

  const handleAction = () => {
    if (!db || !selectedItem || !actionType || isSubmitting) return;
    setIsSubmitting(true);
    const targetId = selectedItem.id;
    let col = 'departments';
    if (selectedItem.type === 'worker') col = 'workers';
    if (selectedItem.type === 'material') col = 'materials';
    if (selectedItem.type === 'product') col = 'products';
    
    const act = actionType;
    setSelectedItem(null); setActionType(null);

    setTimeout(() => {
      const docRef = doc(db, col, targetId);
      if (act === 'restore') {
        const restoreData = { status: col === 'products' ? 'available' : 'active', active: true, updatedAt: serverTimestamp() };
        updateDoc(docRef, restoreData).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: col, operation: 'update' }));
        });
        toast({ title: lang === 'ar' ? "تمت الاستعادة" : "Restored" });
      } else {
        deleteDoc(docRef).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: col, operation: 'delete' }));
        });
        toast({ variant: "destructive", title: lang === 'ar' ? "حذف نهائي" : "Purged" });
      }
      setIsSubmitting(false);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-600 rounded-lg text-white shadow-lg shadow-amber-900/20"><Trash2 className="w-5 h-5" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإدارة' : 'Management'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">سلة المهملات</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">الأرشيف الذكي الموحد</h1>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">إجمالي المحذوفات</p>
            <p className="text-lg font-black text-amber-600 tabular-nums">{allArchivedItems.length}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الأرشيف..." className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white border-slate-200`} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table className="text-right">
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                <TableRow>
                  <TableHead className="px-6 py-3 font-bold text-[11px] text-slate-500">العنصر</TableHead>
                  <TableHead className="px-6 py-3 font-bold text-[11px] text-slate-500">النوع</TableHead>
                  <TableHead className="px-6 py-3 font-bold text-[11px] text-slate-500">تاريخ الحذف</TableHead>
                  <TableHead className="w-[200px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري الفحص...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300">السلة فارغة</TableCell></TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                          {item.type === 'department' ? <Factory className="w-4 h-4" /> : 
                           item.type === 'worker' ? <User className="w-4 h-4" /> : 
                           item.type === 'material' ? <Box className="w-4 h-4" /> : 
                           <ShoppingBag className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-xs">{item.nameAr || item.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.code || item.workerId || item.sku}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase">
                        {item.type === 'department' ? 'قسم' : item.type === 'worker' ? 'عامل' : item.type === 'material' ? 'مادة' : 'منتج'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-slate-500 text-[11px] font-bold tabular-nums">
                      {item.deletedAt?.toDate?.().toLocaleDateString('ar-YE') || '---'}
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => { setSelectedItem(item); setActionType('restore'); }} variant="outline" className="h-8 px-3 rounded text-[10px] font-black gap-1.5 text-emerald-700">
                          <RotateCcw className="w-3 h-3" /> استعادة
                        </Button>
                        <Button onClick={() => { setSelectedItem(item); setActionType('purge'); }} variant="outline" className="h-8 px-3 rounded text-[10px] font-black gap-1.5 text-rose-600">
                          <Trash2 className="w-3 h-3" /> حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className={cn("p-8 text-center", actionType === 'restore' ? "premium-gradient" : "bg-rose-950")}>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
              {actionType === 'restore' ? <RotateCcw className="w-8 h-8 text-white" /> : <Skull className="w-8 h-8 text-rose-500" />}
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{actionType === 'restore' ? 'تأكيد الاستعادة' : 'حذف نهائي'}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 font-bold mt-2 text-xs">
              {actionType === 'restore' ? 'سيتم إعادة هذا العنصر لقاعدة البيانات النشطة.' : 'تحذير: سيتم مسح السجل تماماً ولا يمكن التراجع.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleAction} className={cn("flex-1 h-11 font-black text-white border-none", actionType === 'restore' ? "premium-gradient" : "bg-rose-600")}>تأكيد</AlertDialogAction>
            <AlertDialogCancel className="flex-1 h-11 font-black bg-slate-50">إلغاء</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
