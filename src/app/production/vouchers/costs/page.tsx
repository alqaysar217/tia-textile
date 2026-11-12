'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Receipt, 
  Save, 
  Loader2, 
  Calendar,
  Workflow,
  Trash2,
  FileText,
  Edit2,
  CheckCircle2,
  Check,
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
  Wallet,
  Zap,
  Info,
  ShieldCheck,
  Tag,
  Briefcase,
  Image as ImageIcon,
  UploadCloud,
  X,
  PlusCircle,
  Coins,
  RefreshCcw,
  UserCheck,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toPng } from 'html-to-image';
import { VoucherTemplate } from '@/components/production/VoucherTemplate';

export default function OverheadCostsPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isRtl = lang === 'ar';

  // Fetch System Settings for Currency Lock
  const settingsRef = useMemo(() => !db ? null : doc(db, 'settings', 'global'), [db]);
  const { data: savedSettings } = useDoc<any>(settingsRef);
  const systemCurrency = savedSettings?.baseCurrency || 'YER';

  // Unified Form State (Single Item Approach)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    currency: systemCurrency,
    orderId: '',
    recipient: '',
    description: '',
    totalAmount: 0,
    notes: '',
    invoicePhotoUrl: ''
  });

  // Sync currency with system settings when adding new voucher
  useEffect(() => {
    if (!editingVoucherId && systemCurrency) {
      setFormData(prev => ({ ...prev, currency: systemCurrency }));
    }
  }, [systemCurrency, editingVoucherId, isAddDialogOpen]);

  const costCategories = [
    { value: 'electricity', labelAr: 'كهرباء', labelEn: 'Electricity', icon: <Zap className="w-3.5 h-3.5" /> },
    { value: 'internet', labelAr: 'انترنت', labelEn: 'Internet', icon: <Hash className="w-3.5 h-3.5" /> },
    { value: 'maintenance', labelAr: 'صيانة', labelEn: 'Maintenance', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'spare_parts', labelAr: 'قطع غيار', labelEn: 'Spare Parts', icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'rent', labelAr: 'إيجار', labelEn: 'Rent', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'communications', labelAr: 'اتصالات', labelEn: 'Telecom', icon: <Hash className="w-3.5 h-3.5" /> },
    { value: 'transport', labelAr: 'نقل', labelEn: 'Transport', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'marketing', labelAr: 'تسويق', labelEn: 'Marketing', icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'design', labelAr: 'تصميم', labelEn: 'Design', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'photography', labelAr: 'تصوير', labelEn: 'Photography', icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'training', labelAr: 'تدريب', labelEn: 'Training', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { value: 'services', labelAr: 'خدمات', labelEn: 'Services', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'other', labelAr: 'أخرى', labelEn: 'Other', icon: <Receipt className="w-3.5 h-3.5" /> },
  ];

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'overhead_cost')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    let result = vouchers.filter(v => v.status !== 'deleted');

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(v => 
        v.voucherNumber?.toLowerCase().includes(s) || 
        v.recipient?.toLowerCase().includes(s) ||
        v.description?.toLowerCase().includes(s)
      );
    }

    if (categoryFilter !== 'all') result = result.filter(v => v.category === categoryFilter);
    if (currencyFilter !== 'all') result = result.filter(v => v.currency === currencyFilter);
    if (orderFilter !== 'all') result = result.filter(v => v.orderId === orderFilter);
    if (dateFrom) result = result.filter(v => v.date >= dateFrom);
    if (dateTo) result = result.filter(v => v.date <= dateTo);

    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      if (sortBy === 'totalAmount') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [vouchers, search, categoryFilter, currencyFilter, orderFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setFormData(prev => ({ ...prev, invoicePhotoUrl: canvas.toDataURL('image/jpeg', 0.6) }));
        setIsCompressing(false);
      };
    };
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || !formData.recipient || !formData.description || formData.totalAmount <= 0) {
      toast({ variant: "destructive", title: isRtl ? "يرجى إكمال البيانات المطلوبة" : "Please complete required fields" });
      return;
    }

    setIsSubmitting(true);
    try {
      const voucherData = {
        ...formData,
        totalAmount: Number(formData.totalAmount),
        type: 'overhead_cost',
        status: 'posted',
        updatedAt: serverTimestamp()
      };

      if (editingVoucherId) {
        await updateDoc(doc(db, 'vouchers', editingVoucherId), voucherData);
        toast({ title: isRtl ? "تم التحديث بنجاح" : "Updated Successfully" });
      } else {
        const voucherNumber = `CST-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, 'vouchers'), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
        toast({ title: isRtl ? "تم تسجيل السند بنجاح" : "Voucher Recorded" });
      }
      resetDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ 
      date: new Date().toISOString().split('T')[0], 
      category: 'other', 
      currency: systemCurrency, 
      orderId: '', 
      recipient: '', 
      description: '', 
      totalAmount: 0, 
      notes: '', 
      invoicePhotoUrl: '' 
    });
  };

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
      link.download = `Cost-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: isRtl ? "تم تحميل السند بنجاح" : "Voucher Downloaded" });
    } catch (err) {
      console.error('Image generation error:', err);
      toast({ variant: "destructive", title: isRtl ? "فشل تحميل الصورة" : "Download failed" });
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const handleEditVoucher = (v: any) => {
    setEditingVoucherId(v.id);
    setFormData({ ...v });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* HEADER SECTION */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg"><Receipt className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{isRtl ? 'المالية' : 'Accounting'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{isRtl ? 'سند تكاليف تشغيلية' : 'Overhead Costs'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">{isRtl ? 'إدارة المصاريف والتشغيل' : 'Expense Master'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {isRtl ? 'سند تكاليف جديد' : 'New Cost Voucher'}
            </Button>
          </div>
        </div>

        {/* COMPACT TOOLBAR - SINGLE LINE */}
        <div className="mt-4 flex flex-col md:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative flex-1 w-full">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", isRtl ? "right-3" : "left-3")} />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={isRtl ? 'بحث بالسند أو البيان أو المورد...' : 'Search records...'} 
              className={cn("h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100", isRtl ? "pr-10" : "pl-10")} 
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex items-center gap-2 px-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 h-10 shrink-0">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold tabular-nums dark:bg-slate-900 dark:text-slate-100" />
                <span className="text-[10px] font-black text-slate-300">→</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold tabular-nums dark:bg-slate-900 dark:text-slate-100" />
             </div>

             <div className={cn("flex items-center gap-1.5 px-1.5 border-slate-200 dark:border-slate-700", isRtl ? "border-r" : "border-l")}>
                <Button onClick={() => {
                    const headers = ['Ref #', 'Date', 'Recipient', 'Description', 'Amount', 'Currency'];
                    const rows = filteredVouchers.map(v => [v.voucherNumber, v.date, v.recipient, v.description, v.totalAmount, v.currency]);
                    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `OverheadCosts_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast({ title: isRtl ? "تم التصدير بنجاح" : "Exported Successfully" });
                }} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {isRtl ? 'تصدير' : 'Export'}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent">
                      <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      {isRtl ? 'تصفية' : 'Filter'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'ترتيب النتائج' : 'SORTING'}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => toggleSort('date')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200">
                      <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /> {isRtl ? 'حسب التاريخ' : 'By Date'}</div>
                      {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('totalAmount')} className="flex items-center justify-between text-xs font-bold cursor-pointer py-2.5 dark:text-slate-200">
                      <div className="flex items-center gap-2"><Wallet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" /> {isRtl ? 'حسب المبلغ' : 'By Amount'}</div>
                      {sortBy === 'totalAmount' && (sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <SortDesc className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />)}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="dark:bg-slate-800" />
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'حسب التصنيف' : 'BY CATEGORY'}</DropdownMenuLabel>
                    <ScrollArea className="h-40">
                      <DropdownMenuItem onClick={() => setCategoryFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200">
                        {isRtl ? 'الكل' : 'All'}
                        {categoryFilter === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </DropdownMenuItem>
                      {costCategories.map(c => (
                        <DropdownMenuItem key={c.value} onClick={() => setCategoryFilter(c.value)} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200">
                          {isRtl ? c.labelAr : c.labelEn}
                          {categoryFilter === c.value && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </DropdownMenuItem>
                      ))}
                    </ScrollArea>

                    <DropdownMenuSeparator className="dark:bg-slate-800" />
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{isRtl ? 'حسب الدفعة' : 'BY BATCH'}</DropdownMenuLabel>
                    <ScrollArea className="h-32">
                       <DropdownMenuItem onClick={() => setOrderFilter('all')} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200">{isRtl ? 'الكل' : 'All'}{orderFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                       {allOrders?.map(o => (
                         <DropdownMenuItem key={o.id} onClick={() => setOrderFilter(o.id)} className="flex items-center justify-between text-xs font-bold cursor-pointer dark:text-slate-200">
                            <span className="truncate max-w-[150px]">{o.orderNumber} - {o.title}</span>
                            {orderFilter === o.id && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                         </DropdownMenuItem>
                       ))}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
          <Table className={cn("text-right border-separate border-spacing-0", !isRtl && "text-left")}>
            <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
              <TableRow className="border-b dark:border-slate-700">
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>{isRtl ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>{isRtl ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", isRtl ? "text-right" : "text-left")}>{isRtl ? 'البيان والمستفيد' : 'DESCRIPTION'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'التصنيف' : 'CATEGORY'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'الإجمالي' : 'TOTAL'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase text-center border-b border-slate-200 dark:border-slate-700">{isRtl ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 dark:text-slate-600 animate-pulse">{isRtl ? 'جاري التحميل...' : 'Loading...'}</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300 dark:text-slate-700">{isRtl ? 'لا توجد سجلات' : 'No records found'}</TableCell></TableRow>
              ) : filteredVouchers.map((v) => (
                <TableRow key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors group">
                  <TableCell className={cn("px-6 py-3 font-black text-slate-900 dark:text-slate-100 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.voucherNumber}</TableCell>
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-500 dark:text-slate-500 text-xs tabular-nums", isRtl ? "text-right" : "text-left")}>{v.date}</TableCell>
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs", isRtl ? "text-right" : "text-left")}>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 dark:text-slate-100 line-clamp-1">{v.description}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{isRtl ? 'إلى:' : 'To:'} {v.recipient}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] border-slate-200 dark:border-slate-700">
                      {costCategories.find(c => c.value === v.category)?.[isRtl ? 'labelAr' : 'labelEn'] || v.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {(v.totalAmount || 0).toLocaleString('en-US')} <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase ms-1">{v.currency}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Eye className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align={isRtl ? "end" : "start"} className="w-44 rounded-xl shadow-xl dark:bg-slate-900 dark:border-slate-800">
                          <DropdownMenuItem onClick={() => handleEditVoucher(v)} className="gap-2 font-bold py-2 cursor-pointer text-xs dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800"><Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'تعديل السند' : 'Edit Voucher'}</DropdownMenuItem>
                          <DropdownMenuSeparator className="dark:bg-slate-800" />
                          <DropdownMenuItem onClick={async () => { if (!db) return; await updateDoc(doc(db, 'vouchers', v.id), { status: 'deleted', deletedAt: serverTimestamp() }); toast({ title: isRtl ? "تم النقل للأرشيف" : "Archived" }); }} className="gap-2 font-bold py-2 text-rose-600 dark:text-rose-400 cursor-pointer text-xs focus:bg-rose-50 dark:focus:bg-rose-900/20"><Trash2 className="w-3.5 h-3.5" /> {isRtl ? 'نقل للمهملات' : 'Move to Trash'}</DropdownMenuItem>
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

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[700px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="premium-gradient p-5 text-white">
            <DialogHeader className={cn("text-right", !isRtl && "text-left")}>
              <DialogTitle className="text-lg font-black flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-300" />
                {editingVoucherId ? (isRtl ? 'تعديل سند المصروف' : 'Update Expenditure') : (isRtl ? 'تسجيل سند مصروفات تشغيلية' : 'New Overhead Expenditure')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[9px] uppercase mt-1">
                {isRtl ? 'تخصيص مصروفات لدفعة محددة أو مصروفات عامة للجمعية' : 'Single entry expense allocation for better tracking'}
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="bg-white dark:bg-slate-900 flex flex-col max-h-[85vh]">
            <ScrollArea className="flex-1 p-6" dir={dir}>
              <div className="space-y-6">
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* ATTACHMENT */}
                  <div className="w-full md:w-32 space-y-2 flex flex-col items-center shrink-0">
                    <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block text-center">{isRtl ? 'صورة السند' : 'ATTACHMENT'}</Label>
                    <div 
                      onClick={() => !isCompressing && fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-2xl border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all overflow-hidden relative"
                    >
                      {formData.invoicePhotoUrl ? (
                        <img src={formData.invoicePhotoUrl} className="w-full h-full object-cover" alt="invoice" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500">
                          {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
                          <span className="text-[9px] font-black uppercase tracking-widest">{isRtl ? 'رفع' : 'Upload'}</span>
                        </div>
                      )}
                      {formData.invoicePhotoUrl && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <RefreshCcw className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>

                  {/* FORM FIELDS */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                        <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'تاريخ السند' : 'TRANSACTION DATE'}</Label>
                        <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-xs dark:text-slate-100" required />
                      </div>
                      <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                        <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'نوع المصروف' : 'COST CATEGORY'}</Label>
                        <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-bold outline-none dark:text-slate-100">
                           {costCategories.map(c => <option key={c.value} value={c.value}>{isRtl ? c.labelAr : c.labelEn}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                      <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Workflow className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {isRtl ? 'الدفعة المرتبطة (اختياري)' : 'LINKED BATCH (OPTIONAL)'}</Label>
                      <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-bold outline-none dark:text-slate-100">
                        <option value="">{isRtl ? '-- عام (غير مرتبط بطلب) --' : '-- General (Unlinked) --'}</option>
                        {allOrders?.filter(o => o.status !== 'deleted').map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                      <Label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">{isRtl ? 'المستفيد' : 'PAID TO'}</Label>
                      <Input value={formData.recipient} onChange={(e) => setFormData({...formData, recipient: e.target.value})} className="h-10 bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 font-bold text-xs dark:text-slate-100" placeholder={isRtl ? "مثال: شركة الكهرباء / اسم المورد" : "Example: Vendor Name"} required />
                    </div>
                    <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                      <Label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">{isRtl ? 'البيان' : 'EXPENDITURE DESCRIPTION'}</Label>
                      <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="h-10 bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 font-bold text-xs dark:text-slate-100" placeholder={isRtl ? "مثال: قيمة فاتورة شهر أكتوبر" : "Example: October Invoice"} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                       <Label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">{isRtl ? 'القيمة' : 'AMOUNT'}</Label>
                       <div className="relative">
                          <Input type="number" step="any" value={formData.totalAmount || ''} onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})} className="h-12 font-black text-xl text-center tabular-nums bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400" required />
                          <div className={cn("absolute top-1/2 -translate-y-1/2", isRtl ? "left-3" : "right-3")}>
                            <select 
                              value={formData.currency} 
                              disabled 
                              className="h-8 px-1 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded text-[9px] font-black outline-none cursor-not-allowed opacity-70 dark:text-slate-400"
                            >
                               <option value="YER">YER</option>
                               <option value="SAR">SAR</option>
                               <option value="USD">USD</option>
                            </select>
                          </div>
                       </div>
                    </div>
                    <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
                       <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{isRtl ? 'ملاحظات إضافية' : 'ADDITIONAL NOTES'}</Label>
                       <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[11px] font-bold dark:text-slate-100" />
                    </div>
                  </div>
                </div>

              </div>
            </ScrollArea>

            <div className="flex-none p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <Button type="submit" disabled={isSubmitting || isCompressing || formData.totalAmount <= 0} className="flex-1 h-12 premium-gradient text-white rounded-lg font-black text-sm shadow-lg border-none transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {isRtl ? 'ترحيل سند المصروف' : 'Post Expenditure'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-6 h-12 font-black text-slate-400 dark:text-slate-500 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">{isRtl ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT PREVIEW */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>{isRtl ? 'معاينة السند' : 'Print Preview'}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            {/* FORCED LIGHT MODE FOR VOUCHER PRINTING */}
            <div className="p-12 bg-white text-slate-900 relative z-0 light" id="printable-voucher">
              {printingVoucher && (
                <VoucherTemplate 
                  voucher={printingVoucher}
                  allOrders={allOrders}
                  allWorkers={allWorkers}
                  lang={lang}
                />
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 dark:border-slate-800 dark:bg-slate-900 flex flex-row gap-3 justify-end">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all">
               {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
               {isRtl ? 'تحميل كصورة PNG' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-8 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">{isRtl ? 'إغلاق' : 'Close'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingVoucher} onOpenChange={() => setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><History className="w-32 h-32 text-white" /></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner"><History className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">{isRtl ? 'إلغاء السند المالي' : 'Cancel Transaction'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed text-center">
              {isRtl ? 'تحذير: سيتم إلغاء السند وعكس أثره على الحسابات وتكاليف الإنتاج فوراً.' : 'Warning: This will reverse the fiscal impact on accounting and production costs.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
             <AlertDialogAction onClick={async () => { if (!db) return; await updateDoc(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() }); setDeletingVoucher(null); toast({ title: isRtl ? "تم الإلغاء" : "Reversed" }); }} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none shadow-lg transition-all active:scale-95">{isRtl ? 'تأكيد' : 'Confirm'}</AlertDialogAction>
             <AlertDialogCancel className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 dark:text-slate-500 rounded-md font-black hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">{isRtl ? 'تراجع' : 'Cancel'}</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* SYSTEM NOTE */}
      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/80 text-white/40 dark:text-slate-500 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl transition-colors duration-300">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {isRtl 
             ? 'بروتوكول الرقابة المالية: يتم تسجيل كافة المصروفات المباشرة وغير المباشرة لضمان دقة احتساب تكلفة المنتج النهائي.' 
             : 'Financial Protocol: All direct and indirect expenses are logged for accurate unit cost calculation.'}
         </p>
      </div>

    </div>
  );
}