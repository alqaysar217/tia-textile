
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Calendar, 
  ChevronRight, 
  Info, 
  ShieldAlert, 
  X, 
  CheckCircle2,
  FileText,
  AlertTriangle,
  Factory,
  Users,
  Timer
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
  const { lang } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  
  // UI States
  const [restoringItem, setRestoringItem] = useState<any>(null);
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
    if (!db || !restoringItem || isSubmitting) return;

    setIsSubmitting(true);
    const itemId = restoringItem.id;
    
    // UI RECOVERY FIRST
    const itemToRestore = restoringItem;
    setRestoringItem(null);

    // Next tick execute
    setTimeout(() => {
      const docRef = doc(db, 'departments', itemId);
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
      
      toast({ 
        title: lang === 'ar' ? "تمت الاستعادة بنجاح" : "Restored Successfully",
        description: lang === 'ar' ? `تمت إعادة تنشيط القسم: ${itemToRestore.nameAr}` : `Department ${itemToRestore.nameEn} is active again.`
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
        <span>{lang === 'ar' ? 'الإدارة' : 'Management'}</span>
        <ChevronRight className="w-3 h-3 rotate-180 rtl:rotate-0" />
        <span className="text-primary">{lang === 'ar' ? 'سلة المهملات' : 'Smart Trash'}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
            {lang === 'ar' ? 'الأرشيف وسلة المهملات' : 'Trash & Smart Archive'}
          </h1>
          <p className="text-sm text-gray-400 font-medium ps-4">
            {lang === 'ar' ? 'إدارة العناصر المحذوفة مؤقتاً ومراجعة الأثر المالي قبل الاستعادة' : 'Manage temporarily deleted items and review financial impact'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100"><Trash2 className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي المحذوفات' : 'Total Archived'}</p>
              <h3 className="text-2xl font-black tabular-nums">{loading ? '...' : archivedItems?.length || 0}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100"><Timer className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'فترة الحفظ' : 'Retention Period'}</p>
              <h3 className="text-lg font-black">{lang === 'ar' ? '30 يوماً' : '30 Days'}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[#1A1C1E] text-white border-none rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10"><AlertTriangle className="w-6 h-6 text-amber-500" /></div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{lang === 'ar' ? 'تحذير مالي' : 'Financial Impact'}</p>
              <h3 className="text-xs font-bold leading-tight">{lang === 'ar' ? 'الاستعادة قد تؤثر على التقارير' : 'Restoration may affect reports'}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في الأرشيف...' : 'Search archive...'}
            className="pr-11 h-11 bg-gray-50/50 border-gray-200 rounded-lg text-sm font-bold"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden">
        <Table className="text-right">
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200/60">
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right">{lang === 'ar' ? 'العنصر' : 'Item'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right">{lang === 'ar' ? 'تاريخ الحذف' : 'Deleted Date'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'متبقي للحذف النهائي' : 'Days Remaining'}</TableHead>
              <TableHead className="h-14 w-[150px]"></TableHead>
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
                  <TableCell className="px-6 py-5">
                    <Button 
                      onClick={() => setRestoringItem(item)}
                      variant="ghost" 
                      className="h-9 px-4 rounded-lg font-black text-[10px] gap-2 text-primary hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'استعادة الآن' : 'Restore'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!restoringItem} onOpenChange={(open) => !open && setRestoringItem(null)}>
        <AlertDialogContent className="max-w-md rounded-[2rem] border-none shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden p-0">
          <div className="bg-gradient-to-br from-[#1A1C1E] to-[#2D3136] p-10 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
                <ShieldAlert className="w-10 h-10 text-blue-500" />
              </div>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black text-white text-center leading-tight">
                  {lang === 'ar' ? 'تأكيد استعادة عنصر' : 'Confirm Restoration'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400 font-bold mt-4 text-sm leading-relaxed text-center">
                  {lang === 'ar' 
                    ? `تنبيه: استعادة قسم "${restoringItem?.nameAr}" قد تؤثر على دقة التقارير المالية والإنتاجية السابقة. هل تود المتابعة؟` 
                    : `Warning: Restoring "${restoringItem?.nameEn}" may impact historical financial and productivity reports. Continue?`}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          
          <div className="bg-white p-8 flex gap-4">
            <AlertDialogAction 
              onClick={handleRestore} 
              className="flex-1 h-14 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black shadow-xl shadow-primary/10 border-none transition-all"
            >
              {lang === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore'}
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={() => setRestoringItem(null)}
              className="flex-1 h-14 bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-500 rounded-2xl font-black transition-all"
            >
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
          
          <button 
            onClick={() => setRestoringItem(null)}
            className="absolute top-4 left-4 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">{lang === 'ar' ? 'حول نظام الأرشفة' : 'About Archive System'}</p>
          <p className="text-[11px] text-blue-700 font-medium leading-relaxed max-w-4xl">
            {lang === 'ar' 
              ? 'تعتمد الجمعية سياسة أرشفة صارمة. العناصر المحذوفة تظل قابلة للاستعادة لمدة 30 يوماً فقط. بعد هذه الفترة، يتم تطهير البيانات نهائياً لضمان كفاءة النظام والامتثال لقواعد حماية البيانات. استعادة الأقسام تعيد تفعيلها في كافة أوامر الإنتاج الجديدة.' 
              : 'The association follows a strict archival policy. Deleted items remain restorable for 30 days only. After this period, data is permanently purged. Restoring departments re-activates them for all new production orders.'}
          </p>
        </div>
      </div>
    </div>
  );
}
