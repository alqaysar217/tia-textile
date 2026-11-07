'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Factory, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  CheckCircle2,
  Filter,
  ChevronRight,
  Info,
  Save,
  Activity,
  Users,
  Hash,
  Type,
  Globe,
  FileText,
  Layout,
  Power,
  PowerOff,
  X,
  ShieldAlert
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
  DialogTrigger,
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
  
  // UI States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deletingDept, setDeletingDept] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      );
  }, [departments, search]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingDeptId(null);
    setIsSubmitting(false);
    setFormData({ code: '', nameAr: '', nameEn: '', descAr: '', status: 'active' });
  }, []);

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    setIsSubmitting(true);
    const currentId = editingDeptId;
    const isEdit = !!currentId;
    
    const deptData = {
      code: formData.code,
      nameAr: formData.nameAr,
      nameEn: formData.nameEn,
      descAr: formData.descAr,
      status: formData.status,
      updatedAt: serverTimestamp(),
    };

    // Release UI immediately
    resetForm(); 

    // Background Execution
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
        toast({ title: lang === 'ar' ? "تم التحديث بنجاح" : "Updated Successfully" });
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
        toast({ title: lang === 'ar' ? "تمت الإضافة بنجاح" : "Added Successfully" });
      }
    }, 0);
  };

  const handleStatusToggle = (dept: any) => {
    if (!db) return;
    const newStatus = dept.status === 'active' ? 'inactive' : 'active';
    const docRef = doc(db, 'departments', dept.id);
    
    updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
        }));
      });
  };

  const handleArchiveDepartment = () => {
    if (!db || !deletingDept) return;
    const deptToArchiveId = deletingDept.id;
    const deptWorkerCount = deletingDept.workerCount || 0;
    
    if (deptWorkerCount > 0) {
      setDeletingDept(null);
      toast({
        variant: "destructive",
        title: lang === 'ar' ? "إجراء غير مسموح" : "Action Prohibited",
        description: lang === 'ar' ? "لا يمكن أرشفة قسم يحتوي على عمال." : "Cannot archive department with workers.",
      });
      return;
    }

    setDeletingDept(null);

    setTimeout(() => {
      const docRef = doc(db, 'departments', deptToArchiveId);
      updateDoc(docRef, {
        status: 'deleted',
        deletedAt: serverTimestamp(),
      }).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'departments',
          operation: 'update',
        }));
      });
      toast({ title: lang === 'ar' ? "تم النقل للأرشيف" : "Archived" });
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

  const activeCount = useMemo(() => (departments || []).filter(d => d.status === 'active').length, [departments]);
  const totalWorkers = useMemo(() => (departments || []).reduce((acc, curr) => acc + (curr.workerCount || 0), 0), [departments]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-12">
      
      {/* 
          Master Sticky Hub: 
          Removed stupid space by using negative top margins to offset layout padding.
      */}
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 -mt-4 md:-mt-8 px-4 md:px-8 pt-6 pb-4 bg-[#F8F9FA]/95 backdrop-blur-xl border-b border-gray-200/60 mb-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-1.5 h-10 bg-primary rounded-full hidden md:block" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                  <span>{lang === 'ar' ? 'نظام الإنتاج' : 'Production'}</span>
                  <ChevronRight className={`w-2.5 h-2.5 ${dir === 'rtl' ? '' : 'rotate-180'}`} />
                  <span className="text-primary">{lang === 'ar' ? 'الأقسام' : 'Departments'}</span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                  {lang === 'ar' ? 'أقسام ومراحل الإنتاج' : 'Production Departments'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 bg-primary hover:bg-primary/95 text-white gap-2.5 rounded-xl shadow-lg shadow-primary/10 font-black transition-all active:scale-95 group">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    {lang === 'ar' ? 'إضافة قسم جديد' : 'New Dept'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] rounded-2xl border-none shadow-2xl overflow-hidden p-0">
                  <div className="bg-gradient-to-br from-primary via-[#0a7a44] to-[#054d2a] p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                      <Factory className="w-32 h-32" />
                    </div>
                    <DialogHeader className="relative z-10 text-right rtl:text-right ltr:text-left">
                      <DialogTitle className="text-2xl font-black flex items-center gap-3">
                        <Layout className="w-6 h-6 text-secondary" />
                        {editingDeptId ? (lang === 'ar' ? 'تعديل بيانات القسم' : 'Edit Department') : (lang === 'ar' ? 'إضافة قسم جديد' : 'New Department')}
                      </DialogTitle>
                      <DialogDescription className="text-white/70 font-bold mt-2 text-sm leading-relaxed">
                        {lang === 'ar' 
                          ? 'يرجى إدخال البيانات بدقة، حيث تُستخدم هذه المعلومات في توزيع التكاليف الصناعية.' 
                          : 'Please enter data accurately, as this info is used for cost allocation.'}
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <form onSubmit={handleSaveDepartment} className="p-8 space-y-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <Hash className="w-3 h-3 text-primary/60" />
                          {lang === 'ar' ? 'كود القسم' : 'Dept Code'}
                        </Label>
                        <Input 
                          value={formData.code}
                          onChange={(e) => setFormData({...formData, code: e.target.value})}
                          placeholder="DEPT-XXX" 
                          className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all ps-4" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-primary/60" />
                          {lang === 'ar' ? 'الحالة التشغيلية' : 'Status'}
                        </Label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full h-12 px-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-[11px] font-black text-emerald-700 focus:outline-none"
                        >
                          <option value="active">{lang === 'ar' ? 'نشط تشغيلياً' : 'Active'}</option>
                          <option value="inactive">{lang === 'ar' ? 'متوقف مؤقتاً' : 'Inactive'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Type className="w-3 h-3 text-primary/60" />
                        {lang === 'ar' ? 'اسم القسم (بالعربية)' : 'Name (Arabic)'}
                      </Label>
                      <Input 
                        value={formData.nameAr}
                        onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                        placeholder={lang === 'ar' ? 'مثال: قسم الخياطة' : 'Arabic Name'} 
                        className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Globe className="w-3 h-3 text-primary/60" />
                        {lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
                      </Label>
                      <Input 
                        value={formData.nameEn}
                        onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                        placeholder="English Name" 
                        className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all" 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-primary/60" />
                        {lang === 'ar' ? 'وصف العمليات' : 'Process Description'}
                      </Label>
                      <Textarea 
                        value={formData.descAr}
                        onChange={(e) => setFormData({...formData, descAr: e.target.value})}
                        placeholder={lang === 'ar' ? 'شرح للمهام التي تتم في هذا القسم...' : 'Operations details...'} 
                        className="rounded-xl border-gray-100 bg-gray-50/50 resize-none h-24 font-medium focus:bg-white focus:ring-primary/5 focus:border-primary/30 transition-all p-4 text-sm" 
                      />
                    </div>

                    <div className="pt-4 flex gap-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 h-14 bg-gradient-to-r from-primary to-[#0a7a44] hover:opacity-90 rounded-xl font-black gap-3 shadow-lg shadow-primary/10 text-base"
                      >
                        <Save className="w-5 h-5" />
                        {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : (isSubmitting ? 'Saving...' : 'Save Changes')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={resetForm} 
                        className="h-14 px-8 rounded-xl font-black text-gray-400 hover:text-gray-600"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 bg-white/50 px-4 py-2.5 rounded-lg border border-gray-100 group hover:border-primary/20 transition-all">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0"><Activity className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{lang === 'ar' ? 'الأقسام النشطة' : 'Active Units'}</p>
                <h3 className="text-sm font-black tabular-nums leading-none">{loading ? '...' : activeCount}</h3>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/50 px-4 py-2.5 rounded-lg border border-gray-100 group hover:border-secondary/20 transition-all">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary shrink-0"><Users className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{lang === 'ar' ? 'إجمالي الحرفيين' : 'Total Artisans'}</p>
                <h3 className="text-sm font-black tabular-nums leading-none">{loading ? '...' : totalWorkers}</h3>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-primary/10 px-4 py-2.5 rounded-lg border border-primary/10 group">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0"><CheckCircle2 className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">{lang === 'ar' ? 'حالة المزامنة' : 'Sync Status'}</p>
                <h3 className="text-sm font-black leading-none">{lang === 'ar' ? 'متصل لحظياً' : 'Live Sync'}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-1">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث عن قسم...' : 'Search...'}
                className={`${dir === 'rtl' ? 'pr-11' : 'pl-11'} h-11 bg-gray-50/50 border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-primary/10`}
              />
            </div>
            <Button variant="ghost" className="h-11 px-4 rounded-lg font-black gap-2 border border-dashed border-gray-200 text-gray-500 hover:text-primary hover:bg-primary/5">
              <Filter className="w-4 h-4" />
              {lang === 'ar' ? 'تصفية' : 'Filter'}
            </Button>
          </div>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden">
          <Table className="text-right">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200/60">
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right">{lang === 'ar' ? 'المعرف' : 'UID'}</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right">{lang === 'ar' ? 'القسم' : 'Dept Name'}</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-right">{lang === 'ar' ? 'وصف المسار' : 'Process'}</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'القوى العاملة' : 'Workforce'}</TableHead>
                <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="h-14 w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse font-black text-gray-400">جاري تحميل البيانات...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-black text-gray-300">لا توجد سجلات مطابقة للبحث</TableCell></TableRow>
              ) : filtered.map((dept) => (
                <TableRow key={dept.id} className="group hover:bg-gray-50/30 transition-all border-b border-gray-100/60">
                  <TableCell className="px-6 py-5 font-black text-primary/60 text-[10px] tabular-nums tracking-widest">{dept.code}</TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 group-hover:text-primary transition-colors">{lang === 'ar' ? dept.nameAr : dept.nameEn}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{lang === 'ar' ? dept.nameEn : dept.nameAr}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-gray-500 max-w-[280px] truncate text-[11px] font-bold">
                    {lang === 'ar' ? (dept.descAr || 'بدون وصف') : 'No description'}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-7 bg-gray-100 rounded-md text-[11px] font-black tabular-nums border border-gray-200/50">
                      {dept.workerCount || 0}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      dept.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full me-2 ${dept.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {dept.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'متوقف' : 'Inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-xl border-gray-200 shadow-xl min-w-[200px] p-1">
                        <DropdownMenuItem onClick={() => handleEditClick(dept)} className="gap-3 font-bold text-xs py-3 cursor-pointer rounded-lg">
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Details'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusToggle(dept)} className="gap-3 font-bold text-xs py-3 cursor-pointer rounded-lg">
                          {dept.status === 'active' ? <PowerOff className="w-3.5 h-3.5 text-amber-500" /> : <Power className="w-3.5 h-3.5 text-emerald-500" />}
                          {dept.status === 'active' ? (lang === 'ar' ? 'تعطيل القسم' : 'Deactivate') : (lang === 'ar' ? 'تفعيل القسم' : 'Activate')}
                        </DropdownMenuItem>
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                        <DropdownMenuItem onClick={() => setDeletingDept(dept)} className="gap-3 font-bold text-xs py-3 cursor-pointer text-rose-600 focus:text-rose-700 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Move to Archive'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!deletingDept} onOpenChange={(open) => !open && setDeletingDept(null)}>
          <AlertDialogContent className="max-w-md rounded-[2rem] border-none shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden p-0">
            <div className="bg-gradient-to-br from-[#1A1C1E] to-[#2D3136] p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] textile-pattern pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                  <ShieldAlert className="w-10 h-10 text-primary" />
                </div>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black text-white text-center leading-tight">
                    {lang === 'ar' ? 'إجراء أرشفة ذكي' : 'Smart Archiving Action'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400 font-bold mt-4 text-sm leading-relaxed text-center">
                    {lang === 'ar' 
                      ? `هل أنت متأكد من نقل قسم "${deletingDept?.nameAr}" إلى الأرشيف؟ سيتم الاحتفاظ به لمدة 30 يوماً قبل الحذف النهائي.` 
                      : `Move "${deletingDept?.nameEn}" to archive? It will be held for 30 days before final deletion.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
            
            <div className="bg-white p-8 flex gap-4">
              <AlertDialogAction 
                onClick={handleArchiveDepartment} 
                className="flex-1 h-14 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black shadow-xl shadow-primary/10 border-none transition-all active:scale-95"
              >
                {lang === 'ar' ? 'تأكيد الأرشفة' : 'Confirm Archive'}
              </AlertDialogAction>
              <AlertDialogCancel 
                onClick={() => setDeletingDept(null)}
                className="flex-1 h-14 bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-500 rounded-2xl font-black transition-all"
              >
                {lang === 'ar' ? 'تراجع' : 'Cancel'}
              </AlertDialogCancel>
            </div>
            
            <button 
              onClick={() => setDeletingDept(null)}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </AlertDialogContent>
        </AlertDialog>

        <div className="bg-muted/30 border border-border/50 rounded-xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{lang === 'ar' ? 'إدارة النزاهة والبيانات' : 'Data Integrity'}</p>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-4xl">
              {lang === 'ar' 
                ? 'النظام يطبق سياسة "الأرشفة الذكية". أي عنصر يتم حذفه ينتقل فوراً إلى سلة المحذوفات ويمكن استعادته خلال 30 يوماً قبل الحذف النهائي التلقائي. كما يمنع النظام حذف أي قسم مرتبط بعمال أو أوامر إنتاج قائمة لضمان دقة التقارير المالية.' 
                : 'The system applies "Smart Archiving". Deleted items move to trash and can be recovered within 30 days. Deletion of departments linked to workers or POs is blocked to ensure financial report integrity.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}