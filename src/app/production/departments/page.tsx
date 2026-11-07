'use client';

import React, { useState, useMemo } from 'react';
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
  ArrowLeftRight,
  Info,
  Save,
  Activity,
  Users,
  Hash,
  Type,
  Globe,
  FileText,
  Layout,
  AlertTriangle
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
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

export default function DepartmentsPage() {
  const { lang } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deletingDept, setDeletingDept] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    descAr: ''
  });

  // Real-time collection fetch (excluding soft-deleted items)
  const departmentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'departments'), where('status', '!=', 'deleted'));
  }, [db]);

  const { data: departments, loading } = useCollection<any>(departmentsQuery);

  const filtered = (departments || []).filter(d => 
    d.nameAr?.includes(search) || 
    d.nameEn?.toLowerCase().includes(search.toLowerCase()) || 
    d.code?.includes(search)
  );

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const deptData = {
      ...formData,
      updatedAt: serverTimestamp(),
      status: 'active',
      workerCount: editingDept ? editingDept.workerCount : 0,
    };

    if (editingDept) {
      const docRef = doc(db, 'departments', editingDept.id);
      updateDoc(docRef, deptData).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: deptData
        }));
      });
    } else {
      const colRef = collection(db, 'departments');
      addDoc(colRef, {
        ...deptData,
        createdAt: serverTimestamp(),
      }).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: deptData
        }));
      });
    }

    setIsAddDialogOpen(false);
    setEditingDept(null);
    setFormData({ code: '', nameAr: '', nameEn: '', descAr: '' });
    
    toast({
      title: lang === 'ar' ? "تم الحفظ بنجاح" : "Saved Successfully",
      description: lang === 'ar' ? `تم تحديث بيانات القسم في قاعدة البيانات.` : `Department data updated in database.`,
    });
  };

  const handleTrashDepartment = () => {
    if (!db || !deletingDept) return;

    // BUSINESS RULE: Prevent deletion if workers are assigned
    if (deletingDept.workerCount > 0) {
      toast({
        variant: "destructive",
        title: lang === 'ar' ? "فشل الحذف" : "Deletion Failed",
        description: lang === 'ar' 
          ? "لا يمكن حذف هذا القسم لأنه يحتوي على عمال نشطين. يرجى نقل العمال أولاً." 
          : "Cannot delete this department because it has active workers. Transfer workers first.",
      });
      setDeletingDept(null);
      return;
    }

    // SOFT DELETE: Move to trash status
    const docRef = doc(db, 'departments', deletingDept.id);
    updateDoc(docRef, {
      status: 'deleted',
      deletedAt: serverTimestamp(),
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });

    toast({
      title: lang === 'ar' ? "تم النقل لسلة المحذوفات" : "Moved to Trash",
      description: lang === 'ar' 
        ? "سيتم حذف هذا القسم نهائياً بعد 30 يوماً." 
        : "This department will be permanently deleted after 30 days.",
    });
    setDeletingDept(null);
  };

  const handleEditClick = (dept: any) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      descAr: dept.descAr || ''
    });
    setIsAddDialogOpen(true);
  };

  const activeCount = (departments || []).filter(d => d.status === 'active').length;
  const totalWorkers = (departments || []).reduce((acc, curr) => acc + (curr.workerCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-12">
      {/* System Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
        <span>{lang === 'ar' ? 'نظام الإنتاج' : 'Production'}</span>
        <ChevronRight className="w-3 h-3 rotate-180 rtl:rotate-0" />
        <span className="text-primary">{lang === 'ar' ? 'إدارة الأقسام' : 'Departments'}</span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full" />
            {lang === 'ar' ? 'أقسام ومراحل الإنتاج' : 'Production Departments'}
          </h1>
          <p className="text-sm text-gray-400 font-medium ps-4">
            {lang === 'ar' ? 'إدارة حقيقية لمراكز التكلفة ومراحل سير العمل' : 'Real management of cost centers and workflow stages'}
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingDept(null);
            setFormData({ code: '', nameAr: '', nameEn: '', descAr: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/95 text-white gap-3 rounded-xl shadow-xl shadow-primary/10 font-black transition-all active:scale-95">
              <Plus className="w-5 h-5" />
              {lang === 'ar' ? 'إضافة قسم جديد' : 'New Department'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-2xl border-none shadow-2xl overflow-hidden p-0">
            <div className="bg-gradient-to-br from-primary via-[#0a7a44] to-[#054d2a] p-8 text-white relative">
              <div className="absolute top-0 left-0 p-6 opacity-10 rotate-12">
                <Factory className="w-32 h-32" />
              </div>
              <DialogHeader className="relative z-10 text-right rtl:text-right ltr:text-left">
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  <Layout className="w-6 h-6 text-secondary" />
                  {editingDept ? (lang === 'ar' ? 'تعديل القسم' : 'Edit Department') : (lang === 'ar' ? 'إضافة قسم جديد' : 'New Department')}
                </DialogTitle>
                <DialogDescription className="text-white/70 font-bold mt-2 text-sm leading-relaxed">
                  {lang === 'ar' 
                    ? 'أدخل بيانات القسم بدقة لضمان صحة توزيع التكاليف الصناعية.' 
                    : 'Enter department details accurately to ensure correct cost allocation.'}
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
                  <div className="flex items-center h-12 px-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-[11px] font-black text-emerald-700 gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {lang === 'ar' ? 'نشط' : 'Active'}
                  </div>
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
                  placeholder={lang === 'ar' ? 'مثال: قسم التطريز' : 'Arabic Name'} 
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
                  className="flex-1 h-14 bg-gradient-to-r from-primary to-[#0a7a44] hover:opacity-90 rounded-xl font-black gap-3 shadow-lg shadow-primary/10 text-base"
                >
                  <Save className="w-5 h-5" />
                  {lang === 'ar' ? 'حفظ البيانات' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddDialogOpen(false)} 
                  className="h-14 px-8 rounded-xl font-black text-gray-400 hover:text-gray-600"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modern Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm group hover:border-primary/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10"><Activity className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'الأقسام النشطة' : 'Active Units'}</p>
              <h3 className="text-2xl font-black tabular-nums">{loading ? '...' : activeCount}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm group hover:border-secondary/20 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary border border-secondary/10"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'إجمالي الحرفيين' : 'Total Artisans'}</p>
              <h3 className="text-2xl font-black tabular-nums">{loading ? '...' : totalWorkers}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-primary text-white border-none rounded-xl p-6 shadow-xl transition-all">
          <div className="absolute inset-0 opacity-10 textile-pattern" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{lang === 'ar' ? 'حالة المزامنة' : 'Sync Status'}</p>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'متصل لحظياً' : 'Live Sync'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-200/60 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن قسم...' : 'Search...'}
              className="pr-11 h-11 bg-gray-50/50 border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-primary/10"
            />
          </div>
          <Button variant="ghost" className="h-11 px-4 rounded-lg font-black gap-2 border border-dashed border-gray-200 text-gray-500 hover:text-primary hover:bg-primary/5">
            <Filter className="w-4 h-4" />
            {lang === 'ar' ? 'تصفية' : 'Filter'}
          </Button>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden">
        <Table className="text-right">
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200/60">
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">{lang === 'ar' ? 'المعرف' : 'UID'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">{lang === 'ar' ? 'القسم' : 'Dept Name'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6">{lang === 'ar' ? 'وصف المسار' : 'Process'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'القوى العاملة' : 'Workforce'}</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-wider text-gray-400 px-6 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="h-14 w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 animate-pulse font-black text-gray-400">جاري تحميل البيانات...</TableCell></TableRow>
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
                    <DropdownMenuContent align="end" className="rounded-xl border-gray-200 shadow-xl min-w-[180px] p-1">
                      <DropdownMenuItem onClick={() => handleEditClick(dept)} className="gap-3 font-bold text-xs py-2.5 cursor-pointer rounded-lg">
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Unit'}
                      </DropdownMenuItem>
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <DropdownMenuItem onClick={() => setDeletingDept(dept)} className="gap-3 font-bold text-xs py-2.5 cursor-pointer text-rose-600 focus:text-rose-700 rounded-lg">
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

      {/* Confirmation Alerts */}
      <AlertDialog open={!!deletingDept} onOpenChange={(open) => !open && setDeletingDept(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader className="text-right">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <AlertDialogTitle className="text-xl font-black">{lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-gray-500 mt-2">
              {lang === 'ar' 
                ? `سيتم نقل قسم "${deletingDept?.nameAr}" إلى سلة المحذوفات. لا يمكنك حذف الأقسام التي تحتوي على عمال نشطين.` 
                : `Section "${deletingDept?.nameEn}" will be moved to trash. You cannot delete sections with active workers.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-6">
            <AlertDialogAction onClick={handleTrashDepartment} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black px-6 h-12 flex-1">
              {lang === 'ar' ? 'تأكيد النقل للأرشيف' : 'Confirm Archive'}
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl border-gray-200 font-black h-12 flex-1">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer System Info */}
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
  );
}
