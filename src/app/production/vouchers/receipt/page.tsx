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
  Tag
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
import { Badge } from '@/components/ui/badge';
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
  
  // Selection state
  const [workerSearch, setWorkerSearch] = useState('');

  // Form State for "Smart Settlement"
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    linkedMIVs: [] as string[], // Vouchers being settled
    notes: '',
    qtyAccepted: 0, 
    qtyRejected: 0,
    qtyWaste: 0,
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

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status === 'active'), [allOrders]);
  
  const relevantWorkers = useMemo(() => {
    if (!formData.orderId || !allWorkers || !allMIVs) return [];
    const workerIdsWithIssues = allMIVs
      .filter(m => m.orderId === formData.orderId && m.status === 'posted')
      .map(m => m.workerId);
    return allWorkers.filter(w => workerIdsWithIssues.includes(w.id));
  }, [formData.orderId, allWorkers, allMIVs]);

  const openMIVs = useMemo(() => {
    if (!formData.orderId || !formData.workerId || !allMIVs) return [];
    return allMIVs.filter(m => m.orderId === formData.orderId && m.workerId === formData.workerId && m.status === 'posted');
  }, [formData.orderId, formData.workerId, allMIVs]);

  // SMART LOGIC: Build a pool of materials issued in the selected MIVs
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
  const selectedWorker = useMemo(() => allWorkers?.find(w => w.id === formData.workerId), [allWorkers, formData.workerId]);

  useEffect(() => {
    if (targetProduct) {
      setFormData(prev => ({ 
        ...prev, 
        wageRate: targetProduct.wageRate || 0,
        currency: targetProduct.currency || 'YER'
      }));
    }
  }, [targetProduct]);

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
      return matchesSearch && matchesBatch;
    });
    return result.sort((a, b) => {
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'asc' ? String(a[sortBy]).localeCompare(String(b[sortBy])) : String(b[sortBy]).localeCompare(String(a[sortBy]));
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, sortBy, sortOrder]);

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || !formData.orderId) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);
    
    const wageAmount = Number(formData.qtyAccepted) * Number(formData.wageRate);
    
    const voucherData = {
      ...formData,
      qtyAccepted: Number(formData.qtyAccepted),
      qtyRejected: 0,
      qtyWaste: 0,
      wageAmount,
      totalQty: Number(formData.qtyAccepted),
      type: 'production_receipt',
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      const voucherNumber = `PRV-${Date.now().toString().slice(-6)}`;
      const voucherRef = doc(collection(db, 'vouchers'));
      batch.set(voucherRef, { ...voucherData, voucherNumber, createdAt: serverTimestamp() });

      const orderRef = doc(db, 'productionOrders', formData.orderId);
      const orderSnap = await getDoc(orderRef);
      batch.update(orderRef, {
        completedQty: (orderSnap.data()?.completedQty || 0) + Number(formData.qtyAccepted)
      });

      formData.returnedItems.forEach(item => {
        const matRef = doc(db, 'materials', item.id);
        const material = allMaterials?.find(m => m.id === item.id);
        if (material) {
          batch.update(matRef, {
            currentQty: (material.currentQty || 0) + Number(item.qty),
            updatedAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم التسوية والاستلام بنجاح" : "Settlement & Receipt Successful" });
      resetDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnItem = (matId: string, qty: number) => {
    const issuedItem = issuedMaterialsPool.find(m => m.id === matId);
    if (!issuedItem) return;

    // VALIDATION: Prevent returning more than issued
    if (qty > issuedItem.qty) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "كمية غير منطقية" : "Invalid Quantity",
        description: lang === 'ar' 
          ? `لا يمكن إرجاع ${qty} بينما إجمالي ما استلمه العامل هو ${issuedItem.qty}` 
          : `Cannot return ${qty} when only ${issuedItem.qty} was issued.`
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      returnedItems: [...prev.returnedItems.filter(i => i.id !== matId), { id: matId, nameAr: issuedItem.nameAr, qty, unit: issuedItem.unit }]
    }));
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      orderId: '', 
      workerId: '', 
      linkedMIVs: [], 
      notes: '', 
      qtyAccepted: 0, 
      qtyRejected: 0, 
      qtyWaste: 0,
      wageRate: 0,
      currency: 'YER',
      returnedItems: []
    });
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Settlement-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
    } finally { setIsDownloading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <RefreshCcw className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Production'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'استلام وتسوية' : 'Settlement & Receipt'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'إغلاق العهدة واستلام المنجز' : 'Production Settlement Vouchers'}
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
              {lang === 'ar' ? 'استلام جديد' : 'New Settlement'}
            </Button>
          </div>
        </div>
      </div>

      {/* VOUCHERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'المنجز' : 'DONE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'الأجر المستحق' : 'WAGE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد تسويات مسجلة</TableCell></TableRow>
              ) : filteredVouchers.map((v) => {
                const worker = allWorkers?.find(w => w.id === v.workerId);
                return (
                  <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 group">
                    <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                      <div className="flex items-center gap-2">
                        <RefreshCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("px-6 py-3 text-slate-500 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.date}</TableCell>
                    <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarImage src={worker?.photoUrl} /><AvatarFallback>{worker?.fullName?.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-bold text-slate-700 text-xs">{worker?.fullName || '---'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 tabular-nums font-black">{v.qtyAccepted} قطعة</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-900 tabular-nums">{v.wageAmount?.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{v.currency}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600"><Eye className="w-4 h-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setPrintingVoucher(v)} className="gap-2 font-bold py-1.5"><Eye className="w-3.5 h-3.5" /> عرض التفاصيل</DropdownMenuItem>
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

      {/* SETTLEMENT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[900px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <FileOutput className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'إغلاق عهدة واستلام إنتاج' : 'Settlement & Production Receipt'}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Full closure of material cycle and wage calculation</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            
            {/* STEP 1: SELECT ORDER & WORKER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Workflow className="w-3 h-3 text-emerald-600" /> أمر الإنتاج</Label>
                <select 
                  value={formData.orderId} 
                  onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: '', linkedMIVs: []})} 
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required
                >
                  <option value="">-- اختر أمر الإنتاج --</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 relative">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> الموظف (الذي عليه عهدة)</Label>
                <select 
                  value={formData.workerId} 
                  onChange={(e) => setFormData({...formData, workerId: e.target.value, linkedMIVs: []})}
                  disabled={!formData.orderId}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none disabled:opacity-50" required
                >
                  <option value="">-- اختر الموظف --</option>
                  {relevantWorkers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px) font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> تاريخ التسوية</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50" required />
              </div>
            </div>

            {/* STEP 2: LINK OPEN VOUCHERS */}
            {openMIVs.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> سندات الصرف المفتوحة لهذا الموظف
                </h3>
                <div className="flex flex-wrap gap-2">
                  {openMIVs.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const exists = formData.linkedMIVs.includes(m.id);
                        setFormData({
                          ...formData,
                          linkedMIVs: exists ? formData.linkedMIVs.filter(id => id !== m.id) : [...formData.linkedMIVs, m.id],
                          returnedItems: [] // Reset returned items when pool changes
                        });
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-2",
                        formData.linkedMIVs.includes(m.id) 
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                      )}
                    >
                      {formData.linkedMIVs.includes(m.id) ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {m.voucherNumber} ({m.items?.length} أصناف)
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-amber-600 font-bold italic">* يمكنك اختيار أكثر من سند إذا كان التسليم يغطي عدة طلبات صرف سابقة.</p>
              </div>
            )}

            {/* STEP 3: PRODUCTION RECEIPT */}
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
                    <Input 
                      type="number" 
                      value={formData.qtyAccepted} 
                      onChange={(e) => setFormData({...formData, qtyAccepted: Number(e.target.value)})} 
                      className="h-14 font-black text-center text-2xl text-emerald-700 bg-emerald-50 border-emerald-200" 
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">ملاحظات الفحص</Label>
                    <Input 
                      value={formData.notes} 
                      onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                      className="h-14 bg-slate-50"
                      placeholder="جودة ممتازة، نقشة دقيقة..."
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[9px] font-black text-emerald-800 uppercase">أجر الموظف لكل قطعة منتجة</p>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={formData.wageRate} 
                          onChange={(e) => setFormData({...formData, wageRate: Number(e.target.value)})}
                          className="h-8 w-24 text-xs font-black bg-white border-emerald-200" 
                        />
                        <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="h-8 px-2 bg-white border border-emerald-200 rounded text-[9px] font-black">
                          <option value="YER">YER</option>
                          <option value="SAR">SAR</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-800 uppercase">إجمالي المستحق لهذا السند</p>
                    <p className="text-xl font-black text-emerald-700 tabular-nums">
                      {(formData.qtyAccepted * formData.wageRate).toLocaleString()} <span className="text-[10px]">{formData.currency}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: SMART RETURNED MATERIALS */}
            <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                <RefreshCcw className="w-3.5 h-3.5" /> استرجاع المواد الخام المتبقية (إغلاق عهدة السندات المختارة)
              </h3>
              
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">{lang === 'ar' ? 'الصنف من العهدة' : 'ISSUED MATERIAL'}</Label>
                  <select 
                    id="matSelect"
                    disabled={formData.linkedMIVs.length === 0}
                    className="w-full h-10 px-3 bg-white text-slate-900 border border-blue-200 rounded-md text-xs font-bold outline-none disabled:opacity-50"
                  >
                    <option value="">{formData.linkedMIVs.length === 0 ? '-- اختر سندات الصرف أولاً --' : '-- اختر مادة من العهدة لاسترجاعها --'}</option>
                    {issuedMaterialsPool.map(m => (
                      <option key={m.id} value={m.id} className="text-slate-900">
                        {m.nameAr} ({lang === 'ar' ? 'العهدة الكلية:' : 'Total Issued:'} {m.qty} {m.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">{lang === 'ar' ? 'الكمية المرتجعة' : 'RETURN QTY'}</Label>
                  <Input id="qtySelect" type="number" step="0.01" placeholder="0.00" className="h-10 bg-white font-bold" />
                </div>
                <Button 
                  type="button" 
                  disabled={formData.linkedMIVs.length === 0}
                  onClick={() => {
                    const id = (document.getElementById('matSelect') as HTMLSelectElement).value;
                    const qty = Number((document.getElementById('qtySelect') as HTMLInputElement).value);
                    if (id && qty > 0) {
                      handleReturnItem(id, qty);
                      (document.getElementById('qtySelect') as HTMLInputElement).value = '';
                    }
                  }}
                  className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 shadow-md"
                >
                  إدراج الاسترجاع
                </Button>
              </div>

              {formData.returnedItems.length > 0 && (
                <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                   <Table className="text-right bg-white/50">
                      <TableHeader className="bg-blue-50/50">
                         <TableRow>
                            <TableHead className="text-right text-[9px] font-black text-blue-500 uppercase">المادة المستلمة</TableHead>
                            <TableHead className="text-center text-[9px] font-black text-blue-500 uppercase">الكمية المرتجعة</TableHead>
                            <TableHead className="text-center text-[9px] font-black text-blue-500 uppercase">الوحدة</TableHead>
                            <TableHead className="w-10"></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {formData.returnedItems.map((item, idx) => (
                            <TableRow key={idx} className="border-b border-blue-50">
                               <TableCell className="text-xs font-bold text-slate-700">{item.nameAr}</TableCell>
                               <TableCell className="text-center font-black tabular-nums text-blue-700">{item.qty}</TableCell>
                               <TableCell className="text-center text-[10px] font-black text-slate-400 uppercase">{item.unit}</TableCell>
                               <TableCell>
                                  <button type="button" onClick={() => setFormData({...formData, returnedItems: formData.returnedItems.filter((_, i) => i !== idx)})} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !formData.workerId || !formData.orderId} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                ترحيل التسوية وتحديث المخازن والإنجاز
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW/PRINT DIALOG */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {lang === 'ar' ? 'معاينة طباعة سند التسوية' : 'Production Settlement Print Preview'}
            </DialogTitle>
          </DialogHeader>
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
                       <p className="text-lg font-black text-emerald-700 tabular-nums">{printingVoucher.wageAmount?.toLocaleString()} {printingVoucher.currency}</p>
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
                          <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">{printingVoucher.qtyAccepted} قطعة</TableCell>
                          <TableCell className="text-center font-bold text-sm tabular-nums">{printingVoucher.wageRate}</TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums text-emerald-900">{printingVoucher.wageAmount?.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {printingVoucher.returnedItems?.length > 0 && (
                      <>
                        <h4 className="text-[10px] font-black text-blue-900 border-r-4 border-blue-600 pr-3 uppercase">ثانياً: المواد المرجعة للمخازن</h4>
                        <Table className="text-right border-2 border-blue-900/10">
                          <TableHeader className="bg-blue-900/5">
                            <TableRow>
                              <TableHead className="text-right font-black text-xs py-3 text-blue-900">المادة الخام</TableHead>
                              <TableHead className="text-center font-black text-xs py-3 text-blue-900">الكمية المرتجعة</TableHead>
                              <TableHead className="text-center font-black text-xs py-3 text-blue-900">الوحدة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {printingVoucher.returnedItems.map((item: any, i: number) => (
                              <TableRow key={i} className="bg-white/40 border-b border-blue-50">
                                <TableCell className="font-bold text-sm py-3 text-slate-800">{item.nameAr}</TableCell>
                                <TableCell className="text-center font-black text-sm text-blue-700 tabular-nums">{item.qty}</TableCell>
                                <TableCell className="text-center text-[10px] font-black text-blue-500 uppercase">{item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center">
                    <div className="space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase">أمين المستودع</p><div className="h-px bg-slate-200 w-2/3 mx-auto" /><p className="text-[8px] font-bold text-slate-400">Signature / التاريخ</p></div>
                    <div className="space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase">الموظف (المسلم)</p><div className="h-px bg-slate-200 w-2/3 mx-auto" /><p className="text-[8px] font-bold text-slate-400">Signature / التاريخ</p></div>
                    <div className="space-y-6"><p className="text-[10px] font-black text-slate-400 uppercase">المدير / المشرف</p><div className="h-px bg-slate-200 w-2/3 mx-auto" /><p className="text-[8px] font-bold text-slate-400">Approval / التوقيع</p></div>
                  </div>
                  
                  <div className="mt-12 text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">
                    GENERATED BY TIA SYSTEM - PRODUCTION SETTLEMENT PROTOCOL ACTIVE
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
