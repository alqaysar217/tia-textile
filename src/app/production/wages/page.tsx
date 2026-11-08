
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  TrendingUp,
  ArrowUpRight,
  HandCoins,
  Receipt,
  AlertCircle,
  Info,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
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
  TabsContent,
  TabsList,
  TabsTrigger,
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
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'voucherNumber' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('balances');

  // Payment Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    amount: 0,
    currency: 'YER',
    notes: '',
    linkedReceipts: [] as string[]
  });

  // Fetch Data - Simplified queries to avoid Index errors
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);
  const paymentsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'wage_payment')), [db]);

  const { data: allWorkers, loading: workersLoading } = useCollection<any>(workersQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allReceipts, loading: receiptsLoading } = useCollection<any>(receiptsQuery);
  const { data: allPayments, loading: paymentsLoading } = useCollection<any>(paymentsQuery);

  const loading = workersLoading || receiptsLoading || paymentsLoading;

  // LOGIC: Filter unpaid receipts
  const unpaidReceipts = useMemo(() => {
    if (!formData.workerId || !allReceipts) return [];
    
    const activePayments = (allPayments || []).filter(p => p.status !== 'deleted');
    const activeReceipts = (allReceipts || []).filter(r => r.status !== 'deleted');

    const paidReceiptIds = new Set<string>();
    activePayments.forEach(p => {
      p.linkedReceipts?.forEach((id: string) => paidReceiptIds.add(id));
    });

    return activeReceipts.filter(r => r.workerId === formData.workerId && !paidReceiptIds.has(r.id));
  }, [formData.workerId, allReceipts, allPayments]);

  // LOGIC: Calculate flat balances per worker per currency
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

      // Split each currency into its own row for clarity
      Object.entries(balanceByCurrency).forEach(([currency, amount]) => {
        list.push({
          ...worker,
          displayCurrency: currency,
          displayAmount: amount
        });
      });
    });

    return list;
  }, [allWorkers, allReceipts, allPayments]);

  const toggleReceiptSelection = (receiptId: string) => {
    const isSelected = formData.linkedReceipts.includes(receiptId);
    let newSelection = isSelected ? formData.linkedReceipts.filter(id => id !== receiptId) : [...formData.linkedReceipts, receiptId];
    const selectedVouchers = allReceipts?.filter(r => newSelection.includes(r.id)) || [];
    const total = selectedVouchers.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
    const primaryCurrency = selectedVouchers[0]?.currency || 'YER';
    setFormData({ ...formData, linkedReceipts: newSelection, amount: total, currency: primaryCurrency });
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || formData.amount <= 0 || formData.linkedReceipts.length === 0) {
       toast({ variant: "destructive", title: lang === 'ar' ? "بيانات ناقصة" : "Missing Data" });
       return;
    }
    setIsSubmitting(true);
    const voucherNumber = `PAY-${Date.now().toString().slice(-6)}`;
    const paymentData = { 
      ...formData, 
      voucherNumber, 
      type: 'wage_payment', 
      totalAmount: Number(formData.amount), 
      status: 'posted', 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };
    try {
      await addDoc(collection(db, 'vouchers'), paymentData);
      toast({ title: lang === 'ar' ? "تم تسجيل سند الصرف بنجاح" : "Payment Voucher Recorded" });
      resetDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setIsPayDialogOpen(false);
    setFormData({ date: new Date().toISOString().split('T')[0], workerId: '', amount: 0, currency: 'YER', notes: '', linkedReceipts: [] });
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
    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [allPayments, allWorkers, search, sortBy, sortOrder]);

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-payment');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `Payment-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      lang === 'ar' ? 'رقم السند' : 'Voucher No',
      lang === 'ar' ? 'التاريخ' : 'Date',
      lang === 'ar' ? 'الموظف' : 'Worker',
      lang === 'ar' ? 'المبلغ المصروف' : 'Amount Paid',
      lang === 'ar' ? 'العملة' : 'Currency'
    ];

    const rows = filteredPayments.map(p => {
      const worker = allWorkers?.find(w => w.id === p.workerId);
      return [
        p.voucherNumber,
        p.date,
        worker?.fullName || '---',
        (p.totalAmount || 0).toLocaleString('en-US'),
        p.currency || 'YER'
      ];
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
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><HandCoins className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'السندات المالية' : 'Financial Vouchers'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'صرف الأجور' : 'Wage Disbursements'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'إدارة مدفوعات العمال' : 'Personnel Payments'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsPayDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {lang === 'ar' ? 'سند صرف أجر جديد' : 'New Payment'}
            </Button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={lang === 'ar' ? 'بحث باسم الموظف أو رقم السند...' : 'Search...'} 
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white border-slate-200 text-xs font-bold tabular-nums`} 
            />
          </div>
          <div className="flex items-center gap-1.5 px-1.5 border-l border-slate-200">
             <Button onClick={handleExportCSV} variant="ghost" className="h-9 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"><FileDown className="w-4 h-4 text-emerald-600" /> {lang === 'ar' ? 'تصدير' : 'Export'}</Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA - SWITCHABLE TABS */}
      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 no-scrollbar">
        <Tabs defaultValue="balances" dir={dir} className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <TabsList className="grid grid-cols-2 w-[400px] h-10">
              <TabsTrigger value="balances" className="font-black text-xs h-8">
                <Users2 className="w-3.5 h-3.5 me-2" />
                {lang === 'ar' ? 'الأرصدة المستحقة للعمال' : 'Outstanding Balances'}
              </TabsTrigger>
              <TabsTrigger value="vouchers" className="font-black text-xs h-8">
                <Receipt className="w-3.5 h-3.5 me-2" />
                {lang === 'ar' ? 'أرشيف سندات الصرف' : 'Payment Archive'}
              </TabsTrigger>
            </TabsList>

            <div className="px-4 hidden md:flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {lang === 'ar' ? 'إجمالي الدفعات:' : 'Total Payments:'} <span className="text-slate-900 tabular-nums">{(filteredPayments.length).toLocaleString('en-US')}</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                {lang === 'ar' ? 'حسابات نشطة:' : 'Active Accounts:'} <span className="text-slate-900 tabular-nums">{(flattenedBalances.length).toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>

          <TabsContent value="balances" className="flex-1 min-h-0 focus-visible:ring-0">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
                   <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'جاري سحب الأرصدة المستحقة...' : 'Calculating Outstanding Balances...'}</p>
                </div>
             ) : (
               <div className="h-full flex flex-col space-y-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3">
                   <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                   <p className="text-xs font-bold text-emerald-800 leading-tight flex-1">
                      {lang === 'ar' 
                        ? 'تظهر الأرصدة هنا آلياً بناءً على "سندات استلام الإنتاج" التي تم ترحيلها ولم تُدفع بعد. بمجرد ترحيل سند صرف، يتم تسوية الرصيد.' 
                        : 'Balances are generated from posted Production Receipts. Posting a payment voucher clears the balance.'}
                   </p>
                </div>

                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <Table className="border-separate border-spacing-0">
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                          <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'القسم' : 'DEPT'}</TableHead>
                          <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'الرصيد المستحق' : 'BALANCE DUE'}</TableHead>
                          <TableHead className="w-40 px-6 py-4 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flattenedBalances.map((w, idx) => {
                          const dept = allDepartments?.find(d => d.id === w.departmentId);
                          return (
                            <TableRow key={`${w.id}-${w.displayCurrency}-${idx}`} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                              <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                                    <AvatarImage src={w.photoUrl} className="object-cover" />
                                    <AvatarFallback className="bg-slate-50 text-slate-400 text-[10px] font-black">{w.fullName?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-900 text-xs">{w.fullName}</span>
                                    <span className="text-[10px] text-emerald-700 font-bold tabular-nums tracking-widest uppercase">{w.workerId}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                                <span className="font-bold text-slate-600 text-xs">{dept ? (lang === 'ar' ? dept.nameAr : dept.nameEn) : '---'}</span>
                              </TableCell>
                              <TableCell className="px-6 py-3 text-center">
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 tabular-nums font-black border-rose-100 py-1">
                                  {(w.displayAmount).toLocaleString('en-US')} <span className="ms-1 text-[9px] opacity-60 uppercase">{w.displayCurrency}</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-3 text-center">
                                <Button 
                                  onClick={() => { setFormData({...formData, workerId: w.id, currency: w.displayCurrency}); setIsPayDialogOpen(true); }}
                                  variant="outline" 
                                  className="h-9 px-4 rounded-xl text-[10px] font-black uppercase text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all gap-2"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  {lang === 'ar' ? 'صرف الآن' : 'Settle'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {flattenedBalances.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-24">
                              <div className="flex flex-col items-center justify-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-3"><CheckCircle2 className="w-8 h-8 text-slate-200" /></div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'لا توجد مستحقات معلقة' : 'All accounts are cleared'}</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
               </div>
             )}
          </TabsContent>
          
          <TabsContent value="vouchers" className="flex-1 min-h-0 focus-visible:ring-0">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                   <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                         <TableRow>
                           <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                           <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                           <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                           <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'المبلغ المصروف' : 'AMOUNT PAID'}</TableHead>
                           <TableHead className="w-20"></TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {loading ? (
                           <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300 animate-pulse">جاري سحب الأرشيف...</TableCell></TableRow>
                         ) : filteredPayments.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-32 text-slate-300 font-black uppercase">{lang === 'ar' ? 'الأرشيف فارغ' : 'Archive is empty'}</TableCell></TableRow>
                         ) : filteredPayments.map(p => (
                           <TableRow key={p.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                              <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{p.voucherNumber}</TableCell>
                              <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{p.date}</TableCell>
                              <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === p.workerId)?.fullName || '---'}</TableCell>
                              <TableCell className="px-6 py-3 text-center">
                                 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 tabular-nums font-black border-emerald-100">
                                   {(p.totalAmount || 0).toLocaleString('en-US')} {p.currency}
                                 </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-3">
                                 <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(p)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
                                    <Eye className="w-4 h-4" />
                                 </Button>
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

      {/* NEW PAYMENT DIALOG */}
      <Dialog open={isPayDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[800px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Wallet className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'صرف أجور واستحقاقات عمال' : 'Disburse Personnel Wages'}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Multi-voucher settlement and cash movement</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSavePayment} className="p-6 space-y-5 bg-white max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Users2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'اختر الموظف' : 'WORKER'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, amount: 0, linkedReceipts: []})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                   <option value="">-- اختر الموظف --</option>
                   {allWorkers?.filter(w => w.status !== 'deleted' && w.active).map(w => (
                     <option key={w.id} value={w.id}>{w.fullName}</option>
                   ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ الصرف' : 'DATE'}</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
            </div>

            {formData.workerId && unpaidReceipts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'سندات استحقاق غير مدفوعة (اختر للسداد)' : 'UNPAID ENTITLEMENTS (SELECT TO PAY)'}
                </h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                   <Table className="text-right">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-10 px-4"></TableHead>
                          <TableHead className={cn("px-4 py-2 text-[10px] font-black text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'رقم سند الاستلام' : 'REF #'}</TableHead>
                          <TableHead className={cn("px-4 py-2 text-[10px] font-black text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                          <TableHead className="px-4 py-2 text-center text-[10px] font-black text-slate-500 uppercase">{lang === 'ar' ? 'المبلغ المستحق' : 'DUE'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unpaidReceipts.map(r => (
                          <TableRow key={r.id} className="hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => toggleReceiptSelection(r.id)}>
                            <TableCell className="px-4">
                               <Checkbox checked={formData.linkedReceipts.includes(r.id)} onCheckedChange={() => toggleReceiptSelection(r.id)} />
                            </TableCell>
                            <TableCell className={cn("px-4 py-2 text-xs font-black text-slate-700 tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{r.voucherNumber}</TableCell>
                            <TableCell className={cn("px-4 py-2 text-xs font-bold text-slate-400 tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{r.date}</TableCell>
                            <TableCell className="px-4 py-2 text-center">
                               <span className="text-sm font-black text-emerald-700 tabular-nums">{(r.wageAmount || 0).toLocaleString('en-US')}</span>
                               <span className="text-[9px] font-black text-slate-400 ms-1 uppercase">{r.currency}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </div>
              </div>
            )}

            {formData.workerId && unpaidReceipts.length === 0 && (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                 <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-2" />
                 <p className="text-sm font-bold text-slate-400">{lang === 'ar' ? 'لا يوجد مستحقات معلقة لهذا العامل' : 'No outstanding entitlements for this person'}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'المبلغ المراد صرفه الآن' : 'TOTAL PAYMENT AMOUNT'}</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="any"
                    value={formData.amount || ''} 
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                    className="h-14 font-black text-2xl text-center tabular-nums bg-emerald-50 border-emerald-200 text-emerald-700 focus:bg-white" 
                    required 
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 rtl:left-auto rtl:right-4">
                     <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="h-9 px-3 bg-white border border-emerald-100 rounded-lg text-xs font-black shadow-sm outline-none">
                        <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                     </select>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'عدد السندات المسواة' : 'VOUCHERS SETTLED'}</Label>
                <div className="h-14 flex items-center justify-center bg-slate-900 text-white rounded-xl font-black text-xl tabular-nums">
                   {formData.linkedReceipts.length}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات الصرف (البيان)' : 'DISBURSEMENT MEMO'}</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder={lang === 'ar' ? 'سداد حساب عينة العيد، دفعة تصفية...' : 'e.g. Settlement for Eid Batch...'} className="h-12 bg-slate-50 text-xs font-bold" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.amount <= 0 || formData.linkedReceipts.length === 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
                {lang === 'ar' ? 'ترحيل سند الصرف المالي' : 'Confirm & Post Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl border-slate-200">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT PREVIEW */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only"><DialogTitle>سند صرف أجور</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[75vh]">
            <div className="p-10 bg-white" id="printable-payment">
               {printingVoucher && (
                 <div className="flex flex-col text-slate-900 font-sans relative" dir="rtl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10"><img src="/images/logo.png" alt="w" className="w-full h-full object-contain grayscale" /></div>
                    
                    <div className="grid grid-cols-3 items-center border-b-4 border-emerald-800 pb-6 mb-8">
                       <div className="text-center space-y-0.5"><h2 className="text-base font-black text-emerald-900">جمعية الصناعات النسيجية</h2><p className="text-[10px] font-bold text-slate-500">الروضة - محافظة شبوة</p></div>
                       <div className="flex justify-center"><img src="/images/logo.png" alt="L" className="w-16 h-16 object-contain" /></div>
                       <div className="text-center space-y-0.5" dir="ltr"><h2 className="text-[10px] font-black text-emerald-900 uppercase">Textile Association</h2><p className="text-[9px] font-bold text-slate-500">Shabwa - Yemen</p></div>
                    </div>

                    <div className="text-center mb-10"><h3 className="text-xl font-black text-emerald-900 border-2 border-emerald-800 inline-block px-10 py-1.5 rounded-full bg-white shadow-sm uppercase tracking-widest">{lang === 'ar' ? 'سند صرف أجور' : 'Wage Payment Voucher'}</h3></div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6 mb-10">
                       <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                          <div className="border-b border-slate-200 pb-1 flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">رقم السند</span><span className="text-xs font-black tabular-nums">{printingVoucher.voucherNumber}</span></div>
                          <div className="border-b border-slate-200 pb-1 flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">التاريخ</span><span className="text-xs font-black tabular-nums">{printingVoucher.date}</span></div>
                          <div className="border-b border-slate-200 pb-1 flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">يصرف للأخ</span><span className="text-xs font-black">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span></div>
                          <div className="border-b border-slate-200 pb-1 flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">المبلغ</span><span className="text-base font-black text-emerald-800 tabular-nums">{(printingVoucher.totalAmount || 0).toLocaleString('en-US')} {printingVoucher.currency}</span></div>
                       </div>
                       <div className="pt-2"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">البيان / ملاحظات السداد</p><p className="text-xs font-bold text-slate-600 bg-white p-3 rounded-lg border border-slate-100">{printingVoucher.notes || '---'}</p></div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-200 text-center">
                       <div className="space-y-10"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">توقيع المستلم</p><div className="h-px bg-slate-300 w-full" /></div>
                       <div className="space-y-10"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أمين الصندوق</p><div className="h-px bg-slate-300 w-full" /></div>
                       <div className="space-y-10"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اعتماد المدير</p><div className="h-px bg-slate-300 w-full" /></div>
                    </div>
                    <div className="mt-16 text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">Generated by TIA Production System - {new Date().toLocaleString('en-US')}</div>
                 </div>
               )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black h-12 px-8 rounded-xl shadow-lg gap-2">
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Download className="w-5 h-5" />}
                {lang === 'ar' ? 'تحميل السند كصورة' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="h-12 px-6 rounded-xl border border-slate-200 font-black">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FOOTER PROTOCOL */}
      <div className="flex-none p-2.5 bg-slate-900 text-white/40 flex items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-bold tracking-tight">
          {lang === 'ar' 
            ? 'بروتوكول مالي: يتم إغلاق ذمم سندات الاستلام آلياً بمجرد ربطها بسند صرف مالي مصدق.' 
            : 'Fiscal Protocol: Receipt liabilities are automatically settled when linked to a validated disbursement voucher.'}
        </p>
      </div>

    </div>
  );
}
