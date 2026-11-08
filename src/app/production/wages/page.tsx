
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
  Printer,
  Edit2,
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
  AlertCircle
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
  const [workerFilter, setWorkerFilter] = useState<string>('all');

  // Payment Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workerId: '',
    amount: 0,
    currency: 'YER',
    notes: '',
    linkedReceipts: [] as string[] // IDs of production_receipt vouchers being paid
  });

  // Fetch Data
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt'), where('status', '==', 'posted')), [db]);
  const paymentsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'wage_payment')), [db]);

  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allReceipts } = useCollection<any>(receiptsQuery);
  const { data: allPayments, loading: paymentsLoading } = useCollection<any>(paymentsQuery);

  // Calculate worker balances (Accrued - Paid)
  const workerBalances = useMemo(() => {
    if (!allWorkers || !allReceipts || !allPayments) return [];
    
    return allWorkers.filter(w => w.status !== 'deleted').map(worker => {
      const earned = allReceipts
        .filter(r => r.workerId === worker.id && r.status !== 'deleted')
        .reduce((sum, r) => sum + (r.wageAmount || 0), 0);
      
      const paid = allPayments
        .filter(p => p.workerId === worker.id && p.status !== 'deleted')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      
      return {
        ...worker,
        totalEarned: earned,
        totalPaid: paid,
        balance: earned - paid
      };
    }).filter(w => w.totalEarned > 0 || w.totalPaid > 0);
  }, [allWorkers, allReceipts, allPayments]);

  const unpaidReceipts = useMemo(() => {
    if (!formData.workerId || !allReceipts || !allPayments) return [];
    
    // Find receipts that aren't fully covered by payments yet
    // For simplicity in this MVP, we show all 'posted' receipts for that worker
    return allReceipts.filter(r => r.workerId === formData.workerId && r.status === 'posted');
  }, [formData.workerId, allReceipts]);

  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];
    let result = allPayments.filter(p => p.status !== 'deleted');
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => {
        const worker = allWorkers?.find(w => w.id === p.workerId);
        return p.voucherNumber?.toLowerCase().includes(s) || 
               worker?.fullName?.toLowerCase().includes(s);
      });
    }

    if (workerFilter !== 'all') {
      result = result.filter(p => p.workerId === workerFilter);
    }

    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      if (sortBy === 'totalAmount') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [allPayments, allWorkers, search, workerFilter, sortBy, sortOrder]);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.workerId || formData.amount <= 0) return;

    const workerAcc = workerBalances.find(w => w.id === formData.workerId);
    if (workerAcc && formData.amount > workerAcc.balance) {
      toast({ variant: "destructive", title: lang === 'ar' ? "تجاوز الرصيد" : "Balance Exceeded", description: lang === 'ar' ? "لا يمكن صرف مبلغ أكبر من مستحقات العامل" : "Cannot pay more than the outstanding balance" });
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
      toast({ title: lang === 'ar' ? "تم تسجيل سند الصرف" : "Payment Voucher Recorded" });
      resetDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setIsPayDialogOpen(false);
    setFormData({ date: new Date().toISOString().split('T')[0], workerId: '', amount: 0, currency: 'YER', notes: '', linkedReceipts: [] });
  };

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

  const stats = useMemo(() => {
    const totalPending = workerBalances.reduce((sum, w) => sum + w.balance, 0);
    const totalPaidThisMonth = allPayments?.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0;
    
    return {
      pending: totalPending,
      paidMonth: totalPaidThisMonth,
      workersCount: workerBalances.filter(w => w.balance > 0).length
    };
  }, [workerBalances, allPayments]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><HandCoins className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المالية' : 'Finance'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'الأجور والرواتب' : 'Payroll'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'إدارة مستحقات وصرف أجور العمال' : 'Personnel Wage Management'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'إجمالي المستحق' : 'TOTAL DUE'}</p>
                <p className="text-sm font-black text-rose-600 tabular-nums">{stats.pending.toLocaleString('en-US')} YER</p>
              </div>
              <div className="w-px h-6 bg-slate-200 self-center" />
              <div className="px-3 py-1 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'صرف الشهر' : 'PAID MONTH'}</p>
                <p className="text-sm font-black text-emerald-600 tabular-nums">{stats.paidMonth.toLocaleString('en-US')} YER</p>
              </div>
            </div>
            
            <Button onClick={() => setIsPayDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {lang === 'ar' ? 'سند صرف أجر' : 'Issue Payment'}
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
              placeholder={lang === 'ar' ? 'بحث برقم السند أو اسم الموظف...' : 'Search records...'} 
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-9 bg-white border-slate-200 text-xs font-bold`} 
            />
          </div>
          <div className="flex items-center gap-1.5 px-1.5">
             <Button onClick={() => {}} variant="ghost" className="h-9 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"><FileDown className="w-4 h-4 text-emerald-600" /> {lang === 'ar' ? 'تصدير' : 'Export'}</Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-9 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"><Filter className="w-4 h-4" /> {lang === 'ar' ? 'تصفية' : 'Filter'}</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl">
                   <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ترتيب حسب</DropdownMenuLabel>
                   <DropdownMenuItem onClick={() => setSortBy('date')} className="flex items-center justify-between text-xs font-bold cursor-pointer">التاريخ {sortBy === 'date' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setSortBy('totalAmount')} className="flex items-center justify-between text-xs font-bold cursor-pointer">المبلغ {sortBy === 'totalAmount' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: WORKER BALANCES (ACCRUALS) */}
          <div className="xl:col-span-4 space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Users2 className="w-4 h-4 text-emerald-600" /> {lang === 'ar' ? 'أرصدة المستحقات المفتوحة' : 'OUTSTANDING BALANCES'}</h3>
                <Badge className="bg-rose-50 text-rose-600 border-rose-100 tabular-nums">{stats.workersCount}</Badge>
             </div>
             <div className="space-y-2">
                {workerBalances.map(w => (
                  <div key={w.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group">
                     <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100">
                           <AvatarImage src={w.photoUrl} className="object-cover" />
                           <AvatarFallback className="bg-slate-50 text-slate-400 text-[10px] font-black">{w.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-slate-800 truncate">{w.fullName}</p>
                           <p className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">{w.workerId}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-rose-600 tabular-nums">{w.balance.toLocaleString('en-US')}</p>
                           <p className="text-[8px] font-bold text-slate-300 uppercase">Balance Due</p>
                        </div>
                     </div>
                  </div>
                ))}
                {workerBalances.length === 0 && (
                   <div className="text-center py-10 opacity-50"><p className="text-[10px] font-bold">لا يوجد مديونيات حالية للعمال</p></div>
                )}
             </div>
          </div>

          {/* RIGHT: PAYMENT LOG */}
          <div className="xl:col-span-8">
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === 'ar' ? 'أحدث عمليات صرف الأجور' : 'RECENT DISBURSEMENTS'}</h3>
                </div>
                <Table className="text-right border-separate border-spacing-0">
                   <TableHeader className="bg-white">
                      <TableRow>
                        <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'المبلغ المصروف' : 'PAID'}</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {paymentsLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300 animate-pulse">جاري التحميل...</TableCell></TableRow>
                      ) : filteredPayments.map(p => (
                        <TableRow key={p.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                           <TableCell className="px-6 py-3 font-black text-slate-900 text-xs tabular-nums">{p.voucherNumber}</TableCell>
                           <TableCell className="px-6 py-3 font-bold text-slate-500 text-xs tabular-nums">{p.date}</TableCell>
                           <TableCell className="px-6 py-3 font-bold text-slate-700 text-xs">{allWorkers?.find(w => w.id === p.workerId)?.fullName || '---'}</TableCell>
                           <TableCell className="px-6 py-3 text-center">
                              <Badge className="bg-emerald-50 text-emerald-700 tabular-nums font-black border-emerald-100">
                                {p.totalAmount?.toLocaleString('en-US')} {p.currency}
                              </Badge>
                           </TableCell>
                           <TableCell className="px-6 py-3">
                              <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(p)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors">
                                 <Eye className="w-4 h-4" />
                              </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                      {filteredPayments.length === 0 && !paymentsLoading && (
                         <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-300 font-bold">لا يوجد عمليات صرف مسجلة</TableCell></TableRow>
                      )}
                   </TableBody>
                </Table>
             </div>
          </div>

        </div>
      </div>

      {/* NEW PAYMENT DIALOG */}
      <Dialog open={isPayDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[600px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Wallet className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'صرف أجور واستحقاقات' : 'Wage Disbursement'}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Recording cash movement to personnel</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSavePayment} className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Users2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'اختر الموظف' : 'WORKER'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, amount: 0})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                   <option value="">-- اختر الموظف --</option>
                   {workerBalances.map(w => (
                     <option key={w.id} value={w.id}>{w.fullName} (الرصيد: {w.balance.toLocaleString('en-US')})</option>
                   ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ الصرف' : 'PAY DATE'}</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
            </div>

            {formData.workerId && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between animate-in slide-in-from-top-2">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-800 uppercase">{lang === 'ar' ? 'الرصيد المستحق للعامل حالياً' : 'TOTAL OUTSTANDING'}</p>
                    <p className="text-2xl font-black text-emerald-700 tabular-nums">
                      {workerBalances.find(w => w.id === formData.workerId)?.balance.toLocaleString('en-US')} <span className="text-xs">YER</span>
                    </p>
                 </div>
                 <div className="p-3 bg-white rounded-full shadow-inner"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'المبلغ المصروف فعلياً' : 'PAYMENT AMOUNT'}</Label>
                <Input 
                  type="number" 
                  step="any"
                  value={formData.amount || ''} 
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                  placeholder="0.00"
                  className="h-14 font-black text-2xl text-center tabular-nums bg-slate-50 border-slate-200 focus:bg-white" 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'العملة' : 'CURR'}</Label>
                <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full h-14 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-black outline-none">
                   <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'بيان الصرف / ملاحظات' : 'MEMO / NOTES'}</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder={lang === 'ar' ? 'أجر تسليم عينة العيد، دفعة تصفية حساب...' : 'e.g. Full settlement for order X...'} className="h-12 bg-slate-50 text-xs font-bold" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.amount <= 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
                {lang === 'ar' ? 'ترحيل سند الصرف المالي' : 'Confirm & Post Disbursement'}
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
                       <div className="pt-2"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">البيان / الملاحظات</p><p className="text-xs font-bold text-slate-600 bg-white p-3 rounded-lg border border-slate-100">{printingVoucher.notes || '---'}</p></div>
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
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {lang === 'ar' ? 'تحميل السند' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="h-12 px-6 rounded-xl border border-slate-200 font-black">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FOOTER PROTOCOL */}
      <div className="flex-none p-2.5 bg-slate-900 text-white/50 flex items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck className="w-3.5 h-3.5" /></div>
        <p className="text-[10px] font-bold tracking-tight">
          {lang === 'ar' 
            ? 'بروتوكول مالي: يتم تقييد مبالغ الصرف فوراً في كشف حساب العامل وتعديل الرصيد المستحق بناءً على السياسة المالية المتبعة.' 
            : 'Fiscal Protocol: Disbursements are instantly posted to personnel ledgers and balances adjusted per fiscal policy.'}
        </p>
      </div>

    </div>
  );
}
    