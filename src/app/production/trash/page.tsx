'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  ChevronRight, 
  Info, 
  ShieldAlert, 
  X, 
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
      <div className="flex-none px-4 md:px-8 pt-6 pb-4 bg-white border-b border-gray-200/60 shadow-sm z-30">
        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
          <span>{lang === 'ar' ? 'الإدارة' : 'Management'}</span>
          <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
          <span className="text-primary">{lang === 'ar' ? 'سلة المهملات' : 'Smart Trash'}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
              {lang === 'ar' ? 'الأرشيف وسلة المهملات' : 'Trash & Smart Archive'}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><Trash2 className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي المحذوفات' : 'Total Archived'}</p>
              <h3 className="text-sm font-black tabular-nums">{loading ? '...' : archivedItems?.length || 0}</h3>
            </div>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Timer className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">{lang === 'ar' ? 'فترة الحفظ' : 'Retention'}</p>
              <h3 className="text-sm font-black">30 {lang === 'ar' ? 'يوماً' : 'Days'}</h3>
            </div>
          </div>
          <div className="bg-[#1A1C1E] border-none p-4 rounded-xl flex items-center gap-4 text-white">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-amber-500"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{lang === 'ar' ? 'تحذير مالي' : 'Caution'}</p>
              <h3 className="text-xs font-bold leading-tight">{lang === 'ar' ? 'الاستعادة تؤثر على التقارير' : 'Affects Financials'}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200/60 p-2 rounded-xl">
          <div className="relative w-full max-w-md">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300`} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search archive...'}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 bg-white border-gray-200 rounded-lg text-xs font-bold`}
            />
          </div>
        </div>
      </div>

      {/* 2. Data Scroll Area */}
      <div className="flex-1 min-h-0 px-4 md:px-8 py-6 overflow-hidden flex flex-col">
        <div className="flex-1 bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto relative">
            <Table className="text-right border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md">
                <TableRow className="border-b border-gray-200/60">
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'العنصر' : 'Item'}</TableHead>
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'تاريخ الحذف' : 'Deleted Date'}</TableHead>
                  <TableHead className="h-12 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center whitespace-nowrap">{lang === 'ar' ? 'متبقي للحذف النهائي' : 'Days Remaining'}</TableHead>
                  <TableHead className="h-12 w-[280px] bg-gray-50/95 sticky right-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-black text-gray-400">جاري فحص الأرشيف...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 font-black text-gray-300">الأرشيف فارغ حالياً</TableCell></TableRow>
                ) : filtered.map((item) => {
                  const days = getDaysRemaining(item.deletedAt);
                  return (
                    <TableRow key={item.id} className="group hover:bg-gray-50/30 transition-all border-b border-gray-100/60">
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Factory className="w-5 h-5" /></div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900">{lang === 'ar' ? item.nameAr : item.nameEn}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.code}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-gray-500 font-bold text-xs tabular-nums">
                        {item.deletedAt ? (item.deletedAt.toDate ? item.deletedAt.toDate().toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US') : '...') : '---'}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${
                          days < 7 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <Timer className="w-3 h-3" />
                          {days} {lang === 'ar' ? 'أيام' : 'Days'}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 sticky right-0 bg-white group-hover:bg-gray-50/30">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => setRestoringItemId(item.id)} variant="ghost" className="h-9 px-4 rounded-lg font-black text-[10px] gap-2 text-primary hover:bg-primary/5 transition-all">
                            <RotateCcw className="w-3.5 h-3.5" /> {lang === 'ar' ? 'استعادة' : 'Restore'}
                          </Button>
                          <Button onClick={() => setDeletingPermanentlyItemId(item.id)} variant="ghost" className="h-9 px-4 rounded-lg font-black text-[10px] gap-2 text-rose-500 hover:bg-rose-50 transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'حذف نهائي' : 'Purge'}
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
      </div>

      {/* Dialogs */}
      <AlertDialog open={!!restoringItemId} onOpenChange={(open) => !open && setRestoringItemId(null)}>
        <AlertDialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-br from-[#1A1C1E] to-[#2D3136] p-10 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 mx-auto">
              <ShieldAlert className="w-10 h-10 text-blue-500" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-white text-center">
                {lang === 'ar' ? 'تأكيد استعادة عنصر' : 'Confirm Restoration'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 font-bold mt-4 text-sm text-center leading-relaxed">
                {lang === 'ar' 
                  ? `تنبيه: استعادة قسم "${selectedRestoringItem?.nameAr}" قد تؤثر على دقة التقارير المالية والإنتاجية السابقة. هل تود المتابعة؟` 
                  : `Warning: Restoring "${selectedRestoringItem?.nameEn}" may impact historical financial reports. Continue?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="bg-white p-8 flex gap-4">
            <AlertDialogAction onClick={handleRestore} className="flex-1 h-14 bg-primary text-white rounded-2xl font-black transition-all">
              {lang === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setRestoringItemId(null)} className="flex-1 h-14 bg-gray-50 text-gray-500 rounded-2xl font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPermanentlyItemId} onOpenChange={(open) => !open && setDeletingPermanentlyItemId(null)}>
        <AlertDialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-br from-rose-900 to-rose-950 p-10 text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20 mx-auto">
              <Skull className="w-10 h-10 text-rose-500" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-white text-center">
                {lang === 'ar' ? 'إجراء حذف نهائي' : 'Irreversible Final Purge'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-rose-200/60 font-bold mt-4 text-sm text-center leading-relaxed">
                {lang === 'ar' 
                  ? `تحذير شديد: أنت على وشك مسح قسم "${selectedDeletingItem?.nameAr}" نهائياً من خوادم الجمعية. لا يمكن التراجع.` 
                  : `Extreme Warning: You are about to purge "${selectedDeletingItem?.nameEn}" forever. This is permanent.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="bg-white p-8 flex gap-4">
            <AlertDialogAction onClick={handlePermanentDelete} className="flex-1 h-14 bg-rose-600 text-white rounded-2xl font-black transition-all">
              {lang === 'ar' ? 'حذف نهائي الآن' : 'Purge Permanently'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingPermanentlyItemId(null)} className="flex-1 h-14 bg-gray-50 text-gray-500 rounded-2xl font-black">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
