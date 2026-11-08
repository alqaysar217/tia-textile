
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
  Users2,
  Wallet,
  Coins,
  Scale,
  RefreshCcw,
  Tag,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

  const workerDropdownRef = useRef<HTMLDivElement>(null);
  const [workerSearch, setWorkerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    linkedMIVs: [] as string[], 
    isFinalSettlement: true,
    notes: '',
    qtyAccepted: 0, 
    wageRate: 0,
    currency: 'YER',
    returnedItems: [] as any[] 
  });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const mivQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allMIVs } = useCollection<any>(mivQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status !== 'deleted'), [allOrders]);
  
  const relevantWorkers = useMemo(() => {
    if (!formData.orderId || !allWorkers || !allMIVs) return [];
    const workerIdsWithOpenIssues = allMIVs
      .filter(m => m.orderId === formData.orderId && m.status === 'posted')
      .map(m => m.workerId);
    return allWorkers.filter(w => workerIdsWithOpenIssues.includes(w.id));
  }, [formData.orderId, allWorkers, allMIVs]);

  const openMIVs = useMemo(() => {
    if (!formData.orderId || !formData.workerId || !allMIVs) return [];
    return allMIVs.filter(m => 
      m.orderId === formData.orderId && 
      m.workerId === formData.workerId && 
      (m.status === 'posted' || (editingVoucherId && formData.linkedMIVs.includes(m.id)))
    );
  }, [formData.orderId, formData.workerId, allMIVs, editingVoucherId, formData.linkedMIVs]);

  const issuedMaterialsPool = useMemo(() => {
    if (!formData.linkedMIVs.length || !allMIVs) return [];
    const pool: Record<string, { nameAr: string; qty: number; unit: string }> = {};
    formData.linkedMIVs.forEach(mivId => {
      const miv = allMIVs.find(m => m.id === mivId);
      if (miv && miv.items) {
        miv.items.forEach((item: any) => {
          if (!pool[item.id]) {
            pool[item.id] = { nameAr: item.nameAr, qty: 0, unit: item.unit };
          }
          pool[item.id].qty += item.qty;
        });
      }
    });
    return Object.entries(pool).map(([id, data]) => ({ id, ...data }));
  }, [formData.linkedMIVs, allMIVs]);

  const selectedOrder = useMemo(() => allOrders?.find(o => o.id === formData.orderId), [allOrders, formData.orderId]);
  const targetProduct = useMemo(() => allProducts?.find(p => p.id === selectedOrder?.productId), [allProducts, selectedOrder]);

  useEffect(() => {
    if (targetProduct && !editingVoucherId) {
      setFormData(prev => ({ 
        ...prev, 
        wageRate: targetProduct.wageRate || 0,
        currency: targetProduct.currency || 'YER'
      }));
    }
  }, [targetProduct, editingVoucherId]);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    let result = vouchers.filter(v => v.status !== 'deleted');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(v => {
        const order = allOrders?.find(o => o.id === v.orderId);
        const worker = allWorkers?.find(w => w.id === v.workerId);
        return v.voucherNumber?.toLowerCase().includes(s) ||
               order?.orderNumber?.toLowerCase().includes(s) ||
               worker?.fullName?.toLowerCase().includes(s);
      });
    }
    if (batchFilter !== 'all') result = result.filter(v => v.orderId === batchFilter);
    
    return result.sort((a, b) => {
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'asc' ? String(a[sortBy]).localeCompare(String(b[sortBy])) : String(b[sortBy]).localeCompare(String(a[sortBy]));
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, sortBy, sortOrder]);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || !formData.orderId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0 || formData.wageRate <= 0) {
      toast({ variant: "destructive", title: lang === 'ar' ? "بيانات ناقصة" : "Missing Data", description: lang === 'ar' ? "يرجى تحديد السندات والكمية والأجر." : "Please select vouchers, quantity, and wage." });
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(db);
    const wageAmount = Number(formData.qtyAccepted) * Number(formData.wageRate);
    
    const voucherData = {
      ...formData,
      qtyAccepted: Number(formData.qtyAccepted),
      wageAmount,
      totalQty: Number(formData.qtyAccepted),
      type: 'production_receipt',
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      // If Editing: First reverse all previous effects
      if (editingVoucherId) {
        const oldVoucherSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldV = oldVoucherSnap.data();
        if (oldV) {
          const orderRef = doc(db, 'productionOrders', oldV.orderId);
          const oSnap = await getDoc(orderRef);
          batch.update(orderRef, { completedQty: Math.max(0, (oSnap.data()?.completedQty || 0) - oldV.qtyAccepted) });
          oldV.returnedItems?.forEach((item: any) => {
            const matRef = doc(db, 'materials', item.id);
            const mSnap = allMaterials?.find(m => m.id === item.id);
            if (mSnap) batch.update(matRef, { currentQty: Math.max(0, (mSnap.currentQty || 0) - item.qty) });
          });
          oldV.linkedMIVs?.forEach((mivId: string) => {
            batch.update(doc(db, 'vouchers', mivId), { status: 'posted' });
          });
        }
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `PRV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      // Apply new effects
      const orderRef = doc(db, 'productionOrders', formData.orderId);
      const orderSnap = await getDoc(orderRef);
      batch.update(orderRef, { completedQty: (orderSnap.data()?.completedQty || 0) + Number(formData.qtyAccepted) });

      formData.returnedItems.forEach(item => {
        const matRef = doc(db, 'materials', item.id);
        const material = allMaterials?.find(m => m.id === item.id);
        if (material) batch.update(matRef, { currentQty: (material.currentQty || 0) + Number(item.qty) });
      });

      if (formData.isFinalSettlement) {
        formData.linkedMIVs.forEach(mivId => {
          batch.update(doc(db, 'vouchers', mivId), { status: 'settled', updatedAt: serverTimestamp() });
        });
      }

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم الحفظ بنجاح" : "Saved Successfully" });
      resetDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnItem = (matId: string, qty: number) => {
    const issuedItem = issuedMaterialsPool.find(m => m.id === matId);
    if (!issuedItem || qty > issuedItem.qty) {
      toast({ variant: "destructive", title: lang === 'ar' ? "تنبيه" : "Validation", description: lang === 'ar' ? "الكمية تتجاوز العهدة." : "Exceeds issued amount." });
      return;
    }
    setFormData(prev => ({
      ...prev,
      returnedItems: [...prev.returnedItems.filter(i => i.id !== matId), { id: matId, nameAr: issuedItem.nameAr, qty, unit: issuedItem.unit }]
    }));
  };

  const handleEditVoucher = (v: any) => {
    setEditingVoucherId(v.id);
    setFormData({
      date: v.date,
      orderId: v.orderId,
      workerId: v.workerId,
      linkedMIVs: v.linkedMIVs || [],
      isFinalSettlement: v.isFinalSettlement ?? true,
      notes: v.notes || '',
      qtyAccepted: v.qtyAccepted || 0,
      wageRate: v.wageRate || 0,
      currency: v.currency || 'YER',
      returnedItems: v.returnedItems || []
    });
    setIsAddDialogOpen(true);
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', linkedMIVs: [], isFinalSettlement: true, notes: '', qtyAccepted: 0, wageRate: 0, currency: 'YER', returnedItems: [] });
  };

  const handleDeleteRequest = async () => {
    if (!db || !deletingVoucher) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    try {
      // REVERSE LOGIC
      const orderRef = doc(db, 'productionOrders', deletingVoucher.orderId);
      const oSnap = await getDoc(orderRef);
      batch.update(orderRef, { completedQty: Math.max(0, (oSnap.data()?.completedQty || 0) - deletingVoucher.qtyAccepted) });

      deletingVoucher.returnedItems?.forEach((item: any) => {
        const matRef = doc(db, 'materials', item.id);
        const mSnap = allMaterials?.find(m => m.id === item.id);
        if (mSnap) batch.update(matRef, { currentQty: Math.max(0, (mSnap.currentQty || 0) - item.qty) });
      });

      deletingVoucher.linkedMIVs?.forEach((mivId: string) => {
        batch.update(doc(db, 'vouchers', mivId), { status: 'posted' });
      });

      batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
      await batch.commit();
      toast({ title: lang === 'ar' ? "نُقل للمهملات وتم عكس التأثير" : "Moved to trash & reversed" });
    } finally {
      setIsSubmitting(false);
      setDeletingVoucher(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><RefreshCcw className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'استلام وتسوية' : 'Settlement'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'إغلاق العهدة واستلام المنجز' : 'Settlement Vouchers'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} className="h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold" />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {lang === 'ar' ? 'استلام جديد' : 'New Settlement'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'المنجز' : 'DONE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'الأجر' : 'WAGE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد تسويات</TableCell></TableRow>
              ) : filteredVouchers.map((v) => (
                <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                  <TableCell className="px-6 py-3 font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</TableCell>
                  <TableCell className="px-6 py-3 text-slate-500 text-xs tabular-nums">{v.date}</TableCell>
                  <TableCell className="px-6 py-3 font-bold text-slate-700 text-xs">{allWorkers?.find(w => w.id === v.workerId)?.fullName || '---'}</TableCell>
                  <TableCell className="px-6 py-3 text-center"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 tabular-nums font-black">{v.qtyAccepted.toLocaleString('en-US')} قطعة</Badge></TableCell>
                  <TableCell className="px-6 py-3 text-center font-black text-slate-900 tabular-nums">{v.wageAmount?.toLocaleString('en-US')} {v.currency}</TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400"><Eye className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleEditVoucher(v)} className="gap-2 font-bold py-1.5"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> تعديل السند</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingVoucher(v)} className="gap-2 font-bold py-1.5 text-rose-600"><Trash2 className="w-3.5 h-3.5" /> نقل للمهملات</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[900px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <FileOutput className="w-5 h-5 text-emerald-300" />
                {editingVoucherId ? (lang === 'ar' ? 'تعديل سند التسوية' : 'Edit Settlement') : (lang === 'ar' ? 'إغلاق عهدة واستلام إنتاج' : 'New Settlement')}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Full closure of material cycle and wage calculation</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Workflow className="w-3 h-3 text-emerald-600" /> أمر الإنتاج</Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: '', linkedMIVs: []})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر أمر الإنتاج --</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> الموظف (الذي عليه عهدة)</Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, linkedMIVs: []})} disabled={!formData.orderId} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none disabled:opacity-50" required>
                  <option value="">-- اختر الموظف --</option>
                  {relevantWorkers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> تاريخ التسوية</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
            </div>

            {openMIVs.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> سندات الصرف المفتوحة</h3>
                   <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-amber-200">
                      <Checkbox id="finalSettlement" checked={formData.isFinalSettlement} onCheckedChange={(val) => setFormData({...formData, isFinalSettlement: !!val})} />
                      <label htmlFor="finalSettlement" className="text-[10px] font-black text-slate-600 cursor-pointer">إغلاق السندات المختارة نهائياً</label>
                   </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {openMIVs.map(m => (
                    <button key={m.id} type="button" onClick={() => {
                      const exists = formData.linkedMIVs.includes(m.id);
                      setFormData({ ...formData, linkedMIVs: exists ? formData.linkedMIVs.filter(id => id !== m.id) : [...formData.linkedMIVs, m.id], returnedItems: [] });
                    }} className={cn("px-3 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-2", formData.linkedMIVs.includes(m.id) ? "bg-emerald-600 text-white border-emerald-700 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300")}>
                      {formData.linkedMIVs.includes(m.id) ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {m.voucherNumber} ({(m.items?.length || 0).toLocaleString('en-US')} أصناف)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                   <Label className="text-[10px] font-black text-slate-400 uppercase">المنتج المستلم</Label>
                   <div className="w-24 h-24 mx-auto bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
                      <img src={targetProduct?.image || 'https://placehold.co/100'} className="w-full h-full object-cover" alt="product" />
                   </div>
                   <p className="text-xs font-black text-slate-900">{targetProduct?.nameAr || '---'}</p>
                   <Badge variant="outline" className="bg-white">{targetProduct?.category}</Badge>
                </div>
              </div>
              <div className="md:col-span-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-emerald-700 uppercase">الكمية المستلمة (صالحة)</Label>
                    <Input type="number" value={formData.qtyAccepted} onChange={(e) => setFormData({...formData, qtyAccepted: Number(e.target.value)})} className="h-14 font-black text-center text-2xl text-emerald-700 bg-emerald-50 border-emerald-200 tabular-nums" required min="1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">ملاحظات الفحص</Label>
                    <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-14 bg-slate-50 text-xs font-bold" />
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-emerald-800 uppercase">أجر القطعة</p>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={formData.wageRate} onChange={(e) => setFormData({...formData, wageRate: Number(e.target.value)})} className="h-8 w-24 text-xs font-black tabular-nums" required min="0.1" />
                        <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="h-8 px-2 bg-white border border-emerald-200 rounded text-[9px] font-black">
                          <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-800 uppercase">إجمالي المستحق</p>
                    <p className="text-xl font-black text-emerald-700 tabular-nums">{(formData.qtyAccepted * formData.wageRate).toLocaleString('en-US')} <span className="text-[10px]">{formData.currency}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><RefreshCcw className="w-3.5 h-3.5" /> استرجاع المواد المتبقية (تصفية عهدة)</h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">الصنف من العهدة</Label>
                  <select id="matSelect" disabled={formData.linkedMIVs.length === 0} className="w-full h-10 px-3 bg-white border border-blue-200 rounded-md text-xs font-bold outline-none">
                    <option value="">-- اختر مادة --</option>
                    {issuedMaterialsPool.map(m => <option key={m.id} value={m.id}>{m.nameAr} (العهدة: {m.qty.toLocaleString('en-US')} {m.unit})</option>)}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">الكمية المرتجعة</Label>
                  <Input id="qtySelect" type="number" step="0.01" className="h-10 bg-white font-bold tabular-nums" />
                </div>
                <Button type="button" onClick={() => {
                  const id = (document.getElementById('matSelect') as HTMLSelectElement).value;
                  const qty = Number((document.getElementById('qtySelect') as HTMLInputElement).value);
                  if (id && qty > 0) { handleReturnItem(id, qty); (document.getElementById('qtySelect') as HTMLInputElement).value = ''; }
                }} className="h-10 bg-blue-600 text-white font-black text-xs px-6">إدراج</Button>
              </div>
              {formData.returnedItems.length > 0 && (
                <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                   <Table className="text-right bg-white/50">
                      <TableHeader className="bg-blue-50/50"><TableRow><TableHead className="text-right text-[9px] font-black text-blue-500 uppercase">المادة</TableHead><TableHead className="text-center text-[9px] font-black text-blue-500 uppercase">الكمية</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                      <TableBody>
                         {formData.returnedItems.map((item, idx) => (
                            <TableRow key={idx} className="border-b border-blue-50">
                               <TableCell className="text-xs font-bold">{item.nameAr}</TableCell>
                               <TableCell className="text-center font-black tabular-nums">{item.qty.toLocaleString('en-US')} {item.unit}</TableCell>
                               <TableCell><button type="button" onClick={() => setFormData({...formData, returnedItems: formData.returnedItems.filter((_, i) => i !== idx)})} className="text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !formData.workerId || !formData.orderId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                {editingVoucherId ? 'تحديث السند والمخازن' : 'ترحيل التسوية وتحديث المخازن'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">نقل للمهملات</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              تحذير: سيتم إلغاء المنجز من أمر الإنتاج وإعادة فتح العهدة للعامل فوراً. السند سيبقى في المهملات للأرشفة.
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeleteRequest} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد النقل"}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">تراجع</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* REMAINDER OF DIALOGS (PRINT PREVIEW) UNCHANGED */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only"><DialogTitle>Preview</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-10 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>
                  <div className="grid grid-cols-3 items-center border-b-4 border-emerald-800 pb-6 mb-6">
                    <div className="text-center space-y-0.5">
                      <h2 className="text-base font-black text-emerald-900">جمعية الصناعات النسيجية</h2>
                      <p className="text-[10px] font-bold text-slate-500">الروضة - شبوة - اليمن</p>
                    </div>
                    <div className="flex justify-center"><img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" /></div>
                    <div className="text-center space-y-0.5" dir="ltr">
                      <h2 className="text-[11px] font-black text-emerald-900 uppercase">TIA Settlement</h2>
                      <p className="text-[9px] font-bold text-slate-500">Production Receipt</p>
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <div className="inline-block border-2 border-emerald-800 px-8 py-1 rounded-full bg-white shadow-sm">
                      <h3 className="text-lg font-black text-emerald-900 uppercase tracking-widest">سند تسوية واستلام منجز</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mb-8 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase">بيانات السند</p>
                       <p className="text-xs font-black text-emerald-900 tabular-nums">REF: {printingVoucher.voucherNumber}</p>
                       <p className="text-[10px] font-bold text-slate-700 tabular-nums">{printingVoucher.date}</p>
                    </div>
                    <div className="space-y-2 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase">الموظف المسؤول</p>
                       <p className="text-xs font-black text-slate-700">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{allOrders?.find(o => o.id === printingVoucher.orderId)?.orderNumber}</p>
                    </div>
                    <div className="space-y-2 text-left">
                       <p className="text-[9px] font-black text-slate-400 uppercase">الاستحقاق المالي</p>
                       <p className="text-lg font-black text-emerald-700 tabular-nums">{printingVoucher.wageAmount?.toLocaleString('en-US')} {printingVoucher.currency}</p>
                    </div>
                  </div>
                  <div className="mb-8 space-y-6">
                    <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 uppercase">أولاً: مخرجات الإنتاج (المنجز)</h4>
                    <Table className="text-right border-2 border-emerald-900/10">
                      <TableHeader className="bg-emerald-900/5">
                        <TableRow>
                          <TableHead className="text-right font-black text-xs py-3 text-emerald-900">نوع المعوز</TableHead>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900">الكمية الصالحة</TableHead>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900">أجر القطعة</TableHead>
                          <TableHead className="text-center font-black text-xs py-3 text-emerald-900">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-white/40">
                          <TableCell className="font-bold text-sm py-3">{allProducts?.find(p => p.id === allOrders?.find(o => o.id === printingVoucher.orderId)?.productId)?.nameAr}</TableCell>
                          <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">{printingVoucher.qtyAccepted.toLocaleString('en-US')} قطعة</TableCell>
                          <TableCell className="text-center font-bold text-sm tabular-nums">{printingVoucher.wageRate.toLocaleString('en-US')}</TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums text-emerald-900">{printingVoucher.wageAmount?.toLocaleString('en-US')}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center">
                    <div className="space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase">أمين المستودع</p><div className="h-px bg-slate-200 w-2/3 mx-auto" /><p className="text-[8px] font-bold text-slate-400 uppercase tabular-nums">Signature</p></div>
                    <div className="space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase">الموظف (المسلم)</p><div className="h-px bg-slate-200 w-2/3 mx-auto" /><p className="text-[8px] font-bold text-slate-400 uppercase tabular-nums">Signature</p></div>
                    <div className="space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase">المدير / المشرف</p><div className="h-px bg-slate-200 w-2/3 mx-auto" /><p className="text-[8px] font-bold text-slate-400 uppercase tabular-nums">Approval</p></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-8 rounded-xl shadow-lg">
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              تحميل السند كصورة PNG
            </Button>
            <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-6 rounded-xl border border-slate-200">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

