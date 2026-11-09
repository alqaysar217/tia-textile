
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
import { useFirestore, useCollection } from '@/firebase';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toPng } from 'html-to-image';

export default function PayrollManagementPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'voucherNumber' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('balances');
  
  // Advanced filtering state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  // Payment Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    amount: 0,
    currency: 'YER',
    notes: '',
    linkedReceipts: [] as string[]
  });

  // Fetch Data
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);
  const paymentsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'wage_payment')), [db]);

  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allReceipts, loading: receiptsLoading } = useCollection<any>(receiptsQuery);
  const { data: allPayments, loading: paymentsLoading } = useCollection<any>(paymentsQuery);

  const loading = workersLoading || receiptsLoading || paymentsLoading;

  // Reset selection when worker or currency changes in FORM to prevent currency mixing
  useEffect(() => {
    if (!editingVoucherId) {
      setFormData(prev => ({
        ...prev,
        linkedReceipts: [],
        amount: 0
      }));
    }
  }, [formData.workerId, formData.currency, editingVoucherId]);

  // Filter unpaid receipts by selected worker AND selected currency for the FORM
  const unpaidReceipts = useMemo(() => {
    if (!formData.workerId || !allReceipts) return [];
    
    const activePayments = (allPayments || []).filter(p => p.status !== 'deleted');
    const activeReceipts = (allReceipts || []).filter(r => r.status !== 'deleted');

    const paidReceiptIds = new Set<string>();
    activePayments.forEach(p => {
      if (p.id === editingVoucherId) return;
      p.linkedReceipts?.forEach((id: string) => paidReceiptIds.add(id));
    });

    return activeReceipts.filter(r => 
      r.workerId === formData.workerId && 
      !paidReceiptIds.has(r.id) && 
      (r.currency || 'YER') === formData.currency
    );
  }, [formData.workerId, formData.currency, allReceipts, allPayments, editingVoucherId]);

  // Calculate flat balances per worker per currency for the LIST
  const flattenedBalances = useMemo(() => {
    if (!allWorkers || !allReceipts) return [];
    
    const activePayments = (allPayments || []).filter(p => p.status !== 'deleted');
    const activeReceipts = (allReceipts || []).filter(r => r.status !== 'deleted');

    const paidReceiptIds = new Set<string>();
    activePayments.forEach(p => {
      p.linkedReceipts?.forEach((id: string) => paidReceiptIds.add(id));
    });

    const list: any[] = [];

    allWorkers.filter(w => w.status !== 'deleted').forEach(worker => {
      const myUnpaid = activeReceipts.filter(r => r.workerId === worker.id && !paidReceiptIds.has(r.id));
      
      const balanceByCurrency: Record<string, number> = {};
      myUnpaid.forEach(r => {
        const curr = r.currency || 'YER';
        balanceByCurrency[curr] = (balanceByCurrency[curr] || 0) + (r.wageAmount || 0);
      });

      Object.entries(balanceByCurrency).forEach(([currency, amount]) => {
        if (amount > 0) {
          list.push({
            ...worker,
            displayCurrency: currency,
            displayAmount: amount
          });
        }
      });
    });

    return list;
  }, [allWorkers, allReceipts, allPayments]);

  const toggleReceiptSelection = useCallback((receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => {
      const isSelected = prev.linkedReceipts.includes(receiptId);
      const newSelection = isSelected 
        ? prev.linkedReceipts.filter(id => id !== receiptId) 
        : [...prev.linkedReceipts, receiptId];
      
      const selectedVouchers = allReceipts?.filter(r => newSelection.includes(r.id)) || [];
      const total = selectedVouchers.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
      
      return { 
        ...prev, 
        linkedReceipts: newSelection, 
        amount: total
      };
    });
  }, [allReceipts]);

  const resetDialog = useCallback(() => {
    setIsPayDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      workerId: '', 
      amount: 0, 
      currency: 'YER', 
      notes: '', 
      linkedReceipts: [] 
    });
  }, []);

  const handleEditVoucher = (p: any) => {
    setEditingVoucherId(p.id);
    setFormData({
      date: p.date,
      workerId: p.workerId,
      amount: p.totalAmount,
      currency: p.currency || 'YER',
      notes: p.notes || '',
      linkedReceipts: [...(p.linkedReceipts || [])]
    });
    setIsPayDialogOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || formData.amount <= 0 || formData.linkedReceipts.length === 0) {
       toast({ variant: "destructive", title: lang === 'ar' ? "بيانات ناقصة" : "Missing Data" });
       return;
    }
    setIsSubmitting(true);
    
    // ROOT CAUSE FIX: Capturing OrderID and StageID from the receipts being paid
    // This ensures the payment voucher shows up in the Batch Ledger
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
      if (editingVoucherId) {
        await updateDoc(doc(db, 'vouchers', editingVoucherId), paymentData);
        toast({ title: lang === 'ar' ? "تم تحديث السند بنجاح" : "Voucher Updated" });
      } else {
        const voucherNumber = `PAY-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, 'vouchers'), { ...paymentData, voucherNumber, createdAt: serverTimestamp() });
        toast({ title: lang === 'ar' ? "تم تسجيل سند الصرف بنجاح" : "Payment Voucher Recorded" });
      }
      resetDialog();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!db || !deletingVoucher || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'vouchers', deletingVoucher.id), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم إلغاء السند وإرجاع المستحقات" : "Voucher reversed successfully" });
    } finally {
      setIsSubmitting(false);
      setDeletingVoucher(null);
    }
  };

  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];
    let result = allPayments.filter(p => p.status !== 'deleted');
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => {
        const worker = allWorkers?.find(w => w.id === p.workerId);
        return p.voucherNumber?.toLowerCase().includes(s) || worker?.fullName?.toLowerCase().includes(s);
      });
    }

    if (workerFilter !== 'all') result = result.filter(p => p.workerId === workerFilter);
    if (currencyFilter !== 'all') result = result.filter(p => p.currency === currencyFilter);
    if (dateFrom) result = result.filter(p => p.date >= dateFrom);
    if (dateTo) result = result.filter(p => p.date <= dateTo);

    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === 'totalAmount') {
        return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [allPayments, allWorkers, search, sortBy, sortOrder, workerFilter, currencyFilter, dateFrom, dateTo]);

  const handleDownloadImage = useCallback(async () => {
    const element = document.getElementById('printable-payment');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff', 
        pixelRatio: 2, 
        cacheBust: true,
        fontEmbedCSS: '', // Fixes font trim error
      });
      const link = document.createElement('a');
      link.download = `Payment-${printingVoucher.voucherNumber}.png`;
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
  }, [printingVoucher, lang]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Voucher No', 'Date', 'Worker', 'Amount Paid', 'Currency'];
    const rows = filteredPayments.map(p => {
      const worker = allWorkers?.find(w => w.id === p.workerId);
      return [p.voucherNumber, p.date, worker?.fullName || '---', p.totalAmount || 0, p.currency || 'YER'];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredPayments, allWorkers]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><HandCoins className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المالية' : 'Accounting'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'صرف الأجور' : 'Wage Payments'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'إدارة ذمم ومدفوعات العمال' : 'Personnel Payroll Management'}</h1>
            </div>
          </div>
          <Button onClick={() => setIsPayDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
            <Plus className="w-4 h-4" /> {lang === 'ar' ? 'سند صرف أجر جديد' : 'New Payment'}
          </Button>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="relative flex-1 w-full">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث سريع...' : 'Quick search...'} className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 bg-white border-slate-200 text-xs font-bold`} />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 h-10">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold tabular-nums" />
                <span className="text-[10px] font-black text-slate-300">→</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold tabular-nums" />
             </div>
             <div className="flex items-center gap-1.5 px-1.5 border-r border-slate-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent"><Filter className="w-4 h-4" /> {lang === 'ar' ? 'تصفية' : 'Filter'}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 shadow-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PERSONNEL</DropdownMenuLabel>
                    <ScrollArea className="h-40">
                       <DropdownMenuItem onClick={() => setWorkerFilter('all')} className="text-xs font-bold cursor-pointer">{lang === 'ar' ? 'الكل' : 'All'}</DropdownMenuItem>
                       {allWorkers?.filter(w => w.status !== 'deleted').map(w => (
                         <DropdownMenuItem key={w.id} onClick={() => setWorkerFilter(w.id)} className="text-xs font-bold cursor-pointer">{w.fullName}</DropdownMenuItem>
                       ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleExportCSV} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent"><FileDown className="w-4 h-4 text-emerald-600" /> {lang === 'ar' ? 'تصدير' : 'Export'}</Button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 no-scrollbar">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir} className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <TabsList className="grid grid-cols-2 w-[360px] h-9">
              <TabsTrigger value="balances" className="font-black text-xs"><Users2 className="w-3.5 h-3.5 me-2" />{lang === 'ar' ? 'الأرصدة المستحقة للعمال' : 'Outstanding Balances'}</TabsTrigger>
              <TabsTrigger value="vouchers" className="font-black text-xs"><Receipt className="w-3.5 h-3.5 me-2" />{lang === 'ar' ? 'أرشيف سندات الصرف' : 'Payment Archive'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="balances" className="flex-1 min-h-0 focus-visible:ring-0">
             <div className="h-full flex flex-col space-y-4">
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <Table className="text-right border-separate border-spacing-0">
                      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">PERSONNEL</TableHead>
                          <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">UNIT</TableHead>
                          <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">DUE BALANCE</TableHead>
                          <TableHead className="w-40 px-6 py-4 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flattenedBalances.map((w, idx) => (
                          <TableRow key={`${w.id}-${w.displayCurrency}-${idx}`} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                            <TableCell className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm shrink-0 rounded-xl">
                                  <AvatarImage src={w.photoUrl} className="object-cover" />
                                  <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-black uppercase">{w.fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col text-right">
                                  <span className="font-black text-slate-900 text-xs">{w.fullName}</span>
                                  <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-widest uppercase">{w.workerId}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-3 font-bold text-slate-600 text-xs">{allDepartments?.find(d => d.id === w.departmentId)?.nameAr || '---'}</TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 tabular-nums font-black border-rose-100 py-1.5 px-3">
                                {(w.displayAmount).toLocaleString('en-US')} <span className="ms-1 text-[9px] opacity-60 uppercase">{w.displayCurrency}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <Button onClick={() => { setFormData(prev => ({...prev, workerId: w.id, currency: w.displayCurrency})); setIsPayDialogOpen(true); }} variant="outline" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all gap-2 shadow-sm">
                                <Wallet className="w-3.5 h-3.5" />{lang === 'ar' ? 'صرف الآن' : 'Disburse'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
             </div>
          </TabsContent>
          
          <TabsContent value="vouchers" className="flex-1 min-h-0 focus-visible:ring-0">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                   <Table className="text-right border-separate border-spacing-0">
                      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                         <TableRow>
                           <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">
                              <button onClick={() => toggleSort('voucherNumber')} className="flex items-center gap-2 hover:text-emerald-700 transition-colors uppercase">REF #{sortBy === 'voucherNumber' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</button>
                           </TableHead>
                           <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">
                              <button onClick={() => toggleSort('date')} className="flex items-center gap-2 hover:text-emerald-700 transition-colors uppercase">DATE {sortBy === 'date' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</button>
                           </TableHead>
                           <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-right">WORKER</TableHead>
                           <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">PAID AMOUNT</TableHead>
                           <TableHead className="w-24 px-6 py-4 text-center">ACTIONS</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredPayments.map(p => (
                           <TableRow key={p.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                              <TableCell className="px-6 py-3 font-black text-slate-900 text-xs tabular-nums text-right">{p.voucherNumber}</TableCell>
                              <TableCell className="px-6 py-3 font-bold text-slate-500 text-xs tabular-nums text-right">{p.date}</TableCell>
                              <TableCell className="px-6 py-3 font-bold text-slate-700 text-xs text-right">{allWorkers?.find(w => w.id === p.workerId)?.fullName || '---'}</TableCell>
                              <TableCell className="px-6 py-3 text-center">
                                 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 tabular-nums font-black border-emerald-100 py-1 px-3">
                                   {(p.totalAmount || 0).toLocaleString('en-US')} <span className="ms-1 uppercase opacity-60">{p.currency}</span>
                                 </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-3 text-center">
                                 <div className="flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(p)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-all rounded-lg"><Eye className="w-4 h-4" /></Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                                        <DropdownMenuItem onClick={() => handleEditVoucher(p)} className="gap-2 font-bold py-2 cursor-pointer text-xs"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل السند' : 'Edit Voucher'}</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setDeletingVoucher(p)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer text-xs"><Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إلغاء السند' : 'Reverse Voucher'}</DropdownMenuItem>
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
        </Tabs>
      </div>

      <Dialog open={isPayDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[800px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white"><Wallet className="w-5 h-5 text-emerald-300" />{editingVoucherId ? (lang === 'ar' ? 'تعديل سند الصرف' : 'Edit Payment') : (lang === 'ar' ? 'صرف مستحقات العمال' : 'Personnel Wage Payment')}</DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] mt-1">Settlement of production receipts and cash release</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSavePayment} className="p-6 space-y-5 bg-white max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 block">{lang === 'ar' ? 'الموظف' : 'WORKER'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData(prev => ({...prev, workerId: e.target.value}))} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold" required>
                   <option value="">-- اختر الموظف --</option>
                   {allWorkers?.filter(w => w.status !== 'deleted' && w.active).map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 block">DATE</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))} className="h-11 font-bold bg-slate-50 tabular-nums text-right" required />
              </div>
            </div>
            <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 justify-start"><Coins className="w-3.5 h-3.5 text-emerald-600" /> CURRENCY</Label>
                <select value={formData.currency} onChange={(e) => setFormData(prev => ({...prev, currency: e.target.value}))} className="h-9 px-3 bg-white border border-emerald-200 rounded-lg text-[10px] font-black shadow-sm outline-none">
                  <option value="YER">YER - ريال يمني</option><option value="SAR">SAR - ريال سعودي</option><option value="USD">USD - دولار أمريكي</option>
                </select>
              </div>
              {formData.workerId && unpaidReceipts.length > 0 && (
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                   <Table className="text-right">
                      <TableHeader className="bg-slate-50"><TableRow><TableHead className="w-10 px-4"></TableHead><TableHead className="px-4 py-2 text-[9px] font-black uppercase">REF #</TableHead><TableHead className="px-4 py-2 text-[9px] font-black uppercase text-center">DUE</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {unpaidReceipts.map(r => (
                          <TableRow key={r.id} className={cn("bg-white border-b border-slate-50", formData.linkedReceipts.includes(r.id) && "bg-emerald-50/40")}>
                            <TableCell className="px-4"><Checkbox checked={formData.linkedReceipts.includes(r.id)} onClick={(e) => toggleReceiptSelection(r.id, e as any)} /></TableCell>
                            <TableCell className="px-4 py-2 text-xs font-black tabular-nums">{r.voucherNumber}</TableCell>
                            <TableCell className="px-4 py-2 text-center"><span className="text-sm font-black text-emerald-700 tabular-nums">{(r.wageAmount || 0).toLocaleString('en-US')}</span><span className="text-[9px] font-black text-slate-400 ms-1 uppercase">{r.currency}</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2 space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 block">TOTAL DISBURSEMENT</Label>
                <div className="relative">
                  <Input type="number" step="any" value={formData.amount || ''} onChange={(e) => setFormData(prev => ({...prev, amount: Number(e.target.value)}))} className="h-14 font-black text-2xl text-center tabular-nums bg-emerald-50 border-emerald-200 text-emerald-700" required />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"><div className="h-9 px-3 bg-white border border-emerald-100 rounded-lg flex items-center justify-center text-xs font-black">{formData.currency}</div></div>
                </div>
              </div>
              <div className="space-y-1.5 text-right"><Label className="text-[10px] font-black uppercase text-slate-400 block">BATCH COUNT</Label><div className="h-14 flex items-center justify-center bg-slate-900 text-white rounded-xl font-black text-xl tabular-nums">{formData.linkedReceipts.length}</div></div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.amount <= 0 || formData.linkedReceipts.length === 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
                {lang === 'ar' ? (editingVoucherId ? 'حفظ التعديلات' : 'تأكيد الترحيل المالي') : 'Confirm & Post Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>سند صرف مالي</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-10 bg-white" id="printable-payment">
               {printingVoucher && (
                 <div className="flex flex-col text-slate-900 font-sans relative" dir="rtl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none"><img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" /></div>
                    <div className="grid grid-cols-3 items-center border-b-4 border-emerald-800 pb-6 mb-6 relative z-10">
                      <div className="text-center space-y-0.5"><h2 className="text-base font-black text-emerald-900">جمعية الصناعات النسيجية</h2><p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p></div>
                      <div className="flex justify-center"><img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" /></div>
                      <div className="text-center space-y-0.5" dir="ltr"><h2 className="text-[11px] font-black text-emerald-900 uppercase">TIA Cooperative</h2><p className="text-[10px] font-bold text-slate-500">Al-Rawdah - Shabwa</p></div>
                    </div>
                    <div className="text-center mb-8 relative z-10"><div className="inline-block border-2 border-emerald-800 px-10 py-1.5 rounded-full bg-white shadow-sm"><h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">{lang === 'ar' ? 'سند صرف أجور مالي' : 'Wage Payment Voucher'}</h3></div></div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 relative z-10">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'يصرف للأخ' : 'Recipient'}</span><span className="text-sm font-black text-slate-900">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span></div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'رقم السند' : 'Payment ID'}</span><span className="text-sm font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</span></div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'تاريخ الصرف' : 'Date'}</span><span className="text-sm font-black text-slate-700 tabular-nums">{printingVoucher.date}</span></div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'العملة' : 'Currency'}</span><span className="text-sm font-black text-slate-700 uppercase">{printingVoucher.currency}</span></div>
                    </div>
                    <div className="mb-8 relative z-10">
                      <Table className="text-right border-2 border-emerald-900/10">
                        <TableHeader className="bg-emerald-900/5"><TableRow><TableHead className="text-right font-black text-xs py-3 text-emerald-900">{lang === 'ar' ? 'رقم سند الاستلام' : 'Receipt #'}</TableHead><TableHead className="text-right font-black text-xs py-3 text-emerald-900">{lang === 'ar' ? 'المنتج' : 'Product'}</TableHead><TableHead className="text-center font-black text-xs py-3 text-emerald-900">Qty</TableHead><TableHead className="text-center font-black text-xs py-3 text-emerald-900">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {printingVoucher.linkedReceipts?.map((receiptId: string, i: number) => {
                             const receipt = allReceipts?.find(r => r.id === receiptId);
                             const order = allOrders?.find(o => o.id === receipt?.orderId);
                             const product = allProducts?.find(p => p.id === order?.productId);
                             return (
                               <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                                 <TableCell className="font-bold text-xs tabular-nums">{receipt?.voucherNumber}</TableCell>
                                 <TableCell className="font-bold text-xs">{product?.nameAr || '---'}</TableCell>
                                 <TableCell className="text-center font-black text-xs">{receipt?.qtyAccepted || 0}</TableCell>
                                 <TableCell className="text-center font-black text-xs text-emerald-700">{(receipt?.wageAmount || 0).toLocaleString('en-US')}</TableCell>
                               </TableRow>
                             );
                          })}
                          <TableRow className="bg-emerald-50/50"><TableCell colSpan={3} className="text-left font-black text-sm text-emerald-900 px-6 py-4 uppercase">GRAND TOTAL</TableCell><TableCell className="text-center font-black text-lg text-emerald-700 tabular-nums">{(printingVoucher.totalAmount || 0).toLocaleString('en-US')}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-200 text-center relative z-10">
                       <div className="space-y-12"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient Sign</p><div className="h-px bg-slate-300 w-full" /></div>
                       <div className="space-y-12"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashier</p><div className="h-px bg-slate-300 w-full" /></div>
                       <div className="space-y-12"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Approval</p><div className="h-px bg-slate-300 w-full" /></div>
                    </div>
                 </div>
               )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black h-12 px-8 rounded-xl shadow-lg gap-2">
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Download className="w-5 h-5" />}
                {lang === 'ar' ? 'تحميل كصورة' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="h-12 px-6 rounded-xl border border-slate-200 font-black">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner"><RefreshCcw className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'إلغاء سند الصرف' : 'Reverse Payment'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs">This voucher will be canceled and liabilities restored.</AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={handleDeletePayment} disabled={isSubmitting} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}</AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
