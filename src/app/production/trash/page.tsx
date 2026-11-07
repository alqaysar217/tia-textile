'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  ChevronRight, 
  Info, 
  ShieldAlert, 
  Timer,
  Skull,
  AlertTriangle,
  Factory
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
  
  // UI States
  const [restoringItemId, setRestoringItemId] = useState<string | null>(null);
  const [deletingPermanentlyItemId, setDeletingPermanentlyItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all archived departments
  const trashQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'departments'), 
      where('status', '==', 'deleted')
    );
  }, [db]);

  const { data: archivedItems, loading } = useCollection<any>(trashQuery);

  const filtered = useMemo(() => {
    const rawData = archivedItems || [];
    return rawData.filter(item => 
      (item.nameAr?.includes(search) || 
      item.nameEn?.toLowerCase().includes(search.toLowerCase()) || 
      item.code?.includes(search))
    );
  }, [archivedItems, search]);

  const handleRestore = () => {
    if (!db || !restoringItemId || isSubmitting) return;

    setIsSubmitting(true);
    const targetId = restoringItemId;
    setRestoringItemId(null);

    setTimeout(() => {
      const docRef = doc(db, 'departments', targetId);
      updateDoc(docRef, {
        status: 'active',
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'departments',
          operation: 'update',
        }));
      });
      
      toast({ title: lang === 'ar' ? "تمت الاستعادة بنجاح" : "Restored Successfully" });
      setIsSubmitting(false);
    }, 0);
  };

  const handlePermanentDelete = () => {
    if (!db || !deletingPermanentlyItemId || isSubmitting) return;

    setIsSubmitting(true);
    const targetId = deletingPermanentlyItemId;
    setDeletingPermanentlyItemId(null);

    setTimeout(() => {
      const docRef = doc(db, 'departments', targetId);
      deleteDoc(docRef).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'departments',
          operation: 'delete',
        }));
      });
      
      toast({ 
        variant: "destructive",
        title: lang === 'ar' ? "تم الحذف النهائي" : "Permanently Deleted" 
      });
      setIsSubmitting(false);
    }, 0);
  };

  const getDaysRemaining = (deletedAt: any) => {
    if (!deletedAt) return 30;
    const date = deletedAt.toDate ? deletedAt.toDate() : new Date(deletedAt);
    const diff = Date.now() - date.getTime();
    const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  const selectedRestoringItem = useMemo(() => archivedItems?.find(i => i.id === restoringItemId), [archivedItems, restoringItemId]);
  const selectedDeletingItem = useMemo(() => archivedItems?.find(i => i.id === deletingPermanentlyItemId), [archivedItems, deletingPermanentlyItemId]);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      
      {/* 1. Header Hub */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-amber-600 rounded-lg text-white shadow-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإدارة' : 'Management'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'سلة المهملات' : 'Trash'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'الأرشيف وسلة المهملات الذكية' : 'Smart Archive & Trash'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المؤرشف' : 'Items'}</p>
                <p className="text-sm font-black text-amber-600 tabular-nums">{loading ? '..' : archivedItems?.length || 0}</p>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المدة' : 'Period'}</p>
                <p className="text-sm font-black text-slate-700 tabular-nums">30 {lang === 'ar' ? 'يوماً' : 'D'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search archive...'}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white border-slate-200 rounded-md text-xs font-bold focus:ring-emerald-500/10 focus:border-emerald-500`}
            />
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-500">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            {lang === 'ar' ? 'تحذير مالي: الاستعادة تؤثر على التقارير' : 'Restore affects historical reports'}
          </div>
        </div>
      </div>

      {/* 2. MAIN DATA GRID */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto relative">
            <Table className="text-right">
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'العنصر' : 'ITEM'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'تاريخ الحذف' : 'DELETED'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-center whitespace-nowrap">{lang === 'ar' ? 'متبقي' : 'REMAINING'}</TableHead>
                  <TableHead className="h-10 w-[240px] sticky right-0 bg-slate-100/95"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري فحص الأرشيف...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300">الأرشيف فارغ حالياً</TableCell></TableRow>
                ) : filtered.map((item) => {
                  const days = getDaysRemaining(item.deletedAt);
                  return (
                    <TableRow key={item.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400"><Factory className="w-4 h-4" /></div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">{lang === 'ar' ? item.nameAr : item.nameEn}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{item.code}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-slate-500 text-[11px] font-bold tabular-nums">
                        {item.deletedAt ? (item.deletedAt.toDate ? item.deletedAt.toDate().toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US') : '...') : '---'}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black ${
                          days < 7 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <Timer className="w-3 h-3" />
                          {days} {lang === 'ar' ? 'يوماً' : 'D'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => setRestoringItemId(item.id)} variant="outline" className="h-8 px-3 rounded text-[10px] font-black gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                            <RotateCcw className="w-3 h-3" /> {lang === 'ar' ? 'استعادة' : 'Restore'}
                          </Button>
                          <Button onClick={() => setDeletingPermanentlyItemId(item.id)} variant="outline" className="h-8 px-3 rounded text-[10px] font-black gap-1.5 text-rose-600 border-rose-100 hover:bg-rose-50">
                            <Trash2 className="w-3 h-3" /> {lang === 'ar' ? 'حذف نهائي' : 'Purge'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4 flex-none bg-slate-900 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner">
          <div className="w-8 h-8 bg-amber-500/20 rounded flex items-center justify-center text-amber-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {lang === 'ar' ? 'بروتوكول الحذف الذكي' : 'Smart Purge Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 font-bold opacity-80">
              {lang === 'ar' ? 'يتم الاحتفاظ بالبيانات لمدة 30 يوماً. الحذف النهائي إجراء غير قابل للتراجع ويتم توثيقه في سجل النظام.' : 'Data is kept for 30 days. Final purge is irreversible and logged in system audit trail.'}
            </p>
          </div>
        </div>
      </div>

      {/* DIALOGS - ERP STYLE */}
      <AlertDialog open={!!restoringItemId} onOpenChange={(open) => !open && setRestoringItemId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-emerald-950 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-inner">
              <RotateCcw className="w-8 h-8 text-emerald-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'تأكيد استعادة عنصر' : 'Confirm Restoration'}</AlertDialogTitle>
            <AlertDialogDescription className="text-emerald-100/60 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' 
                ? `تنبيه: استعادة قسم "${selectedRestoringItem?.nameAr}" قد تؤثر على دقة التقارير المالية السابقة. هل تود المتابعة؟` 
                : `Warning: Restoring "${selectedRestoringItem?.nameEn}" may impact historical reports. Continue?`}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleRestore} className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-black">
              {lang === 'ar' ? 'تأكيد الاستعادة' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setRestoringItemId(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPermanentlyItemId} onOpenChange={(open) => !open && setDeletingPermanentlyItemId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-rose-950 p-8 text-center">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
              <Skull className="w-8 h-8 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'حذف نهائي بات' : 'Final Irreversible Purge'}</AlertDialogTitle>
            <AlertDialogDescription className="text-rose-200/60 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' 
                ? `تحذير شديد: سيتم مسح قسم "${selectedDeletingItem?.nameAr}" من خوادم النظام للأبد. لا يمكن التراجع عن هذا الإجراء.` 
                : `Extreme Warning: "${selectedDeletingItem?.nameEn}" will be purged forever. This action cannot be undone.`}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handlePermanentDelete} className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-black">
              {lang === 'ar' ? 'حذف نهائي الآن' : 'Purge Now'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingPermanentlyItemId(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}