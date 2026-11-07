'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  Filter, 
  ChevronRight, 
  Save, 
  Database, 
  Layers, 
  Power, 
  PowerOff, 
  History, 
  Info, 
  Hash,
  Languages,
  Type,
  Activity,
  FileText,
  AlertCircle
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

export default function DepartmentsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    descAr: '',
    status: 'active'
  });

  const departmentsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'departments');
  }, [db]);

  const { data: departments, loading } = useCollection<any>(departmentsQuery);

  const filtered = useMemo(() => {
    const rawData = departments || [];
    return rawData
      .filter(d => d.status !== 'deleted')
      .filter(d => 
        (d.nameAr?.includes(search) || 
        d.nameEn?.toLowerCase().includes(search.toLowerCase()) || 
        d.code?.includes(search))
      )
      .sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [departments, search]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingDeptId(null);
    setIsSubmitting(false);
    setCodeError(null);
    setFormData({ code: '', nameAr: '', nameEn: '', descAr: '', status: 'active' });
  }, []);

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    // 1. Validation: Prevent Duplicate Code
    const isDuplicate = departments?.some(d => 
      d.code?.toLowerCase() === formData.code.toLowerCase() && 
      d.id !== editingDeptId && 
      d.status !== 'deleted'
    );

    if (isDuplicate) {
      setCodeError(lang === 'ar' ? `هذا الكود مستخدم بالفعل (مثال: ${formData.code})` : `This code is already in use (e.g., ${formData.code})`);
      return;
    }

    setIsSubmitting(true);
    const currentId = editingDeptId;
    const isEdit = !!currentId;
    
    const deptData = {
      code: formData.code.toUpperCase(),
      nameAr: formData.nameAr,
      nameEn: formData.nameEn,
      descAr: formData.descAr,
      status: formData.status,
      updatedAt: serverTimestamp(),
    };

    resetForm();

    setTimeout(() => {
      if (isEdit && currentId) {
        const docRef = doc(db, 'departments', currentId);
        updateDoc(docRef, deptData).catch((err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'departments',
            operation: 'update',
            requestResourceData: deptData
          }));
        });
        toast({ title: lang === 'ar' ? "تم التحديث" : "Updated" });
      } else {
        const colRef = collection(db, 'departments');
        const newDoc = { ...deptData, workerCount: 0, createdAt: serverTimestamp() };
        addDoc(colRef, newDoc).catch((err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'departments',
            operation: 'create',
            requestResourceData: newDoc
          }));
        });
        toast({ title: lang === 'ar' ? "تمت الإضافة" : "Added" });
      }
    }, 0);
  };

  const handleStatusToggle = (dept: any) => {
    if (!db) return;
    const newStatus = dept.status === 'active' ? 'inactive' : 'active';
    const docRef = doc(db, 'departments', dept.id);
    updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
  };

  const handleArchiveDepartment = () => {
    if (!db || !deletingDeptId) return;
    const targetId = deletingDeptId;
    setDeletingDeptId(null);

    setTimeout(() => {
      const docRef = doc(db, 'departments', targetId);
      updateDoc(docRef, {
        status: 'deleted',
        deletedAt: serverTimestamp(),
      });
      toast({ title: lang === 'ar' ? "تمت الأرشفة" : "Archived" });
    }, 0);
  };

  const handleEditClick = (dept: any) => {
    setEditingDeptId(dept.id);
    setFormData({
      code: dept.code || '',
      nameAr: dept.nameAr || '',
      nameEn: dept.nameEn || '',
      descAr: dept.descAr || '',
      status: dept.status || 'active'
    });
    setIsAddDialogOpen(true);
  };

  const stats = useMemo(() => {
    const list = departments || [];
    return {
      active: list.filter(d => d.status === 'active').length,
      totalWorkers: list.reduce((acc, curr) => acc + (curr.workerCount || 0), 0)
    };
  }, [departments]);

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* COMPACT ERP HUB - FIXED HEIGHT */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'إدارة الأقسام' : 'Departments'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'أقسام ومراحل العمل' : 'Work Centers & Departments'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'نشط' : 'Active'}</p>
                <p className="text-sm font-black text-emerald-600 tabular-nums">{loading ? '..' : stats.active}</p>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'العمال' : 'Labor'}</p>
                <p className="text-sm font-black text-slate-700 tabular-nums">{loading ? '..' : stats.totalWorkers}</p>
              </div>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md shadow-emerald-900/10 font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة قسم' : 'New Dept'}
            </Button>
          </div>
        </div>

        {/* SEARCH BAR - HIGH DENSITY */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث بالكود أو الاسم...' : 'Quick search...'}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white border-slate-200 rounded-md text-xs font-bold focus:ring-emerald-500/10 focus:border-emerald-500`}
            />
          </div>
          <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
            <Filter className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'تصفية' : 'Filter'}
          </Button>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-500">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {lang === 'ar' ? 'قاعدة البيانات متصلة' : 'System Ready'}
          </div>
        </div>
      </div>

      {/* MAIN DATA GRID - MAXIMUM SPACE */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto relative">
            <Table className="text-right">
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'الكود' : 'CODE'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'الاسم' : 'NAME'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap">{lang === 'ar' ? 'العمليات' : 'OPERATIONS'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-center whitespace-nowrap">{lang === 'ar' ? 'العمال' : 'STAFF'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-center whitespace-nowrap">{lang === 'ar' ? 'الحالة' : 'STATUS'}</TableHead>
                  <TableHead className="h-10 w-[60px] sticky right-0 bg-slate-100/95"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب البيانات...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد سجلات مطابقة</TableCell></TableRow>
                ) : filtered.map((dept) => (
                  <TableRow key={dept.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                    <TableCell className="px-6 py-3 font-bold text-emerald-700 text-[11px] tabular-nums tracking-wider">{dept.code}</TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-xs">{lang === 'ar' ? dept.nameAr : dept.nameEn}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'ar' ? dept.nameEn : dept.nameAr}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-slate-500 max-w-[300px] truncate text-[11px] font-medium">
                      {lang === 'ar' ? (dept.descAr || '---') : 'No details'}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-black text-slate-700 tabular-nums">
                        {dept.workerCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        dept.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dept.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        {dept.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'متوقف' : 'Inactive')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200 border border-transparent">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 shadow-xl min-w-[180px]">
                          <DropdownMenuItem onClick={() => handleEditClick(dept)} className="gap-3 font-bold text-xs cursor-pointer py-2.5">
                            <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(dept)} className="gap-3 font-bold text-xs cursor-pointer py-2.5">
                            {dept.status === 'active' ? <PowerOff className="w-3.5 h-3.5 text-amber-600" /> : <Power className="w-3.5 h-3.5 text-emerald-600" />}
                            {dept.status === 'active' ? (lang === 'ar' ? 'تعطيل' : 'Deactivate') : (lang === 'ar' ? 'تفعيل' : 'Activate')}
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-100 my-1" />
                          <DropdownMenuItem onClick={() => setDeletingDeptId(dept.id)} className="gap-3 font-bold text-xs cursor-pointer text-red-600 focus:text-red-700 py-2.5">
                            <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* SYSTEM NOTE - FOOTER */}
        <div className="mt-4 flex-none bg-slate-900 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {lang === 'ar' ? 'بروتوكول إدارة البيانات' : 'Data Management Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 font-bold opacity-80">
              {lang === 'ar' ? 'يتم حفظ كافة الحركات في سجل التدقيق المالي. العناصر المحذوفة تخضع لفترة سماح مدتها 30 يوماً.' : 'All transactions are logged for auditing. Deleted items have a 30-day grace period.'}
            </p>
          </div>
        </div>
      </div>

      {/* DIALOGS - ERP STYLE */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="premium-gradient p-6 text-white relative">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Layers className="w-5 h-5 text-emerald-300" />
                {editingDeptId ? (lang === 'ar' ? 'تعديل القسم' : 'Edit Center') : (lang === 'ar' ? 'قسم إنتاج جديد' : 'New Work Center')}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                {lang === 'ar' ? 'تهيئة مراكز التكلفة ومراحل سير العمل' : 'Configuration of cost centers and workflows'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveDepartment} className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Hash className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'كود القسم' : 'DEPT CODE'}
                </Label>
                <Input 
                  value={formData.code} 
                  onChange={(e) => {
                    setFormData({...formData, code: e.target.value});
                    setCodeError(null);
                  }} 
                  placeholder="DEPT-100" 
                  className={`h-10 font-bold text-xs bg-slate-50 border-slate-200 ${codeError ? 'border-red-500 focus:ring-red-500/10' : ''}`} 
                  required 
                />
                {codeError && (
                  <p className="text-[9px] font-bold text-red-600 flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {codeError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'الحالة' : 'STATUS'}
                </Label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold focus:outline-none">
                  <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{lang === 'ar' ? 'متوقف' : 'Inactive'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Languages className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'الاسم بالعربي' : 'ARABIC NAME'}
              </Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 border-slate-200" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Type className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'الاسم بالإنجليزي' : 'ENGLISH NAME'}
              </Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({...formData, nameEn: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 border-slate-200" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <FileText className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'وصف العمليات' : 'DESCRIPTION'}
              </Label>
              <Textarea value={formData.descAr} onChange={(e) => setFormData({...formData, descAr: e.target.value})} className="min-h-[80px] text-xs font-medium bg-slate-50 border-slate-200 resize-none" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md shadow-emerald-900/10">
                <Save className="w-4 h-4 me-2" />
                {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : 'Commit Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 rounded-md">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDeptId} onOpenChange={(open) => !open && setDeletingDeptId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة القسم' : 'Confirm Archive'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' 
                ? 'سيتم نقل هذا القسم للأرشيف. يمكنك استعادته خلال 30 يوماً قبل الحذف النهائي.' 
                : 'Item will be moved to archive. Recoverable for 30 days before purge.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveDepartment} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {lang === 'ar' ? 'تأكيد الأرشفة' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingDeptId(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
