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
  AlertCircle,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Check,
  FileDown,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProduction } from '../ProductionContext';

export default function DepartmentsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const isRtl = lang === 'ar';

  // استيراد الصلاحيات من المحرك المركزي
  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.departments?.create;
  const canEdit = isAdmin || permissions.departments?.edit;
  const canDelete = isAdmin || permissions.departments?.delete;
  
  /**
   * دالة حارس الأمان لفك تجمد الواجهة يدوياً
   */
  const forceUIUnlock = useCallback(() => {
    requestAnimationFrame(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.body.removeAttribute('data-scroll-locked');
    });
  }, []);

  // Filtering & Sorting State
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'code' | 'nameAr' | 'actualWorkerCount'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const workersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'workers');
  }, [db]);

  const { data: departments, loading: deptsLoading } = useCollection<any>(departmentsQuery);
  const { data: workers, loading: workersLoading } = useCollection<any>(workersQuery);

  const loading = deptsLoading || workersLoading;

  const filtered = useMemo(() => {
    let rawData = (departments || []).map(dept => {
      const actualWorkerCount = (workers || []).filter(w => w.departmentId === dept.id && w.status !== 'deleted').length;
      return { ...dept, actualWorkerCount };
    });
    
    rawData = rawData.filter(d => d.status !== 'deleted');

    if (search) {
      const s = search.toLowerCase();
      rawData = rawData.filter(d => 
        (d.nameAr?.includes(s) || 
        d.nameEn?.toLowerCase().includes(s) || 
        d.code?.toLowerCase().includes(s))
      );
    }

    if (statusFilter !== 'all') {
      rawData = rawData.filter(d => d.status === statusFilter);
    }

    return rawData.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'actualWorkerCount') {
        const numA = Number(valA);
        const numB = Number(valB);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [departments, workers, search, statusFilter, sortBy, sortOrder]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingDeptId(null);
    setIsSubmitting(false);
    setCodeError(null);
    setFormData({ code: '', nameAr: '', nameEn: '', descAr: '', status: 'active' });
    forceUIUnlock();
  }, [forceUIUnlock]);

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    if (editingDeptId && !canEdit) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتعديل" : "Permission Denied" });
      return;
    }
    if (!editingDeptId && !canCreate) {
      toast({ variant: "destructive", title: isRtl ? "غير مسموح بالإضافة" : "Permission Denied" });
      return;
    }

    const isDuplicate = departments?.some(d => 
      d.code?.toLowerCase() === formData.code.toLowerCase() && 
      d.id !== editingDeptId && 
      d.status !== 'deleted'
    );

    if (isDuplicate) {
      setCodeError(isRtl ? "الكود مستخدم بالفعل" : "Code already in use");
      return;
    }

    setIsSubmitting(true);
    const targetEditingId = editingDeptId;
    setIsAddDialogOpen(false); // إغلاق مبكر

    try {
      const deptData = {
        code: formData.code.toUpperCase(),
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        descAr: formData.descAr,
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (targetEditingId) {
        await updateDoc(doc(db, 'departments', targetEditingId), deptData);
        toast({ title: isRtl ? "تم التحديث بنجاح" : "Updated Successfully" });
      } else {
        await addDoc(collection(db, 'departments'), { ...deptData, createdAt: serverTimestamp() });
        toast({ title: isRtl ? "تمت الإضافة بنجاح" : "Added Successfully" });
      }
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: isRtl ? "فشلت العملية" : "Failed", description: err.message });
      setIsAddDialogOpen(true); 
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleStatusToggle = async (dept: any) => {
    if (!db || !canEdit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newStatus = dept.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'departments', dept.id), { status: newStatus, updatedAt: serverTimestamp() });
      toast({ title: isRtl ? "تم تحديث الحالة" : "Status Updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveDepartment = async () => {
    if (!db || !deletingDeptId || !canDelete || isSubmitting) return;
    setIsSubmitting(true);
    const targetId = deletingDeptId;
    setDeletingDeptId(null); 

    try {
      await updateDoc(doc(db, 'departments', targetId), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
      });
      toast({ title: isRtl ? "تم الأرشفة بنجاح" : "Archived Successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Archive Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleEditClick = (dept: any) => {
    if (!canEdit) return;
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
    const list = filtered || [];
    return {
      active: list.filter(d => d.status === 'active').length,
      totalWorkers: list.reduce((acc, curr) => acc + (curr.actualWorkerCount || 0), 0)
    };
  }, [filtered]);

  const toggleSort = (key: 'code' | 'nameAr' | 'actualWorkerCount') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      lang === 'ar' ? 'كود القسم' : 'Code',
      lang === 'ar' ? 'اسم القسم (عربي)' : 'Name (AR)',
      lang === 'ar' ? 'اسم القسم (إنجليزي)' : 'Name (EN)',
      lang === 'ar' ? 'عدد العمال' : 'Staff Count',
      lang === 'ar' ? 'الحالة' : 'Status'
    ];
    const rows = filtered.map(d => [d.code, d.nameAr, d.nameEn, d.actualWorkerCount || 0, d.status]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `departments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: isRtl ? "تم تحميل ملف CSV" : "CSV Downloaded" });
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      
      {/* COMPACT ERP HUB - FIXED HEIGHT */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600 dark:text-slate-400">{isRtl ? 'الأقسام' : 'Departments'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {isRtl ? 'أقسام ومراحل العمل' : 'Work Centers'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isRtl ? 'نشط' : 'Active'}</p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{loading ? '..' : stats.active}</p>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center" />
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{isRtl ? 'العمال' : 'Labor'}</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{loading ? '..' : stats.totalWorkers}</p>
              </div>
            </div>
            
            {canCreate && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
                <Plus className="w-4 h-4" />
                {isRtl ? 'إضافة قسم' : 'New Dept'}
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500`} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? 'بحث بالكود أو الاسم...' : 'Quick search...'}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100`}
            />
          </div>
          
          <div className="flex items-center gap-1.5 px-1.5">
            <Button 
              onClick={handleExportCSV}
              variant="ghost" 
              className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isRtl ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <Filter className="w-3.5 h-3.5" />
                  {isRtl ? 'تصفية' : 'Filter'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-56 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب حسب' : 'SORT BY'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => toggleSort('code')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {isRtl ? 'الكود' : 'Code'}
                  </div>
                  {sortBy === 'code' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('nameAr')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Languages className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {isRtl ? 'الاسم' : 'Name'}
                  </div>
                  {sortBy === 'nameAr' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('actualWorkerCount')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {isRtl ? 'عدد العمال' : 'Labor Count'}
                  </div>
                  {sortBy === 'actualWorkerCount' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {isRtl ? 'قاعدة البيانات متصلة' : 'System Ready'}
          </div>
        </div>
      </div>

      {/* MAIN DATA GRID - FIXED HEADER */}
      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-auto relative no-scrollbar">
            <Table className="text-right border-separate border-spacing-0 w-full">
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b border-slate-200 dark:border-slate-700">
                  <TableHead className={cn("h-10 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الكود' : 'CODE'}</TableHead>
                  <TableHead className={cn("h-10 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>{isRtl ? 'الاسم' : 'NAME'}</TableHead>
                  <TableHead className={cn("h-10 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 px-6 whitespace-nowrap bg-inherit", isRtl ? "text-right" : "text-left")}>{isRtl ? 'وصف العمليات' : 'OPERATIONS'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">{isRtl ? 'العمال' : 'STAFF'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 px-6 text-center whitespace-nowrap bg-inherit">{isRtl ? 'الحالة' : 'STATUS'}</TableHead>
                  <TableHead className="h-10 w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-none"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">جاري سحب البيانات...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300 dark:text-slate-800">لا توجد سجلات مطابقة</TableCell></TableRow>
                ) : filtered.map((dept) => (
                  <TableRow key={dept.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <TableCell className={cn("px-6 py-3 font-bold text-emerald-700 dark:text-emerald-400 text-[11px] tabular-nums tracking-wider", isRtl ? "text-right" : "text-left")}>{dept.code}</TableCell>
                    <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{isRtl ? dept.nameAr : dept.nameEn}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{isRtl ? dept.nameEn : dept.nameAr}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("px-6 py-3 text-slate-500 dark:text-slate-400 max-w-[300px] truncate text-[11px] font-medium", isRtl ? "text-right" : "text-left")}>
                      {isRtl ? (dept.descAr || '---') : (dept.descAr || '---')}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-black text-slate-700 dark:text-slate-300 tabular-nums">
                        {dept.actualWorkerCount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase border transition-all ${
                        dept.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dept.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        {dept.status === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'متوقف' : 'Inactive')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border-l border-slate-100 dark:border-slate-800">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl min-w-[180px]">
                          {canEdit && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditClick(dept)} className="gap-3 font-bold text-xs py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                                <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'تعديل' : 'Edit'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusToggle(dept)} className="gap-3 font-bold text-xs py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                                {dept.status === 'active' ? <PowerOff className="w-3.5 h-3.5 text-amber-600" /> : <Power className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                {dept.status === 'active' ? (isRtl ? 'تعطيل' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Activate')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                              <DropdownMenuItem onClick={() => setDeletingDeptId(dept.id)} className="gap-3 font-bold text-xs text-red-600 dark:text-rose-400 focus:text-red-700 dark:focus:bg-rose-900/20 py-2.5">
                                <Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'نقل للأرشيف' : 'Archive'}
                              </DropdownMenuItem>
                            </>
                          )}
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
        <div className="mt-4 flex-none bg-slate-900 dark:bg-slate-900/80 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner transition-colors duration-300">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 shrink-0"><Info className="w-4 h-4" /></div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">
              {isRtl ? 'بروتوكول إدارة البيانات' : 'Data Management Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-400 font-bold opacity-80 leading-relaxed">
              {isRtl ? 'يتم حفظ كافة الحركات في سجل التدقيق المالي. العناصر المحذوفة تخضع لفترة سماح مدتها 30 يوماً.' : 'All transactions are logged for auditing. Deleted items have a 30-day grace period.'}
            </p>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); forceUIUnlock(); }}>
        <DialogContent className="sm:max-w-[500px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900 transition-colors duration-300">
          <div className="premium-gradient p-6 text-white relative">
            <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Layers className="w-5 h-5 text-emerald-300" />
                {editingDeptId ? (isRtl ? 'تعديل القسم' : 'Edit Center') : (isRtl ? 'قسم إنتاج جديد' : 'New Work Center')}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                {isRtl ? 'تهيئة مراكز التكلفة ومراحل سير العمل' : 'Configuration of cost centers and workflows'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveDepartment} className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
                  <Hash className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {isRtl ? 'كود القسم' : 'DEPT CODE'}
                </Label>
                <input 
                  value={formData.code} 
                  onChange={(e) => {
                    setFormData({...formData, code: e.target.value});
                    setCodeError(null);
                  }} 
                  placeholder="DEPT-100" 
                  className={cn(
                    "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100",
                    codeError && "border-red-500 focus:ring-red-500/10"
                  )} 
                  required 
                />
                {codeError && (
                  <p className={cn("text-[9px] font-bold text-red-600 dark:text-rose-400 flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1", isRtl ? "justify-start" : "justify-start")}>
                    <AlertCircle className="w-2.5 h-2.5" />
                    {codeError}
                  </p>
                )}
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
                  <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {isRtl ? 'الحالة' : 'STATUS'}
                </Label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 transition-colors" dir={dir}>
                  <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{isRtl ? 'متوقف' : 'Inactive'}</option>
                </select>
              </div>
            </div>

            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
                <Languages className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {isRtl ? 'الاسم بالعربي' : 'ARABIC NAME'}
              </Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100" dir={dir} required />
            </div>

            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
                <Type className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {isRtl ? 'الاسم بالإنجليزي' : 'ENGLISH NAME'}
              </Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({...formData, nameEn: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100" dir={dir} required />
            </div>

            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className={cn("text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2", isRtl ? "justify-start" : "justify-start")}>
                <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {isRtl ? 'وصف العمليات' : 'DESCRIPTION'}
              </Label>
              <Textarea value={formData.descAr} onChange={(e) => setFormData({...formData, descAr: e.target.value})} className="min-h-[80px] text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-300 resize-none outline-none focus:bg-white dark:focus:bg-slate-800 transition-all" dir={dir} />
            </div>

            <div className="flex gap-3 pt-2 border-t dark:border-slate-800">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 premium-gradient hover:opacity-90 text-white rounded-md font-black text-sm border-none shadow-md shadow-emerald-900/10 transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {isRtl ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : 'Commit Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 dark:text-slate-500 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDeptId} onOpenChange={(open) => { if(!open) setDeletingDeptId(null); forceUIUnlock(); }}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900 transition-colors duration-300">
          <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Layers className="w-32 h-32 text-white" /></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'أرشفة القسم' : 'Confirm Archive'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
              {isRtl 
                ? 'سيتم نقل هذا القسم للأرشيف. يمكنك استعادته خلال 30 يوماً قبل الحذف النهائي.' 
                : 'Item will be moved to archive. Recoverable for 30 days before purge.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveDepartment} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg transition-all active:scale-95">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : (isRtl ? 'تأكيد' : 'Confirm')}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingDeptId(null)} className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              {isRtl ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
