'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Wallet, 
  Save, 
  Loader2, 
  Calendar,
  UserCheck,
  History,
  FileText,
  CheckCircle2,
  Users2,
  Check,
  ShieldCheck,
  X,
  MoreVertical,
  Download,
  Eye,
  FileDown,
  Filter,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Hash,
  Coins,
  HandCoins,
  Receipt,
  AlertCircle,
  Info,
  Edit2,
  Trash2,
  RefreshCcw,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDoc, writeBatch } from 'firebase/firestore';
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toPng } from 'html-to-image';
import { VoucherTemplate } from '@/components/production/VoucherTemplate';
import { useProduction } from '../ProductionContext';

export default function PayrollManagementPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.wages?.create;
  const canEdit = isAdmin || permissions.wages?.edit;
  const canDelete = isAdmin || permissions.wages?.delete;

  const [activeTab, setActiveTab] = useState('balances');
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [sortBy, setSortBy] = useState<'date' | 'voucherNumber' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');

  /**
   * دالة حارس الأمان لفك تجمد الواجهة يدوياً (بروتوكول المطهر الشامل)
   * تضمن تحرير المتصفح من كافة الأقفال فور إغلاق أي نافذة
   */
  const forceUIUnlock = useCallback(() => {
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.body.removeAttribute('data-scroll-locked');
      
      const html = document.documentElement;
      html.style.pointerEvents = 'auto';
      html.style.overflow = 'auto';
      html.removeAttribute('data-scroll-locked');
    }, 150);
  }, []);

  /**
   * نظام المراقبة الذكي - يراقب حالة إغلاق النوافذ (بما فيها الضغط بالخارج)
   * ويقوم باستدعاء المطهر البرمجي فوراً لضمان عدم تجمد الشاشة
   */
  useEffect(() => {
    if (!isPayDialogOpen && !deletingVoucher && !printingVoucher) {
      forceUIUnlock();
    }
  }, [isPayDialogOpen, deletingVoucher, printingVoucher, forceUIUnlock]);

  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useDoc<any>(settingsRef);
  const systemCurrency = savedSettings?.baseCurrency || 'YER';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    amount: 0,
    currency: 'YER',
    notes: '',
    linkedReceipts: [] as string[]
  });

  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  
  const receiptsQuery = useMemo(() => !db ? null : query(
    collection(db, 'vouchers'), 
    where('type', '==', 'production_receipt'),
    where('status', '==', 'posted')
  ), [db]);

  const paymentsQuery = useMemo(() => !db ? null : query(
    collection(db, 'vouchers'), 
    where('type', '==', 'wage_payment'),
    where('status', '==', 'posted')
  ), [db]);

  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allReceipts, loading: receiptsLoading } = useCollection<any>(receiptsQuery);
  const { data: allPayments, loading: paymentsLoading } = useCollection<any>(paymentsQuery);

  const loading = workersLoading || receiptsLoading || paymentsLoading;

  useEffect(() => {
    if (!isPayDialogOpen || editingVoucherId || !allReceipts || !formData.workerId) return;

    const myDues = allReceipts.filter(r => 
      r.workerId === formData.workerId && 
      r.status === 'posted' && 
      r.paymentStatus !== 'paid' && 
      (r.currency || 'YER') === formData.currency
    );
    
    const ids = myDues.map(r => r.id);
    const total = myDues.reduce((sum, r) => sum + (Number(r.wageAmount) || 0), 0);
    
    const currentIds = formData.linkedReceipts;
    const isSame = ids.length === currentIds.length && ids.every(id => currentIds.includes(id));

    if (!isSame || formData.amount !== total) {
      setFormData(prev => ({ ...prev, linkedReceipts: ids, amount: total }));
    }
  }, [formData.workerId, formData.currency, isPayDialogOpen, editingVoucherId, allReceipts, formData.linkedReceipts, formData.amount]);

  const flattenedBalances = useMemo(() => {
    if (!allWorkers || !allReceipts) return [];
    const activeReceipts = (allReceipts || []).filter(r => r.status === 'posted' && r.paymentStatus !== 'paid');
    const list: any[] = [];

    allWorkers.filter(w => w.status !== 'deleted').forEach(worker => {
      const myUnpaid = activeReceipts.filter(r => r.workerId === worker.id);
      const balanceByCurrency: Record<string, number> = {};
      myUnpaid.forEach(r => {
        const curr = r.currency || 'YER';
        balanceByCurrency[curr] = (balanceByCurrency[curr] || 0) + (Number(r.wageAmount) || 0);
      });
      Object.entries(balanceByCurrency).forEach(([currency, amount]) => {
        if (amount > 0) {
          list.push({ ...worker, displayCurrency: currency, displayAmount: amount });
        }
      });
    });
    return list;
  }, [allWorkers, allReceipts]);

  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];
    let result = allPayments.filter(p => p.status === 'posted');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => {
        const worker = allWorkers?.find(w => w.id === p.workerId);
        return p.voucherNumber?.toLowerCase().includes(s) || worker?.fullName?.toLowerCase().includes(s);
      });
    }
    if (workerFilter !== 'all') result = result.filter(p => p.workerId === workerFilter);
    if (dateFrom) result = result.filter(p => p.date >= dateFrom);
    if (dateTo) result = result.filter(p => p.date <= dateTo);
    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '', valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      if (sortBy === 'totalAmount') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [allPayments, allWorkers, search, sortBy, sortOrder, workerFilter, dateFrom, dateTo]);

  const unpaidReceipts = useMemo(() => {
    if (!formData.workerId || !allReceipts) return [];
    return allReceipts.filter(r => 
      r.workerId === formData.workerId && 
      r.status === 'posted' &&
      r.paymentStatus !== 'paid' && 
      (r.currency || 'YER') === formData.currency
    );
  }, [formData.workerId, formData.currency, allReceipts]);

  const toggleReceiptSelection = useCallback((receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => {
      const isSelected = prev.linkedReceipts.includes(receiptId);
      const newSelection = isSelected 
        ? prev.linkedReceipts.filter(id => id !== receiptId) 
        : [...prev.linkedReceipts, receiptId];
      
      const selectedVouchers = allReceipts?.filter(r => newSelection.includes(r.id)) || [];
      const total = selectedVouchers.reduce((sum, v) => sum + (Number(v.wageAmount) || 0), 0);
      
      return { ...prev, linkedReceipts: newSelection, amount: total };
    });
  }, [allReceipts]);

  const resetDialog = useCallback(() => {
    setIsPayDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      workerId: '', 
      amount: 0, 
      currency: systemCurrency, 
      notes: '', 
      linkedReceipts: [] 
    });
    forceUIUnlock();
  }, [systemCurrency, forceUIUnlock]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || formData.amount <= 0 || formData.linkedReceipts.length === 0) return;

    if (editingVoucherId && !canEdit) { toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتعديل" : "Permission Denied" }); return; }
    if (!editingVoucherId && !canCreate) { toast({ variant: "destructive", title: isRtl ? "غير مسموح بالتسجيل" : "Permission Denied" }); return; }

    setIsSubmitting(true);
    
    // إغلاق المودال وتحرير الواجهة فوراً لضمان السرعة
    setIsPayDialogOpen(false); 
    forceUIUnlock();

    const batch = writeBatch(db);
    const firstReceiptId = formData.linkedReceipts[0];
    const firstReceipt = allReceipts?.find(r => r.id === firstReceiptId);
    
    const paymentData = { 
      ...formData, 
      orderId: firstReceipt?.orderId || '',
      currentStageId: firstReceipt?.currentStageId || '',
      type: 'wage_payment', 
      totalAmount: Number(formData.amount), 
      status: 'posted', 
      updatedAt: serverTimestamp() 
    };

    try {
      let voucherId = editingVoucherId;
      if (editingVoucherId) {
        const oldSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        const oldV = oldSnap.data();
        oldV?.linkedReceipts?.forEach((rid: string) => {
           batch.update(doc(db, 'vouchers', rid), { paymentStatus: 'pending', paidAmount: 0 });
        });
        batch.update(doc(db, 'vouchers', editingVoucherId), paymentData);
      } else {
        const voucherNumber = `PAY-${Date.now().toString().slice(-6)}`;
        const newVoucherRef = doc(collection(db, 'vouchers'));
        voucherId = newVoucherRef.id;
        batch.set(newVoucherRef, { ...paymentData, voucherNumber, createdAt: serverTimestamp() });
      }

      formData.linkedReceipts.forEach(rid => {
        const r = allReceipts?.find(rec => rec.id === rid);
        batch.update(doc(db, 'vouchers', rid), { 
          paymentStatus: 'paid', 
          paidAmount: Number(r?.wageAmount) || 0,
          paymentVoucherId: voucherId 
        });
      });

      await batch.commit();
      toast({ title: isRtl ? "تم تسجيل سند الصرف بنجاح" : "Success" });
      resetDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleEditVoucher = (p: any) => {
    if (!canEdit) return;
    setEditingVoucherId(p.id);
    setFormData({
      date: p.date,
      workerId: p.workerId,
      amount: p.totalAmount,
      currency: p.currency,
      notes: p.notes || '',
      linkedReceipts: p.linkedReceipts || []
    });
    setIsPayDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!db || !deletingVoucher || !canDelete || isSubmitting) return;
    
    setIsSubmitting(true);
    const targetVoucher = deletingVoucher;
    
    // إغلاق المودال وتحرير الواجهة فوراً
    setDeletingVoucher(null);
    forceUIUnlock();

    const batch = writeBatch(db);
    try {
      targetVoucher.linkedReceipts?.forEach((rid: string) => {
        batch.update(doc(db, 'vouchers', rid), { paymentStatus: 'pending', paidAmount: 0, paymentVoucherId: null });
      });
      batch.update(doc(db, 'vouchers', targetVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
      await batch.commit();
      toast({ title: isRtl ? "تم إلغاء السند وإرجاع المستحقات" : "Voucher reversed" });
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleDownloadImage = async () => {
    const el = document.getElementById('printable-payment');
    if (!el || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true, fontEmbedCSS: '' });
      const link = document.createElement('a');
      link.download = `Payment-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
    } finally { setIsDownloading(false); }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir} className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg"><HandCoins className="w-5 h-5 text-emerald-400" /></div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'المالية' : 'Accounting'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'صرف الأجور' : 'Payroll'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">{isRtl ? 'إدارة ذمم ومدفوعات العمال' : 'Personnel Ledger'}</h1>
            </div>
          </div>
          {canCreate && (
            <Button onClick={() => { resetDialog(); setIsPayDialogOpen(true); }} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {isRtl ? 'سند صرف أجر جديد' : 'New Payment'}
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 h-10 w-full md:w-auto shrink-0 shadow-sm">
            <TabsTrigger value="balances" className="font-black text-[10px] uppercase px-4 h-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
               <Users2 className="w-3 h-3 me-2" /> {isRtl ? 'الأرصدة' : 'BALANCES'}
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="font-black text-[10px] uppercase px-4 h-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
               <Receipt className="w-3 h-3 me-2" /> {isRtl ? 'الأرشيف' : 'ARCHIVE'}
            </TabsTrigger>
          </TabsList>

          <div className="relative flex-1 w-full">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600", isRtl ? "right-3" : "left-3")} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث سريع...' : 'Search...'} className={cn("h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100", isRtl ? "pr-10" : "pl-10")} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-200 dark:border-slate-700 h-10">
                <Popover onOpenChange={(open) => !open && forceUIUnlock()}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all", (dateFrom || dateTo) && "border-emerald-500 bg-emerald-50 text-emerald-600")}>
                      <CalendarDays className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align={isRtl ? "start" : "end"} className="w-72 p-4 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="space-y-4 text-right">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2"><CalendarDays className="w-3.5 h-3.5" />{isRtl ? 'تصفية زمنية' : 'DATE RANGE'}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">من</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                        <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400">إلى</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-[10px] font-bold" /></div>
                      </div>
                      {(dateFrom || dateTo) && <Button variant="link" onClick={() => { setDateFrom(''); setDateTo(''); forceUIUnlock(); }} className="text-[9px] h-auto p-0 font-bold text-rose-500 underline uppercase w-full">إعادة تعيين</Button>}
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu onOpenChange={(open) => !open && forceUIUnlock()}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent"><Filter className="w-3.5 h-3.5" /> {isRtl ? 'تصفية' : 'Filter'}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PERSONNEL</DropdownMenuLabel>
                    <ScrollArea className="h-40">
                       <DropdownMenuItem onClick={() => { setWorkerFilter('all'); forceUIUnlock(); }} className="text-xs font-bold cursor-pointer">{isRtl ? 'الكل' : 'All'}</DropdownMenuItem>
                       {allWorkers?.filter(w => w.status !== 'deleted').map(w => (
                         <DropdownMenuItem key={w.id} onClick={() => { setWorkerFilter(w.id); forceUIUnlock(); }} className="text-xs font-bold cursor-pointer">{w.fullName}</DropdownMenuItem>
                       ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button onClick={() => {}} variant="ghost" className="h-8 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent"><FileDown className="w-3.5 h-3.5 text-emerald-600" /> {isRtl ? 'تصدير' : 'Export'}</Button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 no-scrollbar overflow-hidden">
        <TabsContent value="balances" className="flex-1 min-h-0 focus-visible:ring-0 mt-0 data-[state=active]:flex flex-col">
           <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
              <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b dark:border-slate-700">
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>PERSONNEL</TableHead>
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>UNIT</TableHead>
                      <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">DUE BALANCE</TableHead>
                      <TableHead className="w-40 px-6 py-4 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flattenedBalances.map((w, idx) => (
                      <TableRow key={`${w.id}-${w.displayCurrency}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm rounded-lg overflow-hidden">
                              <AvatarImage src={w.photoUrl} className="object-cover" />
                              <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase">{w.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-right">
                              <span className="font-black text-slate-900 dark:text-slate-100 text-xs">{w.fullName}</span>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tabular-nums tracking-widest uppercase">{w.workerId}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs">{allDepartments?.find(d => d.id === w.departmentId)?.nameAr || '---'}</TableCell>
                        <TableCell className="px-6 py-3 text-center">
                          <Badge variant="outline" className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 tabular-nums font-black border-rose-100 dark:border-rose-900/30 py-1.5 px-3">
                            {(w.displayAmount).toLocaleString('en-US')} <span className="ms-1 text-[9px] opacity-60 uppercase">{w.displayCurrency}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                          {canCreate && (
                            <Button onClick={() => { resetDialog(); setFormData(prev => ({...prev, workerId: w.id, currency: w.displayCurrency})); setIsPayDialogOpen(true); }} variant="outline" className="h-10 px-6 rounded-lg text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all gap-2 shadow-sm">
                              <Wallet className="w-3.5 h-3.5" />{isRtl ? 'صرف الآن' : 'Disburse'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="vouchers" className="flex-1 min-h-0 focus-visible:ring-0 mt-0 data-[state=active]:flex flex-col">
           <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
              <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <Table className={cn("text-right border-separate border-spacing-0 w-full", !isRtl && "text-left")}>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-b dark:border-slate-700">
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>REF #</TableHead>
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>DATE</TableHead>
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase", isRtl ? "text-right" : "text-left")}>PERSONNEL</TableHead>
                      <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center">PAID AMOUNT</TableHead>
                      <TableHead className="w-24 px-6 py-4 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map(p => (
                      <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                        <TableCell className={cn("px-6 py-3 font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{p.voucherNumber}</TableCell>
                        <TableCell className={cn("px-6 py-3 font-bold text-slate-500 dark:text-slate-500 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{p.date}</TableCell>
                        <TableCell className={cn("px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs", isRtl ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === p.workerId)?.fullName || '---'}</TableCell>
                        <TableCell className="px-6 py-3 text-center">
                           <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 tabular-nums font-black border-emerald-100 py-1.5 px-3">
                             {(p.totalAmount || 0).toLocaleString('en-US')} <span className="ms-1 uppercase opacity-60">{p.currency}</span>
                           </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                           <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(p)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"><Eye className="w-4 h-4" /></Button>
                              <DropdownMenu onOpenChange={(open) => !open && forceUIUnlock()}>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "end" : "start"} className="w-44 rounded-xl shadow-xl dark:bg-slate-900 dark:border-slate-800">
                                  {canEdit && <DropdownMenuItem onClick={() => handleEditVoucher(p)} className="gap-2 font-bold py-2 cursor-pointer text-xs"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {isRtl ? 'تعديل السند' : 'Edit'}</DropdownMenuItem>}
                                  {canDelete && <DropdownMenuItem onClick={() => setDeletingVoucher(p)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer text-xs focus:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'إلغاء السند' : 'Reverse'}</DropdownMenuItem>}
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
        </TabsContent>

        <div className="mt-4 flex-none bg-slate-900 dark:bg-slate-900/80 rounded-lg p-3 text-white flex items-center gap-4 border border-slate-800 shadow-inner transition-colors duration-300">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><Info className="w-4 h-4" /></div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{isRtl ? 'بروتوكول الرقابة المالية' : 'FINANCIAL PROTOCOL'}</p>
            <p className="text-[10px] text-slate-300 font-bold opacity-80 leading-relaxed">
              {isRtl ? 'تصفية مستحقات العمال تتم حصرياً بناءً على المنجز المقبول والموثق في الإنتاج لمنع التلاعب المالي.' : 'Wage settlement is based strictly on accepted output to prevent financial tampering.'}
            </p>
          </div>
        </div>
      </div>

      <Dialog open={isPayDialogOpen} onOpenChange={(open) => { if(!open) resetDialog(); forceUIUnlock(); }}>
        <DialogContent className="sm:max-w-[800px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="premium-gradient p-6 text-white text-right">
            <DialogHeader className={cn("text-right rtl:text-right ltr:text-left")}>
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white"><Wallet className="w-5 h-5 text-emerald-300" />{editingVoucherId ? (isRtl ? 'تعديل سند الصرف المالي' : 'Edit Payment') : (isRtl ? 'صرف مستحقات الحرفيين' : 'New Wage Payment')}</DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] mt-1 uppercase">Settlement of production receipts and cash release</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSavePayment} className="p-6 space-y-5 bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 block">{isRtl ? 'الموظف المستحق' : 'WORKER'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData(prev => ({...prev, workerId: e.target.value, linkedReceipts: [], amount: 0}))} className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold outline-none dark:text-slate-100 focus:ring-1 focus:ring-emerald-500" required>
                   <option value="">-- {isRtl ? 'اختر الموظف' : 'Select'} --</option>
                   {allWorkers?.filter(w => w.status !== 'deleted' && w.active).map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 block">DATE</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))} className="h-11 font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums" required />
              </div>
            </div>
            
            <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start"><Coins className="w-3.5 h-3.5 text-emerald-600" /> CURRENCY</Label>
                <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value, linkedReceipts: [], amount: 0})} className="h-9 px-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 rounded-lg text-[10px] font-black shadow-sm outline-none dark:text-slate-100">
                  <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                </select>
              </div>
              
              {formData.workerId && unpaidReceipts.length > 0 ? (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                   <Table className="text-right">
                      <TableHeader className="bg-slate-50 dark:bg-slate-800"><TableRow><TableHead className="w-10 px-4"></TableHead><TableHead className={cn("px-4 py-2 text-[9px] font-black uppercase", isRtl ? "text-right" : "text-left")}>REF #</TableHead><TableHead className="px-4 py-2 text-[9px] font-black uppercase text-center">DUE</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {unpaidReceipts.map(r => (
                          <TableRow key={r.id} onClick={(e) => toggleReceiptSelection(r.id, e as any)} className={cn("cursor-pointer transition-colors", formData.linkedReceipts.includes(r.id) && "bg-emerald-50/60 dark:bg-emerald-900/20")}>
                            <TableCell className="px-4"><Checkbox checked={formData.linkedReceipts.includes(r.id)} onCheckedChange={() => {}} /></TableCell>
                            <TableCell className={cn("px-4 py-2 text-xs font-black tabular-nums dark:text-slate-100", isRtl ? "text-right" : "text-left")}>{r.voucherNumber}</TableCell>
                            <TableCell className="px-4 py-2 text-center"><span className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{(Number(r.wageAmount) || 0).toLocaleString('en-US')}</span><span className="text-[9px] font-black text-slate-400 ms-1 uppercase">{r.currency}</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </div>
              ) : formData.workerId && <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase">{isRtl ? 'لا توجد مستحقات معلقة' : 'No pending dues'}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className={cn("md:col-span-2 space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400 block">TOTAL DISBURSEMENT (READ-ONLY)</Label>
                <div className="relative">
                  <Input type="number" value={formData.amount || ''} readOnly className="h-14 font-black text-2xl text-center tabular-nums bg-slate-100 dark:bg-slate-800 border-emerald-200 text-emerald-700 cursor-not-allowed" />
                  <div className={cn("absolute top-1/2 -translate-y-1/2", isRtl ? "left-4" : "right-4")}><div className="h-9 px-3 bg-white dark:bg-slate-900 border border-emerald-100 rounded-lg flex items-center justify-center text-xs font-black dark:text-slate-100">{formData.currency}</div></div>
                </div>
              </div>
              <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                <Label className="text-[10px] font-black uppercase text-slate-400 block">BATCH COUNT</Label>
                <div className="h-14 flex items-center justify-center bg-slate-900 dark:bg-slate-800 text-white rounded-lg font-black text-xl tabular-nums shadow-inner">{formData.linkedReceipts.length}</div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
              <Button type="submit" disabled={isSubmitting || formData.amount <= 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl border-none transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-4 me-2" />}
                {isRtl ? 'تأكيد ترحيل الصرف المالي' : 'Confirm Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => { if(!open) setDeletingVoucher(null); forceUIUnlock(); }}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900 transition-colors duration-300">
          <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCcw className="w-32 h-32 text-white" /></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner"><RefreshCcw className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'إلغاء سند الصرف' : 'Reverse Payment'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
              {isRtl ? 'سيتم إلغاء السند المالي وإعادة فتح استحقاق الأجور المرتبطة به في كشف العامل.' : 'This voucher will be canceled and liabilities restored.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeletePayment} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg transition-all active:scale-95">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : (isRtl ? 'تأكيد' : 'Confirm')}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isSubmitting} className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">{isRtl ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!printingVoucher} onOpenChange={(open) => { if (!open) { setPrintingVoucher(null); forceUIUnlock(); } }}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>سند صرف مالي</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white text-slate-900 relative z-0 light" id="printable-payment">
               {printingVoucher && (
                <VoucherTemplate 
                  voucher={printingVoucher}
                  worker={allWorkers?.find(w => w.id === printingVoucher.workerId)}
                  departments={allDepartments}
                  products={allProducts}
                  allReceipts={allReceipts}
                  allOrders={allOrders}
                  lang={lang}
                />
               )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row gap-3 justify-end">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all">
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} {isRtl ? 'تحميل كصورة PNG' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => { setPrintingVoucher(null); forceUIUnlock(); }} className="h-12 px-8 rounded-xl border border-slate-200 text-slate-500 font-black hover:bg-slate-100">{isRtl ? 'إغلاق' : 'Close'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Tabs>
  );
}
