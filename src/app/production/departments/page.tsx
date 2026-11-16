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

  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.departments?.create;
  const canEdit = isAdmin || permissions.departments?.edit;
  const canDelete = isAdmin || permissions.departments?.delete;
  
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

  const departmentsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);

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
        return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [departments, workers, search, statusFilter, sortBy, sortOrder]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingDeptId(null);
    setIsSubmitting(false);
    setCodeError(null);
    setFormData({ code: '', nameAr: '', nameEn: '', descAr: '', status: 'active' });
  }, []);

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
    try {
      const deptData = {
        code: formData.code.toUpperCase(),
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        descAr: formData.descAr,
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (editingDeptId) {
        await updateDoc(doc(db, 'departments', editingDeptId), deptData);
        toast({ title: isRtl ? "تم التحديث" : "Updated" });
      } else {
        await addDoc(collection(db, 'departments'), { ...deptData, createdAt: serverTimestamp() });
        toast({ title: isRtl ? "تمت الإضافة" : "Added" });
      }
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: isRtl ? "فشلت العملية" : "Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
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
    try {
      await updateDoc(doc(db, 'departments', deletingDeptId), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
      });
      toast({ title: isRtl ? "تم الأرشفة" : "Archived" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Archive Failed" });
    } finally {
      setDeletingDeptId(null); // يغلق الـ AlertDialog إجبارياً
      setIsSubmitting(false);
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

  const toggleSort = (key: 'code' | 'nameAr' | 'actualWorkerCount') => {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrder('asc'); }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Name (AR)', 'Name (EN)', 'Staff', 'Status'];
    const rows = filtered.map(d => [d.code, d.nameAr, d.nameEn, d.actualWorkerCount, d.status]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `departments_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
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
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{loading ? '..' : filtered.filter(d=>d.status==='active').length}</p>
              </div>
            </div>
            {canCreate && (
              <Button onClick={() => {resetForm(); setIsAddDialogOpen(true);}} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 border-none">
                <Plus className="w-4 h-4" /> {isRtl ? 'إضافة قسم' : 'New Dept'}
              </Button>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", dir === 'rtl' ? "right-3" : "left-3")} />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              className={cn("h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100", dir === 'rtl' ? "pr-10" : "pl-10")}
            />
          </div>
          <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-4 rounded-md text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800">
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            {isRtl ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-auto no-scrollbar relative">
            <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
              <TableHeader className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm">
                <TableRow className="border-b dark:border-slate-700">
                  <TableHead className={cn("px-6 py-3 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 bg-inherit", isRtl ? "text-right" : "text-left")}>CODE</TableHead>
                  <TableHead className={cn("px-6 py-3 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 bg-inherit", isRtl ? "text-right" : "text-left")}>NAME</TableHead>
                  <TableHead className="px-6 py-3 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 text-center bg-inherit">STAFF</TableHead>
                  <TableHead className="px-6 py-3 font-bold text-[11px] uppercase text-slate-500 dark:text-slate-400 text-center bg-inherit">STATUS</TableHead>
                  <TableHead className="w-[60px] sticky right-0 bg-inherit shadow-[-2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-none"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse font-bold text-slate-400">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-300 font-bold">No Records</TableCell></TableRow>
                ) : filtered.map((dept) => (
                  <TableRow key={dept.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                    <TableCell className={cn("px-6 py-3 font-bold text-emerald-700 dark:text-emerald-400 text-[11px] tabular-nums tracking-wider", isRtl ? "text-right" : "text-left")}>{dept.code}</TableCell>
                    <TableCell className={cn("px-6 py-3", isRtl ? "text-right" : "text-left")}>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{isRtl ? dept.nameAr : dept.nameEn}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? dept.nameEn : dept.nameAr}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-black tabular-nums">{dept.actualWorkerCount || 0}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase border transition-all", dept.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200')}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", dept.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400')} />
                        {dept.status === 'active' ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'متوقف' : 'Inactive')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] dark:shadow-none border-l dark:border-slate-800">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl min-w-[180px]">
                          {canEdit && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditClick(dept)} className="gap-3 font-bold text-xs py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {isRtl ? 'تعديل' : 'Edit'}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusToggle(dept)} className="gap-3 font-bold text-xs py-2.5 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                                {dept.status === 'active' ? <PowerOff className="w-3.5 h-3.5 text-amber-600" /> : <Power className="w-3.5 h-3.5 text-emerald-600" />}
                                {dept.status === 'active' ? (isRtl ? 'تعطيل' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Activate')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                              <DropdownMenuItem onClick={() => setDeletingDeptId(dept.id)} className="gap-3 font-bold text-xs text-red-600 dark:text-rose-400 focus:text-red-700 dark:focus:bg-rose-900/20 py-2.5"><Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'نقل للأرشيف' : 'Archive'}</DropdownMenuItem>
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

        {/* SYSTEM NOTE */}
        <div className="mt-4 flex-none bg-slate-900 dark:bg-slate-900/80 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 shrink-0"><Info className="w-4 h-4" /></div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">{isRtl ? 'بروتوكول إدارة البيانات' : 'Audit Protocol'}</p>
            <p className="text-[10px] text-slate-300 dark:text-slate-400 font-bold opacity-80 leading-relaxed">{isRtl ? 'يتم حفظ كافة الحركات في سجل التدقيق. العناصر المحذوفة تخضع لفترة سماح مدتها 30 يوماً.' : 'All changes are audited.'}</p>
          </div>
        </div>
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="premium-gradient p-6 text-white relative">
            <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Layers className="w-5 h-5 text-emerald-300" />
                {editingDeptId ? (isRtl ? 'تعديل القسم' : 'Edit Center') : (isRtl ? 'قسم إنتاج جديد' : 'New Work Center')}
              </DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleSaveDepartment} className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400">DEPT CODE</Label>
                <Input value={formData.code} onChange={(e) => {setFormData({...formData, code: e.target.value}); setCodeError(null);}} placeholder="DEPT-100" className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100" required />
                {codeError && <p className="text-[9px] font-bold text-red-600 mt-1">{codeError}</p>}
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400">STATUS</Label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 transition-colors" dir={dir}>
                  <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{isRtl ? 'متوقف' : 'Inactive'}</option>
                </select>
              </div>
            </div>
            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className="text-[10px] font-black uppercase text-slate-400">ARABIC NAME</Label>
              <Input value={formData.nameAr} onChange={(e) => setFormData({...formData, nameAr: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100" dir={dir} required />
            </div>
            <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
              <Label className="text-[10px] font-black uppercase text-slate-400">ENGLISH NAME</Label>
              <Input value={formData.nameEn} onChange={(e) => setFormData({...formData, nameEn: e.target.value})} className="h-10 font-bold text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100" dir="ltr" required />
            </div>
            <div className="flex gap-3 pt-2 border-t dark:border-slate-800">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 premium-gradient text-white rounded-md font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {isRtl ? 'حفظ البيانات' : 'Commit'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-11 font-black text-slate-400 rounded-md border-slate-200 dark:border-slate-800">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingDeptId} onOpenChange={(open) => { if(!open && !isSubmitting) setDeletingDeptId(null); }}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900 transition-colors duration-300">
          <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Layers className="w-32 h-32 text-white" /></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'أرشفة القسم' : 'Confirm Archive'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
              {isRtl ? 'سيتم نقل هذا القسم للأرشيف. يمكنك استعادته خلال 30 يوماً.' : 'Item will be moved to archive.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
            <AlertDialogAction onClick={handleArchiveDepartment} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg transition-all active:scale-95">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : (isRtl ? 'تأكيد' : 'Confirm')}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingDeptId(null)} className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black">تراجع</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
