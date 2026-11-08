'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  Users, 
  UserPlus, 
  Power, 
  PowerOff, 
  History, 
  Info, 
  Hash,
  Languages,
  Activity,
  AlertCircle,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Check,
  Phone,
  Calendar,
  Briefcase,
  User as UserIcon,
  UploadCloud,
  Loader2,
  FileDown,
  ShieldCheck,
  UserCheck,
  Users2
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
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function WorkersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'supervisors' | 'workers'>('all');
  const [sortBy, setSortBy] = useState<'fullName' | 'joinDate' | 'workerId'>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [deletingWorkerId, setDeletingWorkerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    departmentId: '',
    phoneNumber: '',
    photoUrl: '',
    joinDate: new Date().toISOString().split('T')[0],
    active: true,
    isSupervisor: false,
    supervisorId: ''
  });

  const workersQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'workers');
  }, [db]);

  const departmentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'departments'), where('status', '==', 'active'));
  }, [db]);

  const { data: workers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: departments } = useCollection<any>(departmentsQuery);

  // Get only supervisors for the dropdown selection
  const supervisors = useMemo(() => {
    return (workers || []).filter(w => w.isSupervisor && w.status !== 'deleted' && w.active);
  }, [workers]);

  const filtered = useMemo(() => {
    let rawData = [...(workers || [])];
    
    rawData = rawData.filter(w => w.status !== 'deleted');

    if (search) {
      rawData = rawData.filter(w => 
        w.fullName?.toLowerCase().includes(search.toLowerCase()) || 
        w.phoneNumber?.includes(search) ||
        w.workerId?.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      rawData = rawData.filter(w => w.active === isActive);
    }

    if (deptFilter !== 'all') {
      rawData = rawData.filter(w => w.departmentId === deptFilter);
    }

    if (roleFilter === 'supervisors') {
      rawData = rawData.filter(w => w.isSupervisor === true);
    } else if (roleFilter === 'workers') {
      rawData = rawData.filter(w => w.isSupervisor !== true);
    }

    return rawData.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [workers, search, statusFilter, deptFilter, roleFilter, sortBy, sortOrder]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingWorkerId(null);
    setIsSubmitting(false);
    setIsCompressing(false);
    setValidationError(null);
    setFormData({ 
      fullName: '', 
      departmentId: '', 
      phoneNumber: '', 
      photoUrl: '',
      joinDate: new Date().toISOString().split('T')[0], 
      active: true,
      isSupervisor: false,
      supervisorId: ''
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: lang === 'ar' ? "خطأ في الملف" : "File Error", description: lang === 'ar' ? "يرجى اختيار صورة صالحة فقط" : "Please select a valid image" });
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
        setIsCompressing(false);
      };
    };
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || isCompressing) return;

    const isDuplicateName = workers?.some(w => 
      w.fullName?.toLowerCase() === formData.fullName.toLowerCase() && 
      w.id !== editingWorkerId && 
      w.status !== 'deleted'
    );

    if (isDuplicateName) {
      setValidationError(lang === 'ar' ? "هذا الاسم مسجل مسبقاً في النظام" : "This name is already registered");
      return;
    }

    setIsSubmitting(true);
    const currentId = editingWorkerId;
    const isEdit = !!currentId;
    
    const workerData = {
      fullName: formData.fullName,
      departmentId: formData.departmentId,
      phoneNumber: formData.phoneNumber,
      photoUrl: formData.photoUrl,
      joinDate: formData.joinDate,
      active: formData.active,
      isSupervisor: formData.isSupervisor,
      supervisorId: formData.isSupervisor ? '' : formData.supervisorId, // Supervisor can't have a supervisor
      updatedAt: serverTimestamp(),
    };

    resetForm();

    setTimeout(() => {
      if (isEdit && currentId) {
        const docRef = doc(db, 'workers', currentId);
        updateDoc(docRef, workerData).catch((err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'workers',
            operation: 'update',
            requestResourceData: workerData
          }));
        });
        toast({ title: lang === 'ar' ? "تم تحديث البيانات" : "Updated" });
      } else {
        const colRef = collection(db, 'workers');
        const workerId = `WRK-${Math.floor(1000 + Math.random() * 9000)}`;
        const newDoc = { ...workerData, workerId, createdAt: serverTimestamp() };
        addDoc(colRef, newDoc).catch((err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'workers',
            operation: 'create',
            requestResourceData: newDoc
          }));
        });
        toast({ title: lang === 'ar' ? "تم التسجيل بنجاح" : "Registered Successfully" });
      }
    }, 0);
  };

  const handleStatusToggle = (worker: any) => {
    if (!db) return;
    const docRef = doc(db, 'workers', worker.id);
    updateDoc(docRef, { active: !worker.active, updatedAt: serverTimestamp() });
  };

  const handleArchiveWorker = () => {
    if (!db || !deletingWorkerId) return;
    const targetId = deletingWorkerId;
    setDeletingWorkerId(null);

    setTimeout(() => {
      const docRef = doc(db, 'workers', targetId);
      updateDoc(docRef, {
        status: 'deleted',
        deletedAt: serverTimestamp(),
      });
      toast({ title: lang === 'ar' ? "تم النقل للأرشيف" : "Archived" });
    }, 0);
  };

  const handleEditClick = (worker: any) => {
    setEditingWorkerId(worker.id);
    setFormData({
      fullName: worker.fullName || '',
      departmentId: worker.departmentId || '',
      phoneNumber: worker.phoneNumber || '',
      photoUrl: worker.photoUrl || '',
      joinDate: worker.joinDate || '',
      active: worker.active ?? true,
      isSupervisor: worker.isSupervisor ?? false,
      supervisorId: worker.supervisorId || ''
    });
    setIsAddDialogOpen(true);
  };

  const stats = useMemo(() => {
    const list = workers || [];
    const activeOnes = list.filter(w => w.active && w.status !== 'deleted');
    return {
      active: activeOnes.length,
      supervisors: activeOnes.filter(w => w.isSupervisor).length,
      total: list.filter(w => w.status !== 'deleted').length
    };
  }, [workers]);

  const toggleSort = (key: 'fullName' | 'joinDate' | 'workerId') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
      lang === 'ar' ? 'المعرف' : 'ID',
      lang === 'ar' ? 'الرتبة' : 'Role',
      lang === 'ar' ? 'القسم' : 'Department',
      lang === 'ar' ? 'المشرف المسؤول' : 'Supervisor',
      lang === 'ar' ? 'رقم الهاتف' : 'Phone',
      lang === 'ar' ? 'الحالة' : 'Status'
    ];

    const escapeCSV = (val: any) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map(w => {
      const dept = departments?.find(d => d.id === w.departmentId);
      const sup = supervisors.find(s => s.id === w.supervisorId);
      return [
        escapeCSV(w.fullName),
        escapeCSV(w.workerId),
        w.isSupervisor ? (lang === 'ar' ? 'مشرف' : 'Supervisor') : (lang === 'ar' ? 'عامل' : 'Worker'),
        dept ? escapeCSV(lang === 'ar' ? dept.nameAr : dept.nameEn) : '---',
        sup ? escapeCSV(sup.fullName) : '---',
        escapeCSV(w.phoneNumber || '---'),
        w.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مجاز' : 'Inactive')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workers_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: lang === 'ar' ? "تم تحميل ملف CSV" : "CSV Downloaded" });
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الموارد البشرية' : 'HR'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'سجل الحرفيين والمشرفين' : 'Workforce'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'قاعدة بيانات القوى العاملة' : 'Personnel Master Data'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'مشرفين' : 'Sups'}</p>
                <p className="text-sm font-black text-emerald-600 tabular-nums">{workersLoading ? '..' : stats.supervisors}</p>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'عمال' : 'Workers'}</p>
                <p className="text-sm font-black text-slate-700 tabular-nums">{workersLoading ? '..' : stats.active - stats.supervisors}</p>
              </div>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <UserPlus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة موظف' : 'Enroll Personnel'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث باسم الموظف أو المعرف...' : 'Search by name or ID...'}
              className={`w-full ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} h-9 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-emerald-500/10 focus:border-emerald-500 outline-none`}
            />
          </div>
          
          <div className="flex items-center gap-1.5 px-1.5">
            <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'ar' ? 'تصدير' : 'Export'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
                  <Filter className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تصفية' : 'Filter'}
                  {(statusFilter !== 'all' || deptFilter !== 'all' || roleFilter !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-lg border-slate-200 shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'الرتبة الوظيفية' : 'RANK'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setRoleFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'الكل' : 'All Roles'}
                  {roleFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('supervisors')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'المشرفين فقط' : 'Supervisors Only'}
                  {roleFilter === 'supervisors' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('workers')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                  {lang === 'ar' ? 'العمال فقط' : 'Workers Only'}
                  {roleFilter === 'workers' && <Check className="w-3 h-3 text-emerald-600" />}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'فلترة الأقسام' : 'DEPARTMENT'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setDeptFilter('all')} className="text-xs font-bold cursor-pointer py-2">
                  {lang === 'ar' ? 'جميع الأقسام' : 'All Departments'}
                  {deptFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </DropdownMenuItem>
                {departments?.map(d => (
                  <DropdownMenuItem key={d.id} onClick={() => setDeptFilter(d.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2">
                    {lang === 'ar' ? d.nameAr : d.nameEn}
                    {deptFilter === d.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'الحالة' : 'STATUS'}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-xs font-bold cursor-pointer">{lang === 'ar' ? 'الكل' : 'All'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')} className="text-xs font-bold cursor-pointer">{lang === 'ar' ? 'نشط' : 'Active'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')} className="text-xs font-bold cursor-pointer">{lang === 'ar' ? 'مجاز' : 'Inactive'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2 px-3 text-[10px] font-bold text-slate-500">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            {lang === 'ar' ? 'نظام الرقابة الإدارية' : 'Management Control System'}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto relative no-scrollbar">
            <Table className="text-right border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap bg-inherit">
                    <button onClick={() => toggleSort('fullName')} className="flex items-center gap-2 hover:text-emerald-700 transition-colors uppercase">
                      {lang === 'ar' ? 'الموظف' : 'PERSONNEL'}
                      {sortBy === 'fullName' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap bg-inherit">{lang === 'ar' ? 'الرتبة' : 'RANK'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap bg-inherit">{lang === 'ar' ? 'القسم' : 'UNIT'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-right whitespace-nowrap bg-inherit">{lang === 'ar' ? 'المشرف المسؤول' : 'DIRECT SUPERVISOR'}</TableHead>
                  <TableHead className="h-10 font-bold text-[11px] uppercase text-slate-500 px-6 text-center whitespace-nowrap bg-inherit">{lang === 'ar' ? 'الحالة' : 'STATUS'}</TableHead>
                  <TableHead className="h-10 w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workersLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب الهيكل التنظيمي...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد سجلات مطابقة</TableCell></TableRow>
                ) : filtered.map((worker) => {
                  const dept = departments?.find(d => d.id === worker.departmentId);
                  const supervisor = supervisors.find(s => s.id === worker.supervisorId);
                  return (
                    <TableRow key={worker.id} className="group hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className={cn("h-9 w-9 rounded-lg border-2", worker.isSupervisor ? "border-emerald-200" : "border-slate-100")}>
                            <AvatarImage src={worker.photoUrl || undefined} alt={worker.fullName} className="object-cover" />
                            <AvatarFallback className={cn("text-[10px] font-black uppercase", worker.isSupervisor ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500")}>
                              {worker.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs">{worker.fullName}</span>
                            <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-widest uppercase">{worker.workerId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {worker.isSupervisor ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black uppercase">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {lang === 'ar' ? 'مشرف قسم' : 'Supervisor'}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[9px] font-black uppercase">
                            <UserIcon className="w-2.5 h-2.5" />
                            {lang === 'ar' ? 'حرفي / عامل' : 'Worker'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <span className="font-bold text-slate-600 text-xs">{dept ? (lang === 'ar' ? dept.nameAr : dept.nameEn) : '---'}</span>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {worker.isSupervisor ? (
                          <span className="text-[9px] font-bold text-slate-300 italic uppercase">---</span>
                        ) : supervisor ? (
                          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                            {supervisor.fullName}
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-300 italic">{lang === 'ar' ? 'لم يعين مشرف' : 'No Supervisor'}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          worker.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${worker.active ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                          {worker.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مجاز' : 'Inactive')}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] border-l border-slate-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="rounded-lg border-slate-200 shadow-xl min-w-[180px]">
                            <DropdownMenuItem onClick={() => handleEditClick(worker)} className="gap-3 font-bold text-xs py-2.5"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل الملف' : 'Update Info'}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusToggle(worker)} className="gap-3 font-bold text-xs py-2.5">
                              {worker.active ? <PowerOff className="w-3.5 h-3.5 text-amber-600" /> : <Power className="w-3.5 h-3.5 text-emerald-600" />}
                              {worker.active ? (lang === 'ar' ? 'منح إجازة' : 'Activate') : (lang === 'ar' ? 'تفعيل' : 'Deactivate')}
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => setDeletingWorkerId(worker.id)} className="gap-3 font-bold text-xs text-red-600 py-2.5"><Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive'}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4 flex-none bg-slate-900 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {lang === 'ar' ? 'بروتوكول الرقابة الإدارية' : 'Management Protocol'}
            </p>
            <p className="text-[10px] text-slate-300 font-bold opacity-80">
              {lang === 'ar' ? 'المشرف هو المسؤول قانونياً وإدارياً عن كافة المواد الخام المستلمة لمجموعته، وعن جودة المخرجات المنجزة.' : 'The supervisor is legally responsible for all materials issued to their group and the final production quality.'}
            </p>
          </div>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[550px] rounded-lg border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="premium-gradient p-6 text-white relative">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                {editingWorkerId ? (lang === 'ar' ? 'تعديل سجل الموظف' : 'Update Record') : (lang === 'ar' ? 'تسجيل جديد في قاعدة البيانات' : 'New Enrollment')}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                {lang === 'ar' ? 'تحديد الدور الوظيفي والمسؤوليات الإدارية' : 'Defining roles and administrative duties'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveWorker} className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 flex flex-col items-center gap-3 pt-2">
                <div onClick={() => !isCompressing && fileInputRef.current?.click()} className="relative group cursor-pointer">
                  <Avatar className="h-24 w-24 rounded-2xl border-4 border-slate-100 shadow-md bg-slate-50 overflow-hidden">
                    <AvatarImage src={formData.photoUrl || undefined} className="object-cover" />
                    <AvatarFallback className="bg-slate-50 text-slate-300">
                      {isCompressing ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <UserIcon className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Label className="text-[9px] font-black uppercase text-slate-400">صورة الموظف</Label>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الاسم الكامل' : 'FULL NAME'}</Label>
                  <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="h-10 font-bold text-xs bg-slate-50" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'رقم الهاتف' : 'PHONE NUMBER'}</Label>
                  <Input value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="7XXXXXXXX" className="h-10 font-bold text-xs bg-slate-50 tabular-nums" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg transition-colors", formData.isSupervisor ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-300 border border-slate-200")}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-800">{lang === 'ar' ? 'هل هذا الموظف مشرف؟' : 'Is this employee a supervisor?'}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{lang === 'ar' ? 'المشرف يمكنه قيادة مجموعة من العمال' : 'Supervisors can lead worker groups'}</p>
                  </div>
                </div>
                <Checkbox 
                  checked={formData.isSupervisor} 
                  onCheckedChange={(val) => setFormData({...formData, isSupervisor: !!val, supervisorId: ''})} 
                  className="w-5 h-5 border-emerald-500 data-[state=checked]:bg-emerald-600"
                />
              </div>

              {!formData.isSupervisor && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                    <UserCheck className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تعيين المشرف المباشر' : 'ASSIGN DIRECT SUPERVISOR'}
                  </Label>
                  <select 
                    value={formData.supervisorId} 
                    onChange={(e) => setFormData({...formData, supervisorId: e.target.value})} 
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold focus:outline-none"
                  >
                    <option value="">{lang === 'ar' ? '-- بدون مشرف حالياً --' : '-- No Supervisor Assigned --'}</option>
                    {supervisors.filter(s => s.departmentId === formData.departmentId || !formData.departmentId).map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} ({departments?.find(d => d.id === s.departmentId)?.nameAr})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'القسم / المسار' : 'DEPARTMENT'}</Label>
                <select value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر القسم --</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{lang === 'ar' ? d.nameAr : d.nameEn}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'تاريخ الانضمام' : 'JOIN DATE'}</Label>
                <Input type="date" value={formData.joinDate} onChange={(e) => setFormData({...formData, joinDate: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 tabular-nums" required />
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-600" /><p className="text-[10px] font-black text-red-600">{validationError}</p></div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1 h-11 premium-gradient text-white rounded-md font-black text-sm shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات') : 'Commit Record'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 rounded-md">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingWorkerId} onOpenChange={(open) => !open && setDeletingWorkerId(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><History className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة السجل' : 'Archive Record'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">أرشفة السجل لا تمسح تاريخ الإنتاج السابق للموظف، ولكن ستوقفه عن استلام مواد جديدة.</AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveWorker} className="flex-1 h-11 bg-red-600 font-black">تأكيد الأرشفة</AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingWorkerId(null)} className="flex-1 h-11 bg-slate-50 font-black">تراجع</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
