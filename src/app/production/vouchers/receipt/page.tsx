
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  FileOutput, 
  Save, 
  Loader2, 
  Calendar,
  Workflow,
  Package,
  Trash2,
  FileText,
  Edit2,
  CheckCircle2,
  Building2,
  Check,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  MoreVertical,
  History,
  Download,
  Eye,
  FileDown,
  Filter,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Hash,
  Activity,
  Target,
  AlertTriangle,
  Users2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, writeBatch, getDoc } from 'firebase/firestore';
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toPng } from 'html-to-image';

export default function ProductionReceiptPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'totalQty'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const workerDropdownRef = useRef<HTMLDivElement>(null);
  
  // Selection state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [workerSearch, setWorkerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    supervisorId: '', // Accountability
    notes: '',
    qtyAccepted: 0,
    qtyRejected: 0,
    qtyWaste: 0
  });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status === 'active'), [allOrders]);
  const activeDepartments = useMemo(() => (allDepartments || []).filter(d => d.status === 'active'), [allDepartments]);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    
    let result = vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      const order = allOrders?.find(o => o.id === v.orderId);
      const worker = allWorkers?.find(w => w.id === v.workerId);
      const s = search.toLowerCase();
      const matchesSearch = v.voucherNumber?.toLowerCase().includes(s) ||
                           order?.orderNumber?.toLowerCase().includes(s) ||
                           worker?.fullName?.toLowerCase().includes(s);
      const matchesBatch = batchFilter === 'all' || v.orderId === batchFilter;
      const matchesDept = deptFilter === 'all' || worker?.departmentId === deptFilter;
      return matchesSearch && matchesBatch && matchesDept;
    });

    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, deptFilter, sortBy, sortOrder]);

  const filteredWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => {
      if (w.status === 'deleted') return false;
      const matchesDept = selectedDeptId ? w.departmentId === selectedDeptId : true;
      const matchesSearch = (w.fullName || '').toLowerCase().includes(workerSearch.toLowerCase());
      return matchesDept && matchesSearch && (w.active !== false);
    });
  }, [allWorkers, selectedDeptId, workerSearch]);

  const selectedWorker = useMemo(() => allWorkers?.find(w => w.id === formData.workerId), [allWorkers, formData.workerId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workerDropdownRef.current && !workerDropdownRef.current.contains(event.target as Node)) {
        setShowWorkerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || !formData.orderId || formData.qtyAccepted < 0) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);
    
    const totalQty = Number(formData.qtyAccepted) + Number(formData.qtyRejected) + Number(formData.qtyWaste);
    const voucherData = {
      ...formData,
      supervisorId: selectedWorker?.supervisorId || '', // Capture supervisor for accountability
      qtyAccepted: Number(formData.qtyAccepted),
      qtyRejected: Number(formData.qtyRejected),
      qtyWaste: Number(formData.qtyWaste),
      type: 'production_receipt',
      totalQty,
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingVoucherId) {
        const oldVoucherSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldVoucher = oldVoucherSnap.data();
        const orderRef = doc(db, 'productionOrders', formData.orderId);
        const orderSnap = await getDoc(orderRef);
        const orderData = orderSnap.data();

        const diff = Number(formData.qtyAccepted) - (oldVoucher?.qtyAccepted || 0);
        batch.update(orderRef, {
          completedQty: (orderData?.completedQty || 0) + diff
        });

        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `PRV-${Date.now().toString().slice(-6)}`;
        const voucherRef = doc(collection(db, 'vouchers'));
        batch.set(voucherRef, { ...voucherData, voucherNumber, createdAt: serverTimestamp() });

        const orderRef = doc(db, 'productionOrders', formData.orderId);
        const orderSnap = await getDoc(orderRef);
        batch.update(orderRef, {
          completedQty: (orderSnap.data()?.completedQty || 0) + Number(formData.qtyAccepted)
        });
      }

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم استلام الإنتاج بنجاح" : "Production Received Successfully" });
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
      const orderRef = doc(db, 'productionOrders', deletingVoucher.orderId);
      const orderSnap = await getDoc(orderRef);
      batch.update(orderRef, {
        completedQty: Math.max(0, (orderSnap.data()?.completedQty || 0) - deletingVoucher.qtyAccepted)
      });
      batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
      await batch.commit();
      toast({ title: lang === 'ar' ? "تم إلغاء السند وتحديث الإنجاز" : "Voucher deleted and progress updated" });
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
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', supervisorId: '', notes: '', qtyAccepted: 0, qtyRejected: 0, qtyWaste: 0 });
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2, 
        fontEmbedCSS: '',
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `Receipt-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <FileOutput className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'استلام الإنتاج' : 'Production Receipt'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'توثيق مخرجات العمل اليومي' : 'Production Receipt Vouchers'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث بالسند أو العامل...' : 'Search records...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'استلام جديد' : 'New Receipt'}
            </Button>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'المستلم / المشرف' : 'RECIPIENT / SUP'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'المقبول' : 'ACCEPTED'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300">لا توجد سجلات</TableCell></TableRow>
              ) : filteredVouchers.map((v) => {
                const worker = allWorkers?.find(w => w.id === v.workerId);
                const supervisor = allWorkers?.find(w => w.id === v.supervisorId);
                return (
                  <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 group">
                    <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                      <div className="flex items-center gap-2">
                        <FileOutput className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-black text-slate-900 text-xs">{v.voucherNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("px-6 py-3 text-slate-500 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>{v.date}</TableCell>
                    <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                      <div className="flex flex-col">
                         <span className="font-bold text-slate-700 text-xs">{worker?.fullName || '---'}</span>
                         {supervisor && <span className="text-[9px] font-black text-emerald-600">بمسؤولية: {supervisor.fullName}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black tabular-nums">{v.qtyAccepted}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600"><Eye className="w-4 h-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setPrintingVoucher(v)} className="gap-2 font-bold py-1.5"><Eye className="w-3.5 h-3.5" /> عرض السند</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingVoucher(v)} className="gap-2 font-bold py-1.5 text-rose-600"><Trash2 className="w-3.5 h-3.5" /> حذف السند</DropdownMenuItem>
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

      {/* FORM DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[700px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <FileOutput className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'استلام إنتاج من عامل' : 'New Production Receipt'}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Recording finished pieces and accountability</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> تاريخ التسليم</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-12 font-bold bg-slate-50" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Workflow className="w-3 h-3 text-emerald-600" /> أمر الإنتاج</Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر أمر الإنتاج --</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 relative" ref={workerDropdownRef}>
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> الموظف المسلم</Label>
              <button type="button" onClick={() => setShowWorkerDropdown(!showWorkerDropdown)} className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold">
                {selectedWorker ? selectedWorker.fullName : <span className="text-slate-400">-- اختر العامل --</span>}
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", showWorkerDropdown && "rotate-180")} />
              </button>
              {showWorkerDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-2 bg-slate-50 border-b border-slate-100">
                    <Input value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} placeholder="بحث باسم العامل..." className="h-9 bg-white text-xs" />
                  </div>
                  <ScrollArea className="h-[200px]">
                    {filteredWorkers.map(w => (
                      <button key={w.id} type="button" onClick={() => { setFormData({...formData, workerId: w.id}); setShowWorkerDropdown(false); }} className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 text-right border-b border-slate-50">
                        <Avatar className="h-7 w-7"><AvatarImage src={w.photoUrl} /><AvatarFallback>{w.fullName?.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-700">{w.fullName}</span>
                           <span className="text-[8px] text-slate-400 uppercase">{w.workerId}</span>
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            {selectedWorker && (
               <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                     <p className="text-[10px] font-black text-emerald-800 uppercase">المشرف الضامن للعهدة</p>
                     <p className="text-xs font-bold text-emerald-700">{allWorkers?.find(w => w.id === selectedWorker.supervisorId)?.fullName || 'لم يعين مشرف'}</p>
                  </div>
               </div>
            )}

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-emerald-700 uppercase">الكمية المقبولة</Label>
                <Input type="number" value={formData.qtyAccepted} onChange={(e) => setFormData({...formData, qtyAccepted: Number(e.target.value)})} className="h-12 font-black text-center text-lg text-emerald-700 bg-white border-emerald-200" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-amber-700 uppercase">الكمية المرفوضة</Label>
                <Input type="number" value={formData.qtyRejected} onChange={(e) => setFormData({...formData, qtyRejected: Number(e.target.value)})} className="h-12 font-black text-center text-lg text-amber-700 bg-white border-amber-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-rose-700 uppercase">الكمية التالفة</Label>
                <Input type="number" value={formData.qtyWaste} onChange={(e) => setFormData({...formData, qtyWaste: Number(e.target.value)})} className="h-12 font-black text-center text-lg text-rose-700 bg-white border-rose-200" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">ملاحظات الجودة / الفحص</Label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white focus:border-emerald-500" placeholder="أدخل أي ملاحظات فنية حول القطع المستلمة..." />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !formData.workerId || !formData.orderId} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                ترحيل السند وتحديث الإنجاز
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW/PRINT DIALOG (PNG PREVIEW) */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only"><DialogTitle>معاينة سند استلام إنتاج</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>

                  <div className="grid grid-cols-3 items-center border-b-4 border-emerald-800 pb-6 mb-6">
                    <div className="text-center space-y-0.5">
                      <h2 className="text-base font-black text-emerald-900">جمعية الصناعات النسيجية</h2>
                      <p className="text-[10px] font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p>
                    </div>
                    <div className="flex justify-center"><img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" /></div>
                    <div className="text-center space-y-0.5" dir="ltr">
                      <h2 className="text-[11px] font-black text-emerald-900 uppercase">TIA Production</h2>
                      <p className="text-[9px] font-bold text-slate-500">Al-Rawdah - Shabwa - Yemen</p>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="inline-block border-2 border-emerald-800 px-8 py-1 rounded-full bg-white shadow-sm">
                      <h3 className="text-lg font-black text-emerald-900 uppercase tracking-widest">سند استلام إنتاج تام</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase">رقم السند</p>
                       <p className="text-xs font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase mt-2">تاريخ الاستلام</p>
                       <p className="text-xs font-black text-slate-700 tabular-nums">{printingVoucher.date}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase">اسم المسلم</p>
                       <p className="text-xs font-black text-slate-700">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase mt-2">أمر الإنتاج</p>
                       <p className="text-xs font-black text-slate-700 truncate">{allOrders?.find(o => o.id === printingVoucher.orderId)?.orderNumber}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase">المشرف المسؤول</p>
                       <p className="text-xs font-black text-slate-700">{allWorkers?.find(w => w.id === printingVoucher.supervisorId)?.fullName || '---'}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <Table className="text-right border-2 border-emerald-900/10">
                      <TableHeader className="bg-emerald-900/5">
                        <TableRow>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900 border-b-2 border-emerald-900/20">الحالة التشغيلية</TableHead>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900 border-b-2 border-emerald-900/20">الكمية (قطعة)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-b border-slate-100 bg-white/40">
                          <TableCell className="text-center font-bold text-sm py-3 text-emerald-700">كمية مقبولة (صالحة)</TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums py-3">{printingVoucher.qtyAccepted}</TableCell>
                        </TableRow>
                        <TableRow className="border-b border-slate-100 bg-white/40">
                          <TableCell className="text-center font-bold text-sm py-3 text-amber-700">كمية مرفوضة (تحتاج تعديل)</TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums py-3">{printingVoucher.qtyRejected}</TableCell>
                        </TableRow>
                        <TableRow className="border-b border-slate-100 bg-white/40">
                          <TableCell className="text-center font-bold text-sm py-3 text-rose-700">كمية تالفة (هالك صناعي)</TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums py-3">{printingVoucher.qtyWaste}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center">
                    <div className="space-y-8"><p className="text-[10px] font-black text-slate-400">أمين المستودع</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /></div>
                    <div className="space-y-8"><p className="text-[10px] font-black text-slate-400">توقيع الموظف</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /></div>
                    <div className="space-y-8"><p className="text-[10px] font-black text-slate-400">اعتماد المدير / المشرف</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-8 rounded-xl shadow-lg">
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              تحميل كصورة PNG
            </Button>
            <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-6 rounded-xl border border-slate-200">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deletingVoucher} onOpenChange={(o) => !o && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><History className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">إلغاء سند استلام</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">حذف السند سيؤدي لخصم الكميات من الإنجاز المحقق لأمر الإنتاج تلقائياً وتصفير أي أجر مستحق عنه.</AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeleteVoucher} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 font-black">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 font-black">تراجع</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
