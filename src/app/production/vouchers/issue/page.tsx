
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  FileInput, 
  Save, 
  Loader2, 
  Calendar,
  User,
  Workflow,
  Package,
  Trash2,
  AlertCircle,
  FileText,
  Printer,
  Edit2,
  CheckCircle2,
  Box,
  LayoutGrid,
  Users2,
  Building2,
  Check,
  UserCheck,
  ShieldCheck,
  UserPlus,
  ChevronDown,
  X,
  MoreVertical,
  History,
  ArrowRight,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toPng } from 'html-to-image';

export default function MaterialIssuePage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const filterOrderId = searchParams.get('orderId');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const workerDropdownRef = useRef<HTMLDivElement>(null);
  
  // Selection filtering state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [workerSearch, setWorkerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: filterOrderId || '',
    workerId: '',
    notes: '',
    items: [] as any[]
  });

  // Current Item Selection State
  const [currentItem, setCurrentItem] = useState({
    id: '',
    qty: 1
  });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: materials } = useCollection<any>(materialsQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status === 'active'), [allOrders]);
  const activeDepartments = useMemo(() => (allDepartments || []).filter(d => d.status === 'active'), [allDepartments]);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    return vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      const order = allOrders?.find(o => o.id === v.orderId);
      const worker = allWorkers?.find(w => w.id === v.workerId);
      const s = search.toLowerCase();
      return (
        v.voucherNumber?.toLowerCase().includes(s) ||
        order?.orderNumber?.toLowerCase().includes(s) ||
        worker?.fullName?.toLowerCase().includes(s)
      );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vouchers, allOrders, allWorkers, search]);

  const filteredWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => {
      if (w.status === 'deleted') return false;
      const matchesDept = selectedDeptId ? w.departmentId === selectedDeptId : true;
      const matchesSearch = (w.fullName || '').toLowerCase().includes(workerSearch.toLowerCase()) || 
                           (w.workerId || '').toLowerCase().includes(workerSearch.toLowerCase());
      return matchesDept && matchesSearch && (w.active !== false);
    });
  }, [allWorkers, selectedDeptId, workerSearch]);

  const selectedWorker = useMemo(() => {
    return allWorkers?.find(w => w.id === formData.workerId);
  }, [allWorkers, formData.workerId]);

  // Click outside listener for the custom dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target as Node)) {
        setShowWorkerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddItem = () => {
    if (!currentItem.id || currentItem.qty <= 0) return;
    const material = materials?.find(m => m.id === currentItem.id);
    if (!material) return;

    if (material.currentQty < currentItem.qty) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "كمية غير كافية" : "Insufficient Stock",
        description: lang === 'ar' ? `المتوفر في المخزن فقط ${material.currentQty}` : `Available stock is only ${material.currentQty}`
      });
      return;
    }

    const existingIdx = formData.items.findIndex(i => i.id === currentItem.id);
    if (existingIdx > -1) {
      const newItems = [...formData.items];
      newItems[existingIdx].qty += currentItem.qty;
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({ 
        ...formData, 
        items: [...formData.items, { 
          id: material.id, 
          nameAr: material.nameAr, 
          qty: currentItem.qty, 
          unit: material.unit,
          price: material.price || 0
        }] 
      });
    }
    setCurrentItem({ id: '', qty: 1 });
  };

  const removeItem = (id: string) => {
    setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
  };

  const editItemInForm = (item: any) => {
    setCurrentItem({ id: item.id, qty: item.qty });
    removeItem(item.id);
    toast({ title: lang === 'ar' ? "تم نقل المادة للتعديل" : "Material moved to edit" });
  };

  const handleEditVoucher = (voucher: any) => {
    setEditingVoucherId(voucher.id);
    setFormData({
      date: voucher.date,
      orderId: voucher.orderId,
      workerId: voucher.workerId,
      notes: voucher.notes || '',
      items: [...voucher.items]
    });
    
    const worker = allWorkers?.find(w => w.id === voucher.workerId);
    if (worker) setSelectedDeptId(worker.departmentId);
    
    setIsAddDialogOpen(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);
    
    const totalAmount = formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const voucherData = {
      ...formData,
      type: 'material_issue',
      totalAmount,
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingVoucherId) {
        // Handle Edit: Need to reconcile stock
        const oldVoucherSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldVoucher = oldVoucherSnap.data();
        
        // 1. Return old quantities to stock
        oldVoucher?.items.forEach((oldItem: any) => {
          const material = materials?.find(m => m.id === oldItem.id);
          if (material) {
            batch.update(doc(db, 'materials', oldItem.id), {
              currentQty: (material.currentQty || 0) + oldItem.qty
            });
          }
        });

        // 2. Subtract new quantities from stock
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        // Handle New
        const voucherNumber = `MIV-${Date.now().toString().slice(-6)}`;
        const voucherRef = doc(collection(db, 'vouchers'));
        batch.set(voucherRef, { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      // Re-apply stock deductions for current items
      formData.items.forEach(item => {
        const material = materials?.find(m => m.id === item.id);
        if (material) {
          const matRef = doc(db, 'materials', item.id);
          batch.update(matRef, {
            currentQty: (material.currentQty || 0) - item.qty,
            updatedAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم حفظ السند بنجاح" : "Voucher Saved Successfully" });
      resetDialog();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error saving voucher" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVoucher = async () => {
    if (!db || !deletingVoucher) return;
    
    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      // 1. Return items to stock
      deletingVoucher.items.forEach((item: any) => {
        const material = materials?.find(m => m.id === item.id);
        if (material) {
          batch.update(doc(db, 'materials', item.id), {
            currentQty: (material.currentQty || 0) + item.qty,
            updatedAt: serverTimestamp()
          });
        }
      });

      // 2. Mark voucher as deleted
      batch.update(doc(db, 'vouchers', deletingVoucher.id), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم حذف السند وإرجاع المخزون" : "Voucher deleted and stock returned" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setDeletingVoucher(null);
    }
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setSelectedDeptId('');
    setWorkerSearch('');
    setShowWorkerDropdown(false);
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', notes: '', items: [] });
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !printingVoucher) return;
    
    setIsDownloading(true);
    try {
      // Give the browser more time to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(element, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        // The fix: provide a function to handle/filter fonts or skip problematic rules
        style: {
          fontFamily: 'inherit'
        }
      });
      const link = document.createElement('a');
      link.download = `MaterialIssue-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: lang === 'ar' ? "تم تحميل السند كصورة" : "Voucher downloaded as image" });
    } catch (err: any) {
      console.error('Download error:', err);
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "فشل التحميل" : "Download Failed",
        description: lang === 'ar' ? "حدث خطأ أثناء معالجة الصورة. يرجى تجربة الطباعة المباشرة." : "Error processing image. Please use direct print."
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <FileInput className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المخازن' : 'WMS'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'سندات الصرف' : 'Material Issues'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'صرف المواد الخام للإنتاج' : 'Material Issue Vouchers'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث برقم السند أو العامل...' : 'Search by voucher or worker...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'سند جديد' : 'New Issue'}
            </Button>
          </div>
        </div>
      </div>

      {/* LIST OF VOUCHERS */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar print:hidden">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right border-separate border-spacing-0">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'أمر الإنتاج' : 'ORDER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'العامل' : 'WORKER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'الأصناف' : 'ITEMS'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري سحب الأرشيف...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد سندات مسجلة</TableCell></TableRow>
              ) : filteredVouchers.map((v) => {
                const order = allOrders?.find(o => o.id === v.orderId);
                const worker = allWorkers?.find(w => w.id === v.workerId);
                return (
                  <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><FileText className="w-3.5 h-3.5" /></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 font-bold text-slate-500 text-xs tabular-nums text-right">{v.date}</TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-800 text-xs">{order?.orderNumber || '---'}</span>
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{order?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-bold text-slate-700 text-xs">{worker?.fullName || '---'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{worker?.fullName?.charAt(0)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black tabular-nums">
                        {v.items?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          onClick={() => setPrintingVoucher(v)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-100"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-lg shadow-xl">
                            <DropdownMenuItem onClick={() => handleEditVoucher(v)} className="gap-2 font-bold py-1.5 cursor-pointer text-xs">
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل السند' : 'Edit Voucher'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeletingVoucher(v)} className="gap-2 font-bold py-1.5 text-rose-600 cursor-pointer text-xs">
                              <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'حذف السند' : 'Delete Voucher'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* NEW/EDIT VOUCHER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <FileInput className="w-5 h-5 text-emerald-300" />
                {editingVoucherId ? (lang === 'ar' ? 'تعديل سند صرف مواد' : 'Update Material Issue') : (lang === 'ar' ? 'إنشاء سند صرف مواد للإنتاج' : 'New Material Issue')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Allocating raw materials to specific workers & work centers
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            
            {/* ROW 1: Date and Worker Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ السند' : 'TRANSACTION DATE'}
                </Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-12 font-bold text-xs bg-slate-50 border-slate-200" required />
              </div>

              <div className="space-y-1.5 relative" ref={workerDropdownRef}>
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Users2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'العامل المستلم للمواد' : 'RECEIVING PERSONNEL'}
                </Label>
                
                <button
                  type="button"
                  onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                  className={cn(
                    "flex h-12 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500",
                    !formData.workerId && "text-slate-400 font-bold"
                  )}
                >
                  {selectedWorker ? (
                    <div className="flex items-center gap-3 text-right">
                      <Avatar className="h-7 w-7 border border-slate-200">
                        <AvatarImage src={selectedWorker.photoUrl} className="object-cover" />
                        <AvatarFallback className="text-[9px] font-black bg-slate-200 text-slate-600">{selectedWorker.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start overflow-hidden text-right">
                        <span className="text-[11px] font-black text-slate-900 truncate">{selectedWorker.fullName}</span>
                        <span className="text-[8px] font-bold text-slate-400 tabular-nums uppercase">{selectedWorker.workerId}</span>
                      </div>
                    </div>
                  ) : (
                    <span>{lang === 'ar' ? '-- اختر العامل --' : '-- Select Worker --'}</span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", showWorkerDropdown && "rotate-180")} />
                </button>

                {showWorkerDropdown && (
                  <div className={cn(
                    "absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
                    dir === 'rtl' ? "text-right" : "text-left"
                  )}>
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex flex-col gap-2">
                      <div className="relative">
                        <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                        <Input 
                          autoFocus
                          value={workerSearch}
                          onChange={(e) => setWorkerSearch(e.target.value)}
                          placeholder={lang === 'ar' ? 'بحث باسم العامل...' : 'Search personnel...'}
                          className={`${dir === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'} h-9 bg-white border-slate-200 text-xs font-bold`}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-[240px]">
                      <div className="p-1">
                        {filteredWorkers.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'لا يوجد عمال' : 'No personnel'}</p>
                          </div>
                        ) : filteredWorkers.map(w => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, workerId: w.id});
                              setSelectedDeptId(w.departmentId); 
                              setShowWorkerDropdown(false);
                            }}
                            className={cn(
                              "flex items-center gap-3 w-full p-2 rounded-lg transition-all text-right hover:bg-slate-50 mb-0.5",
                              formData.workerId === w.id && "bg-emerald-50"
                            )}
                          >
                            <Avatar className="h-8 w-8 border border-white shadow-sm shrink-0">
                              <AvatarImage src={w.photoUrl} className="object-cover" />
                              <AvatarFallback className="text-[9px] font-black bg-slate-100 text-slate-500">{w.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden text-right">
                              <p className={cn("text-[11px] font-black leading-tight", formData.workerId === w.id ? "text-emerald-700" : "text-slate-800")}>{w.fullName}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-0.5 tabular-nums uppercase">{w.workerId}</p>
                            </div>
                            {formData.workerId === w.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: Production Order and Dept Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Workflow className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'أمر الإنتاج المستهدف' : 'PRODUCTION ORDER'}
                </Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500" required>
                  <option value="">{lang === 'ar' ? '-- اختر أمر الإنتاج --' : '-- Select Order --'}</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'فلترة حسب القسم' : 'FILTER BY DEPARTMENT'}
                </Label>
                <select 
                  value={selectedDeptId} 
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setFormData({...formData, workerId: ''});
                    setWorkerSearch('');
                  }} 
                  className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">{lang === 'ar' ? 'عرض جميع الأقسام' : 'All Departments'}</option>
                  {activeDepartments?.map(d => <option key={d.id} value={d.id}>{lang === 'ar' ? d.nameAr : d.nameEn}</option>)}
                </select>
              </div>
            </div>

            {/* 3. ITEM SELECTION BOX */}
            <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إضافة أصناف الخيوط والمواد من المخزن' : 'ADD RAW MATERIALS FROM INVENTORY'}
              </h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">{lang === 'ar' ? 'الصنف المتوفر' : 'ITEM'}</Label>
                  <select 
                    value={currentItem.id} 
                    onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}
                    className="w-full h-10 px-3 bg-white text-slate-900 border border-slate-200 rounded-md text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">{lang === 'ar' ? '-- اختر مادة من المخزن --' : '-- Select Material --'}</option>
                    {materials?.filter(m => (m.currentQty || 0) > 0 || m.id === currentItem.id).map(m => (
                      <option key={m.id} value={m.id} className="text-slate-900">{m.nameAr} ({m.currentQty} {m.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">{lang === 'ar' ? 'الكمية' : 'QTY'}</Label>
                  <Input 
                    type="number" 
                    value={currentItem.qty} 
                    onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })}
                    className="h-10 font-bold text-xs bg-white text-slate-900 border border-slate-200 tabular-nums" 
                  />
                </div>
                <Button type="button" onClick={handleAddItem} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-black text-xs gap-2 border-none shadow-lg">
                  <Plus className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إدراج في السند' : 'Insert to List'}
                </Button>
              </div>
            </div>

            {/* 4. VOUCHER ITEMS TABLE */}
            {formData.items.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table className="text-right">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-right">{lang === 'ar' ? 'المادة' : 'MATERIAL'}</TableHead>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">{lang === 'ar' ? 'الكمية المصروفة' : 'ISSUED QTY'}</TableHead>
                      <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">{lang === 'ar' ? 'الوحدة' : 'UNIT'}</TableHead>
                      <TableHead className="px-4 py-2 w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 bg-white group/row">
                        <TableCell className="px-4 py-2 font-black text-slate-800 text-xs text-right">{item.nameAr}</TableCell>
                        <TableCell className="px-4 py-2 text-center font-black text-emerald-700 text-sm tabular-nums">{item.qty}</TableCell>
                        <TableCell className="px-4 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">{item.unit}</TableCell>
                        <TableCell className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => editItemInForm(item)} className="h-7 w-7 text-emerald-300 hover:text-emerald-600 hover:bg-emerald-50" title={lang === 'ar' ? 'تعديل' : 'Edit'}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-7 w-7 text-rose-300 hover:text-rose-600 hover:bg-rose-50" title={lang === 'ar' ? 'حذف' : 'Remove'}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات وتوجيهات السند' : 'VOUCHER NOTES & INSTRUCTIONS'}</Label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white focus:border-emerald-500 transition-all" 
                placeholder={lang === 'ar' ? 'اكتب أي ملاحظات تتعلق بصرف هذه المواد للعامل...' : 'Enter any specific instructions for this material issue...'} 
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.items.length === 0 || !formData.workerId} className="flex-1 h-14 premium-gradient hover:opacity-90 text-white rounded-xl font-black text-base border-none shadow-xl shadow-emerald-900/10">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <UserCheck className="w-5 h-5 me-2" />}
                {lang === 'ar' ? (editingVoucherId ? 'تحديث السند والمخزون' : 'ترحيل السند وتحديث المخزون') : (editingVoucherId ? 'Update Voucher & WMS' : 'Post Voucher & Update WMS')}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT/IMAGE PREVIEW DIALOG */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {lang === 'ar' ? 'معاينة طباعة سند الصرف' : 'Material Issue Voucher Print Preview'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  
                  {/* WATERMARK LOGO */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>

                  {/* PROFESSIONAL BILINGUAL HEADER */}
                  <div className="grid grid-cols-3 items-center border-b-4 border-emerald-800 pb-6 mb-6 relative z-10">
                    {/* ARABIC SIDE (NOW ON LEFT AS PER PREVIOUS REQ) */}
                    <div className="text-center space-y-0.5">
                      <h2 className="text-base font-black text-emerald-900">جمعية الصناعات النسيجية</h2>
                      <p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p>
                      <p className="text-[10px] font-bold text-slate-400 tabular-nums">0777 263 091 | nseeg202020@gmail.com</p>
                    </div>

                    {/* CENTER LOGO */}
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center p-1 shadow-md">
                        <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    {/* ENGLISH SIDE (NOW ON RIGHT AS PER PREVIOUS REQ) */}
                    <div className="text-center space-y-0.5" dir="ltr">
                      <h2 className="text-[11px] font-black text-emerald-900 uppercase">Textile Industries Association</h2>
                      <p className="text-[10px] font-bold text-slate-500">Al-Rawdah - Shabwa - Yemen</p>
                      <p className="text-[9px] font-bold text-slate-400 tabular-nums">0777 263 091 | nseeg202020@gmail.com</p>
                    </div>
                  </div>

                  {/* VOUCHER TITLE BAR */}
                  <div className="text-center mb-6 relative z-10">
                    <div className="inline-block border-2 border-emerald-800 px-8 py-1 rounded-full bg-white shadow-sm">
                      <h3 className="text-lg font-black text-emerald-900 uppercase tracking-widest">
                        {lang === 'ar' ? 'سند صرف مواد خام' : 'Material Issue Voucher'}
                      </h3>
                    </div>
                  </div>

                  {/* DATA GRID - 3 COLUMNS */}
                  <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-100 relative z-10">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'اسم المستلم' : 'Recipient'}</span>
                        <span className="text-xs font-black text-slate-700">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'القسم / المسار' : 'Department'}</span>
                        <span className="text-xs font-black text-slate-700">
                           {allDepartments?.find(d => d.id === allWorkers?.find(w => w.id === printingVoucher.workerId)?.departmentId)?.nameAr}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'رقم السند' : 'Voucher No.'}</span>
                        <span className="text-xs font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الدفعة' : 'Batch Name'}</span>
                        <span className="text-xs font-black text-slate-700 truncate max-w-[100px]">{allOrders?.find(o => o.id === printingVoucher.orderId)?.title}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'تاريخ السند' : 'Issue Date'}</span>
                        <span className="text-xs font-black text-slate-700 tabular-nums">{printingVoucher.date}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'أمر الإنتاج' : 'Batch No.'}</span>
                        <span className="text-xs font-black text-slate-700 tabular-nums">{allOrders?.find(o => o.id === printingVoucher.orderId)?.orderNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS TABLE */}
                  <div className="mb-8 relative z-10">
                    <Table className="text-right border-2 border-emerald-900/10">
                      <TableHeader className="bg-emerald-900/5">
                        <TableRow>
                          <TableHead className="text-right font-black text-xs py-3 text-emerald-900 border-b-2 border-emerald-900/20">{lang === 'ar' ? 'المادة الخام' : 'Raw Material'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900 border-b-2 border-emerald-900/20">{lang === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900 border-b-2 border-emerald-900/20">{lang === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {printingVoucher.items.map((item: any, i: number) => (
                          <TableRow key={i} className="border-b border-slate-100 bg-white/40">
                            <TableCell className="font-bold text-sm py-3 text-slate-800">{item.nameAr}</TableCell>
                            <TableCell className="text-center font-black text-sm tabular-nums py-3 text-emerald-700">{item.qty}</TableCell>
                            <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-3">{item.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* SIGNATURES SECTION - COMPACT AND ATTACHED */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center relative z-10">
                    <div className="space-y-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'أمين المستودع' : 'Store Keeper'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'توقيع المستلم' : 'Recipient Sign'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'اعتماد المدير' : 'Manager Approval'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Authorized Signature</p>
                    </div>
                  </div>

                  {/* PRINT FOOTER */}
                  <div className="mt-12 text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] relative z-10">
                    Generated by TIA Production System - {new Date().toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 print:hidden">
            <Button 
              onClick={handleDownloadImage} 
              disabled={isDownloading}
              className="premium-gradient font-black gap-2 h-12 px-8 rounded-xl shadow-lg"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {lang === 'ar' ? 'تحميل السند كصورة' : 'Download as Image'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDirectPrint} 
              className="font-black h-12 px-6 rounded-xl border-slate-200"
            >
              <Printer className="w-4 h-4 me-2" />
              {lang === 'ar' ? 'طباعة مباشرة' : 'Direct Print'}
            </Button>
            <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-6 rounded-xl">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'إلغاء سند الصرف' : 'Cancel Voucher'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' 
                ? 'تحذير: حذف السند سيؤدي لإلغاء الحركة المالية وإرجاع كافة الكميات المصروفة إلى مخازن الجمعية تلقائياً.' 
                : 'Warning: Deleting will reverse the financial entry and return all items to inventory.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeleteVoucher} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === 'ar' ? 'تأكيد الحذف' : 'Confirm')}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
              {lang === 'ar' ? 'تراجع' : 'Cancel'}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-2.5 bg-slate-900 text-white/50 flex items-center justify-center gap-3 print:hidden">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-bold tracking-tight">
          {lang === 'ar' 
            ? 'بروتوكول الأمان: ترحيل السند يؤدي إلى تقييد المواد فوراً كـ "عهدة" على العامل وتكاليف على أمر الإنتاج.' 
            : 'Security Protocol: Posting instantly assigns materials as worker liability and applies costs to the manufacturing order.'}
        </p>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-voucher, #printable-voucher * {
            visibility: visible;
          }
          #printable-voucher {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none;
            border: none;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
