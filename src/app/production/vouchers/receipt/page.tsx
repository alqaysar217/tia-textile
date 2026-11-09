
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
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'qtyAccepted'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T', 1)[0],
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

  // Current Item Selection State
  const [currentItem, setCurrentItem] = useState({ id: '', qty: 0 });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const mivQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allMIVs } = useCollection<any>(mivQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status !== 'deleted'), [allOrders]);
  
  const relevantWorkers = useMemo(() => {
    if (!formData.orderId || !allWorkers || !allMIVs) return [];
    const workerIdsWithOpenIssues = allMIVs
      .filter(m => m.orderId === formData.orderId && (m.status === 'posted' || m.status === 'settled'))
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

  // SMART LOGIC: Calculate current net balance in worker hands
  const issuedMaterialsPool = useMemo(() => {
    if (!formData.linkedMIVs.length || !allMIVs || !vouchers) return [];
    
    const pool: Record<string, { nameAr: string; qty: number; unit: string }> = {};
    
    // 1. Calculate Gross Issued
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

    // 2. Subtract what was ALREADY returned
    vouchers.forEach(v => {
      if (v.id === editingVoucherId || v.status === 'deleted' || v.type !== 'production_receipt') return;
      const sharesAnyMIV = v.linkedMIVs?.some((id: string) => formData.linkedMIVs.includes(id));
      if (sharesAnyMIV && v.returnedItems) {
        v.returnedItems.forEach((ret: any) => {
          if (pool[ret.id]) {
            pool[ret.id].qty -= ret.qty;
          }
        });
      }
    });

    return Object.entries(pool)
      .map(([id, data]) => ({ id, ...data }))
      .filter(item => item.qty > 0); 
  }, [formData.linkedMIVs, allMIVs, vouchers, editingVoucherId]);

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
    
    // Search filter
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
    
    // Batch filter
    if (batchFilter !== 'all') {
      result = result.filter(v => v.orderId === batchFilter);
    }
    
    // Sorting
    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'date') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (sortBy === 'qtyAccepted') {
        const numA = Number(valA);
        const numB = Number(valB);
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      const comp = String(valA).localeCompare(String(valB), 'en', { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, sortBy, sortOrder]);

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2,
        cacheBust: true,
        fontEmbedCSS: '', 
      });
      const link = document.createElement('a');
      link.download = `Settlement-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: lang === 'ar' ? "تم تحميل السند" : "Voucher Downloaded" });
    } catch (err) {
      console.error('Image generation failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      lang === 'ar' ? 'رقم السند' : 'Voucher No',
      lang === 'ar' ? 'التاريخ' : 'Date',
      lang === 'ar' ? 'الموظف' : 'Worker',
      lang === 'ar' ? 'أمر الإنتاج' : 'Order',
      lang === 'ar' ? 'الكمية المستلمة' : 'Qty Accepted',
      lang === 'ar' ? 'أجر القطعة' : 'Wage Rate',
      lang === 'ar' ? 'إجمالي الأجر' : 'Total Wage',
      lang === 'ar' ? 'العملة' : 'Currency'
    ];

    const rows = filteredVouchers.map(v => {
      const worker = allWorkers?.find(w => w.id === v.workerId);
      const order = allOrders?.find(o => o.id === v.orderId);
      return [
        v.voucherNumber,
        v.date,
        worker?.fullName || '---',
        order?.orderNumber || '---',
        v.qtyAccepted || 0,
        v.wageRate || 0,
        v.wageAmount || 0,
        v.currency || 'YER'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProductionReceipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: lang === 'ar' ? "تم تصدير البيانات" : "Data Exported" });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || !formData.orderId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0) {
      toast({ variant: "destructive", title: lang === 'ar' ? "بيانات ناقصة" : "Missing Data" });
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(db);
    const wageAmount = Number(formData.qtyAccepted) * Number(formData.wageRate);
    const currentStageId = selectedOrder?.currentStageId || '';

    const voucherData = {
      ...formData,
      currentStageId,
      qtyAccepted: Number(formData.qtyAccepted),
      wageAmount,
      totalQty: Number(formData.qtyAccepted),
      type: 'production_receipt',
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingVoucherId) {
        const oldVSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldV = oldVSnap.data();
        if (oldV) {
          const orderRef = doc(db, 'productionOrders', oldV.orderId);
          const oSnap = await getDoc(orderRef);
          batch.update(orderRef, { completedQty: Math.max(0, (oSnap.data()?.completedQty || 0) - oldV.qtyAccepted) });
          
          oldV.returnedItems?.forEach((item: any) => {
            const mRef = doc(db, 'materials', item.id);
            const mData = allMaterials?.find(m => m.id === item.id);
            if (mData) batch.update(mRef, { currentQty: Math.max(0, (mData.currentQty || 0) - item.qty) });
          });
        }
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `PRV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      const orderRef = doc(db, 'productionOrders', formData.orderId);
      const oSnap = await getDoc(orderRef);
      batch.update(orderRef, { completedQty: (oSnap.data()?.completedQty || 0) + Number(formData.qtyAccepted) });

      formData.returnedItems.forEach(item => {
        const mRef = doc(db, 'materials', item.id);
        const mData = allMaterials?.find(m => m.id === item.id);
        if (mData) batch.update(mRef, { currentQty: (mData.currentQty || 0) + Number(item.qty) });
      });

      if (formData.isFinalSettlement) {
        formData.linkedMIVs.forEach(id => batch.update(doc(db, 'vouchers', id), { status: 'settled', updatedAt: serverTimestamp() }));
      }

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم الترحيل بنجاح" : "Posted Successfully" });
      resetDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnItem = () => {
    if (!currentItem.id || currentItem.qty <= 0) return;
    const issued = issuedMaterialsPool.find(m => m.id === currentItem.id);
    if (!issued) return;

    if (currentItem.qty > issued.qty) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "تنبيه" : "Validation", 
        description: lang === 'ar' ? `الكمية المدخلة تتجاوز الرصيد المتبقي بالعهدة (${issued.qty.toLocaleString('en-US')})` : `Qty exceeds remaining balance (${issued.qty.toLocaleString('en-US')})` 
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      returnedItems: [...prev.returnedItems.filter(i => i.id !== currentItem.id), { ...issued, qty: currentItem.qty }]
    }));
    setCurrentItem({ id: '', qty: 0 });
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ date: new Date().toISOString().split('T', 1)[0], orderId: '', workerId: '', linkedMIVs: [], isFinalSettlement: true, notes: '', qtyAccepted: 0, wageRate: 0, currency: 'YER', returnedItems: [] });
    setCurrentItem({ id: '', qty: 0 });
  };

  const handleDeleteRequest = async () => {
    if (!db || !deletingVoucher) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    try {
      const orderRef = doc(db, 'productionOrders', deletingVoucher.orderId);
      const oSnap = await getDoc(orderRef);
      batch.update(orderRef, { completedQty: Math.max(0, (oSnap.data()?.completedQty || 0) - deletingVoucher.qtyAccepted) });

      deletingVoucher.returnedItems?.forEach((item: any) => {
        const mRef = doc(db, 'materials', item.id);
        const mData = allMaterials?.find(m => m.id === item.id);
        if (mData) batch.update(mRef, { currentQty: Math.max(0, (mData.currentQty || 0) - item.qty) });
      });

      deletingVoucher.linkedMIVs?.forEach((id: string) => batch.update(doc(db, 'vouchers', id), { status: 'posted' }));
      batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
      await batch.commit();
      toast({ title: lang === 'ar' ? "تم النقل للأرشيف" : "Archived" });
    } finally {
      setIsSubmitting(false);
      setDeletingVoucher(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HUB - HEADER */}
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
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'إغلاق عهدة واستلام المنجز' : 'Settlement Vouchers'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} 
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`} 
              />
            </div>

            <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-100">
              <Button onClick={handleExportCSV} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-slate-50 border border-transparent">
                <FileDown className="w-4 h-4 text-emerald-600" />
                {lang === 'ar' ? 'تصدير' : 'Export'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-slate-50 border border-transparent">
                    <Filter className="w-4 h-4" />
                    {lang === 'ar' ? 'تصفية' : 'Filter'}
                    {(batchFilter !== 'all' || sortOrder !== 'desc' || sortBy !== 'date') && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 shadow-xl">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'ترتيب النتائج' : 'SORTING'}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => toggleSort('date')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'حسب التاريخ' : 'By Date'}</div>
                    {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('voucherNumber')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                    <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'حسب رقم السند' : 'By Reference'}</div>
                    {sortBy === 'voucherNumber' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('qtyAccepted')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5">
                    <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-slate-400" /> {lang === 'ar' ? 'حسب المنجز' : 'By Quantity'}</div>
                    {sortBy === 'qtyAccepted' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600" />)}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang === 'ar' ? 'تصفية حسب الدفعة' : 'FILTER BY BATCH'}</DropdownMenuLabel>
                  <ScrollArea className="h-40">
                    <DropdownMenuItem onClick={() => setBatchFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                      {lang === 'ar' ? 'جميع الدفعات' : 'All Batches'}
                      {batchFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </DropdownMenuItem>
                    {activeOrders?.map(o => (
                      <DropdownMenuItem key={o.id} onClick={() => setBatchFilter(o.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer">
                        <span className="truncate max-w-[180px]">{o.orderNumber} - {o.title}</span>
                        {batchFilter === o.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {lang === 'ar' ? 'تسوية جديدة' : 'New Settlement'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right border-separate border-spacing-0">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'المنجز' : 'DONE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'الأجر' : 'WAGE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد تسويات مسجلة</TableCell></TableRow>
              ) : filteredVouchers.map((v) => (
                <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                  <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.voucherNumber}</TableCell>
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.date}</TableCell>
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === v.workerId)?.fullName || '---'}</TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 tabular-nums font-black border-emerald-100">
                      {(v.qtyAccepted || 0).toLocaleString('en-US')} {lang === 'ar' ? 'قطعة' : 'Pcs'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center font-black text-slate-900 tabular-nums">
                    {(v.wageAmount || 0).toLocaleString('en-US')} <span className="text-[10px] text-slate-400">{v.currency}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => { setEditingVoucherId(v.id); setFormData({ ...v }); setIsAddDialogOpen(true); }} className="gap-2 font-bold py-2 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل السند' : 'Edit Voucher'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingVoucher(v)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للمهملات' : 'Move to Trash'}
                          </DropdownMenuItem>
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

      {/* NEW/EDIT VOUCHER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[900px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                {editingVoucherId ? (lang === 'ar' ? 'تعديل سند تسوية' : 'Edit Settlement') : (lang === 'ar' ? 'إغلاق عهدة واستلام إنتاج' : 'New Production Settlement')}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Full closure of material cycle and wage calculation</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Workflow className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'أمر الإنتاج' : 'BATCH'}</Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: '', linkedMIVs: []})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">{lang === 'ar' ? '-- اختر أمر الإنتاج --' : '-- Select Batch --'}</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'الموظف (الذي عليه عهدة)' : 'PERSONNEL'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, linkedMIVs: []})} disabled={!formData.orderId} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none disabled:opacity-50" required>
                  <option value="">{lang === 'ar' ? '-- اختر الموظف --' : '-- Select Person --'}</option>
                  {relevantWorkers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ التسوية' : 'DATE'}</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
            </div>

            {openMIVs.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> {lang === 'ar' ? 'سندات الصرف المفتوحة (التي سيتم تسويتها)' : 'Open Issue Vouchers (Liability)'}</h3>
                   <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-amber-200">
                      <Checkbox id="finalSettlement" checked={formData.isFinalSettlement} onCheckedChange={(val) => setFormData({...formData, isFinalSettlement: !!val})} />
                      <label htmlFor="finalSettlement" className="text-[10px] font-black text-slate-600 cursor-pointer">{lang === 'ar' ? 'إغلاق السندات المختارة نهائياً' : 'Final Closure'}</label>
                   </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {openMIVs.map(m => (
                    <button key={m.id} type="button" onClick={() => {
                      const exists = formData.linkedMIVs.includes(m.id);
                      setFormData({ ...formData, linkedMIVs: exists ? formData.linkedMIVs.filter(id => id !== m.id) : [...formData.linkedMIVs, m.id], returnedItems: [] });
                    }} className={cn("px-3 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-2", formData.linkedMIVs.includes(m.id) ? "bg-emerald-600 text-white border-emerald-700 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300")}>
                      {formData.linkedMIVs.includes(m.id) ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {m.voucherNumber} ({(m.items?.length || 0).toLocaleString('en-US')} {lang === 'ar' ? 'أصناف' : 'Items'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                   <Label className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المنتج المستلم' : 'PRODUCED ITEM'}</Label>
                   <div className="w-24 h-24 mx-auto bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
                      <img src={targetProduct?.image || 'https://placehold.co/100'} className="w-full h-full object-cover" alt="product" />
                   </div>
                   <p className="text-xs font-black text-slate-900">{targetProduct?.nameAr || '---'}</p>
                   <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                      <Target className="w-3 h-3" />
                      {lang === 'ar' ? 'المنجز:' : 'Done:'} {(selectedOrder?.completedQty || 0).toLocaleString('en-US')} / {(selectedOrder?.targetQty || 0).toLocaleString('en-US')}
                   </div>
                </div>
              </div>
              <div className="md:col-span-8 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-emerald-700 uppercase">{lang === 'ar' ? 'الكمية المستلمة (صالحة)' : 'ACCEPTED QTY'}</Label>
                    <Input type="number" step="any" value={formData.qtyAccepted || ''} onChange={(e) => setFormData({...formData, qtyAccepted: Number(e.target.value)})} className="h-14 font-black text-center text-2xl text-emerald-700 bg-emerald-50 border-emerald-200 tabular-nums" required min="0.01" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'ملاحظات الفحص' : 'QC NOTES'}</Label>
                    <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-14 bg-slate-50 text-xs font-bold" placeholder={lang === 'ar' ? 'جودة النسيج، النظافة...' : 'Quality, cleanliness...'} />
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm"><Wallet className="w-5 h-5" /></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-emerald-800 uppercase">{lang === 'ar' ? 'أجر القطعة الواحد' : 'WAGE PER PIECE'}</p>
                      <div className="flex items-center gap-2">
                        <Input type="number" step="any" value={formData.wageRate || ''} onChange={(e) => setFormData({...formData, wageRate: Number(e.target.value)})} className="h-8 w-24 text-xs font-black tabular-nums" required min="0.01" />
                        <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="h-8 px-2 bg-white border border-emerald-200 rounded text-[9px] font-black">
                          <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-800 uppercase">{lang === 'ar' ? 'إجمالي المستحق لهذا السند' : 'TOTAL SETTLEMENT'}</p>
                    <p className="text-xl font-black text-emerald-700 tabular-nums">{(formData.qtyAccepted * formData.wageRate).toLocaleString('en-US')} <span className="text-[10px]">{formData.currency}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2"><RefreshCcw className="w-3.5 h-3.5" /> {lang === 'ar' ? 'استرجاع المواد الخام المتبقية (تصفية عهدة)' : 'RETURN REMAINING RAW MATERIALS (LIABILITY)'}</h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">{lang === 'ar' ? 'الصنف من العهدة' : 'ITEM FROM LIABILITY'}</Label>
                  <select 
                    disabled={formData.linkedMIVs.length === 0} 
                    className="w-full h-10 px-3 bg-white border border-blue-200 rounded-md text-xs font-bold outline-none"
                    value={currentItem.id}
                    onChange={(e) => setCurrentItem({ ...currentItem, id: e.target.value })}
                  >
                    <option value="">{lang === 'ar' ? '-- اختر مادة لإعادتها للمخزن --' : '-- Select Item to Return --'}</option>
                    {issuedMaterialsPool.map(m => (
                      <option key={m.id} value={m.id}>{m.nameAr} ({lang === 'ar' ? 'الرصيد لديه:' : 'In hand:'} {m.qty.toLocaleString('en-US')} {m.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">{lang === 'ar' ? 'الكمية المرتجعة' : 'RETURN QTY'}</Label>
                  <Input 
                    type="number" 
                    step="any" 
                    value={currentItem.qty || ''} 
                    onChange={(e) => setCurrentItem({ ...currentItem, qty: Number(e.target.value) })}
                    className="h-10 bg-white font-bold tabular-nums" 
                  />
                </div>
                <Button type="button" onClick={handleReturnItem} className="h-10 bg-blue-600 text-white font-black text-xs px-6 rounded-md shadow-md">{lang === 'ar' ? 'إدراج الاسترجاع' : 'Insert Return'}</Button>
              </div>
              {formData.returnedItems.length > 0 && (
                <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm bg-white/50">
                   <Table className="text-right">
                      <TableHeader className="bg-blue-50/50">
                        <TableRow>
                          <TableHead className="text-right text-[9px] font-black text-blue-500 uppercase">{lang === 'ar' ? 'المادة المستلمة' : 'MATERIAL'}</TableHead>
                          <TableHead className="text-center text-[9px] font-black text-blue-500 uppercase">{lang === 'ar' ? 'الكمية المرجعة' : 'QTY'}</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {formData.returnedItems.map((item, idx) => (
                            <TableRow key={idx} className="border-b border-blue-50">
                               <TableCell className="text-xs font-bold">{item.nameAr}</TableCell>
                               <TableCell className="text-center font-black tabular-nums">{(item.qty || 0).toLocaleString('en-US')} {item.unit}</TableCell>
                               <TableCell><button type="button" onClick={() => setFormData({...formData, returnedItems: formData.returnedItems.filter((_, i) => i !== idx)})} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !formData.workerId || !formData.orderId || formData.linkedMIVs.length === 0 || formData.qtyAccepted <= 0 || formData.wageRate <= 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                {editingVoucherId ? (lang === 'ar' ? 'تحديث السند والمخازن' : 'Update Voucher & WMS') : (lang === 'ar' ? 'ترحيل التسوية وتحديث المخازن والإنجاز' : 'Post Settlement & Update Assets')}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT PREVIEW DIALOG */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{lang === 'ar' ? 'معاينة طباعة سند التسوية' : 'Settlement Voucher Preview'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  
                  {/* WATERMARK LOGO */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>

                  {/* PROFESSIONAL BILINGUAL HEADER */}
                  <div className="grid grid-cols-3 items-center border-b-[6px] border-emerald-800 pb-8 mb-8 relative z-10">
                    <div className="text-right space-y-1">
                      <h2 className="text-xl font-black text-emerald-900 leading-tight">جمعية الصناعات النسيجية</h2>
                      <p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p>
                      <p className="text-[11px] font-bold text-slate-400 tabular-nums" dir="ltr">0777 263 091 | nseeg202020@gmail.com</p>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-24 h-24 bg-white border-2 border-emerald-800/10 rounded-full flex items-center justify-center p-2 shadow-sm relative overflow-hidden">
                        <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="text-left space-y-1" dir="ltr">
                      <h2 className="text-[14px] font-black text-emerald-900 uppercase leading-tight tracking-tight">Textile Industries Association</h2>
                      <p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa - Yemen</p>
                      <p className="text-[10px] font-bold text-slate-400 tabular-nums">0777 263 091 | nseeg202020@gmail.com</p>
                    </div>
                  </div>

                  {/* VOUCHER TITLE BAR */}
                  <div className="text-center mb-10 relative z-10">
                    <div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm ring-4 ring-emerald-50">
                      <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">
                        {lang === 'ar' ? 'سند استلام وتسوية إنتاج' : 'Settlement & Production Receipt'}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 relative z-10">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'الموظف المسلم' : 'Worker'}</span>
                        <span className="text-sm font-black text-slate-900">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'رقم السند' : 'Voucher No.'}</span>
                        <span className="text-sm font-black text-emerald-900 tabular-nums tracking-wider">{printingVoucher.voucherNumber}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تاريخ التسوية' : 'Settlement Date'}</span>
                        <span className="text-sm font-black text-slate-700 tabular-nums">{printingVoucher.date}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'الاستحقاق المالي' : 'Total Wage'}</span>
                        <span className="text-sm font-black text-emerald-700 tabular-nums">{(printingVoucher.wageAmount || 0).toLocaleString('en-US')} {printingVoucher.currency}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'القسم المسؤول' : 'Department'}</span>
                        <span className="text-sm font-black text-slate-700">{allDepartments?.find(d => d.id === printingVoucher.currentStageId)?.nameAr || '---'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 space-y-4 relative z-10">
                    <h4 className="text-[10px] font-black text-emerald-900 border-r-4 border-emerald-600 pr-3 mb-2 uppercase">
                      {lang === 'ar' ? 'أولاً: مخرجات الإنتاج المنجزة' : 'I. FINISHED PRODUCTION OUTPUTS'}
                    </h4>
                    <Table className="text-right border-2 border-emerald-900/10">
                      <TableHeader className="bg-emerald-900/5">
                        <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                          <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'نوع المعوز' : 'Item Type'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'الكمية المستلمة' : 'Accepted Qty'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'أجر القطعة' : 'Wage/Pcs'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-white/40">
                          <TableCell className="font-bold text-sm py-5">
                            {allProducts?.find(p => p.id === allOrders?.find(o => o.id === printingVoucher.orderId)?.productId)?.nameAr}
                          </TableCell>
                          <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">
                            {(printingVoucher.qtyAccepted || 0).toLocaleString('en-US')} {lang === 'ar' ? 'قطعة' : 'Pcs'}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm tabular-nums">
                            {(printingVoucher.wageRate || 0).toLocaleString('en-US')}
                          </TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums text-emerald-900">
                            {(printingVoucher.wageAmount || 0).toLocaleString('en-US')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {printingVoucher.returnedItems?.length > 0 && (
                    <div className="mb-10 space-y-4 relative z-10">
                      <h4 className="text-[10px] font-black text-blue-900 border-r-4 border-blue-600 pr-3 mb-2 uppercase">
                        {lang === 'ar' ? 'ثانياً: المواد الخام المرتجعة للمخزن' : 'II. RETURNED RAW MATERIALS'}
                      </h4>
                      <Table className="text-right border-2 border-blue-900/10">
                        <TableHeader className="bg-blue-900/5">
                          <TableRow className="hover:bg-transparent border-b-2 border-blue-900/20">
                            <TableHead className="text-right font-black text-xs py-4 text-blue-900">{lang === 'ar' ? 'اسم المادة' : 'Material Name'}</TableHead>
                            <TableHead className="text-center font-black text-xs py-4 text-blue-900">{lang === 'ar' ? 'الكمية المرجعة' : 'Returned Qty'}</TableHead>
                            <TableHead className="text-center font-black text-xs py-4 text-blue-900">{lang === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {printingVoucher.returnedItems.map((item: any, i: number) => (
                            <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                              <TableCell className="font-bold text-sm py-4 text-slate-800">{item.nameAr}</TableCell>
                              <TableCell className="text-center font-black text-sm text-blue-700 tabular-nums">
                                {(item.qty || 0).toLocaleString('en-US')}
                              </TableCell>
                              <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-4">{item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center relative z-10 mt-auto">
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'أمين المستودع' : 'Store Keeper'}</p>
                      <div className="h-px bg-slate-300 w-full mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'توقيع الموظف (المسلم)' : 'Worker Signature'}</p>
                      <div className="h-px bg-slate-300 w-full mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'اعتماد المدير / المشرف' : 'Auth. Approval'}</p>
                      <div className="h-px bg-slate-300 w-full mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Authorized Signature</p>
                    </div>
                  </div>

                  <div className="mt-14 pt-4 text-center border-t border-slate-50 relative z-10 flex items-center justify-center gap-4">
                    <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">Generated by TIA Production System</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                    <span className="text-[8px] font-black text-slate-300 tabular-nums uppercase tracking-widest">{new Date().toLocaleString('en-US')}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all">
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Download className="w-5 h-5" />}
              {lang === 'ar' ? 'تحميل السند كصورة PNG' : 'Download as PNG Image'}
            </Button>
            <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-8 rounded-xl border border-slate-200 text-slate-500">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
              <History className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'نقل للمهملات وعكس التأثير' : 'Move to Trash & Reverse'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' ? 'تحذير: سيتم خصم المنجز من أمر الإنتاج وإعادة فتح عهدة المواد للعامل وسحب المرتجع من المخزن تلقائياً.' : 'Warning: Progress will be deducted, liabilities reopened, and returns removed from stock.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeleteRequest} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === 'ar' ? "تأكيد الحذف" : "Confirm")}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">{lang === 'ar' ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
