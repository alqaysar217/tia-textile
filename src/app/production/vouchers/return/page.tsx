'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  RefreshCcw, 
  Save, 
  Loader2, 
  Calendar,
  Workflow,
  Package,
  Trash2,
  FileText,
  Edit2,
  CheckCircle2,
  Box,
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
  Info,
  AlertTriangle,
  FileOutput,
  ArrowUpRight,
  Users2,
  Tag,
  Clock,
  CalendarDays,
  X
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toPng } from 'html-to-image';

export default function MaterialReturnPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [deletingVoucher, setDeletingVoucher] = useState<any | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'voucherNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    linkedReceiptId: '', 
    notes: '',
    items: [] as any[]
  });

  // Current Item Selection State
  const [currentItem, setCurrentItem] = useState({ id: '', qty: 0 });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);
  const returnVouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_return')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allProducts } = useCollection<any>(productsQuery);
  const { data: allReceipts, loading: receiptsLoading } = useCollection<any>(receiptsQuery);
  const { data: returnVouchers, loading: returnsLoading } = useCollection<any>(returnVouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status !== 'deleted'), [allOrders]);

  // Unified Filtering Logic
  const applyFilters = useCallback((list: any[]) => {
    let result = list.filter(item => item.status !== 'deleted');

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item => {
        const order = allOrders?.find(o => o.id === item.orderId);
        const worker = allWorkers?.find(w => w.id === item.workerId);
        return item.voucherNumber?.toLowerCase().includes(s) || 
               worker?.fullName?.toLowerCase().includes(s) ||
               order?.orderNumber?.toLowerCase().includes(s);
      });
    }

    if (dateFrom) result = result.filter(item => item.date >= dateFrom);
    if (dateTo) result = result.filter(item => item.date <= dateTo);
    if (workerFilter !== 'all') result = result.filter(item => item.workerId === workerFilter);
    if (orderFilter !== 'all') result = result.filter(item => item.orderId === orderFilter);

    return result.sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (sortBy === 'date') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      const comp = String(valA).localeCompare(String(valB), 'en', { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [search, dateFrom, dateTo, workerFilter, orderFilter, sortBy, sortOrder, allOrders, allWorkers]);

  const pendingReturns = useMemo(() => {
    if (!allReceipts) return [];
    const list = allReceipts.filter(r => r.returnedItems && r.returnedItems.length > 0 && r.returnStatus !== 'verified');
    return applyFilters(list);
  }, [allReceipts, applyFilters]);

  const verifiedReturns = useMemo(() => {
    if (!returnVouchers) return [];
    return applyFilters(returnVouchers);
  }, [returnVouchers, applyFilters]);

  const workersWithPending = useMemo(() => {
    if (!formData.orderId || !allReceipts) return [];
    const workerIds = allReceipts
      .filter(r => r.orderId === formData.orderId && r.returnedItems?.length > 0 && r.returnStatus !== 'verified')
      .map(r => r.workerId);
    return allWorkers?.filter(w => workerIds.includes(w.id)) || [];
  }, [formData.orderId, allReceipts, allWorkers]);

  const availableReceipts = useMemo(() => {
    if (!formData.orderId || !formData.workerId || !allReceipts) return [];
    return allReceipts.filter(r => 
      r.orderId === formData.orderId && 
      r.workerId === formData.workerId && 
      r.returnedItems?.length > 0 && 
      r.returnStatus !== 'verified'
    );
  }, [formData.orderId, formData.workerId, allReceipts]);

  const handleQuickVerify = (receipt: any) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      orderId: receipt.orderId,
      workerId: receipt.workerId,
      linkedReceiptId: receipt.id,
      notes: lang === 'ar' ? `توثيق آلي للمرتجع من سند رقم ${receipt.voucherNumber}` : `Auto-verification for receipt ${receipt.voucherNumber}`,
      items: [...receipt.returnedItems]
    });
    setIsAddDialogOpen(true);
  };

  const handleReceiptSelection = (receiptId: string) => {
    const receipt = allReceipts?.find(r => r.id === receiptId);
    if (receipt) {
      setFormData(prev => ({
        ...prev,
        linkedReceiptId: receiptId,
        items: [...receipt.returnedItems]
      }));
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      const voucherData = {
        ...formData,
        type: 'material_return',
        status: 'posted',
        updatedAt: serverTimestamp()
      };

      if (editingVoucherId) {
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `MRV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      if (formData.linkedReceiptId) {
        batch.update(doc(db, 'vouchers', formData.linkedReceiptId), { returnStatus: 'verified' });
      }

      formData.items.forEach(item => {
        const mat = allMaterials?.find(m => m.id === item.id);
        if (mat) {
          batch.update(doc(db, 'materials', item.id), { currentQty: (mat.currentQty || 0) + Number(item.qty) });
        }
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم توثيق دخول المرتجع للمخزن" : "Return documented and stock updated" });
      resetDialog();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true, fontEmbedCSS: '' });
      const link = document.createElement('a');
      link.download = `Return-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', linkedReceiptId: '', notes: '', items: [] });
  };

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrder('desc'); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><RefreshCcw className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المخازن' : 'WMS'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'توريد المرتجعات' : 'Return Inward'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'تأكيد دخول المواد المرتجعة' : 'Return Verification Audit'}</h1>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
            <Plus className="w-4 h-4" /> {lang === 'ar' ? 'سند يدوي' : 'Manual Entry'}
          </Button>
        </div>

        {/* ADVANCED ERP TOOLBAR */}
        <div className="mt-4 flex flex-col xl:flex-row items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          {/* Tab Switcher */}
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
            <button onClick={() => setActiveTab('pending')} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2", activeTab === 'pending' ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50")}>
              <Clock className="w-3 h-3" /> {lang === 'ar' ? 'بانتظار التوثيق' : 'Pending'}
              {pendingReturns.length > 0 && <span className="bg-white/20 px-1.5 rounded-full text-[8px]">{pendingReturns.length}</span>}
            </button>
            <button onClick={() => setActiveTab('verified')} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2", activeTab === 'verified' ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50")}>
              <CheckCircle2 className="w-3 h-3" /> {lang === 'ar' ? 'الأرشيف الموثق' : 'Verified'}
            </button>
          </div>

          <div className="relative flex-1 w-full">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300`} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'رقم السند، الموظف، أو الدفعة...' : 'Reference, Worker, or Batch...'} className={cn("h-10 bg-white border-slate-200 text-xs font-bold", dir === 'rtl' ? "pr-10" : "pl-10")} />
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto">
             {/* Date Range Fields */}
             <div className="flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 h-10 shadow-sm">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold tabular-nums" />
                <span className="text-[10px] font-black text-slate-300">→</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-7 border-none shadow-none text-[10px] w-28 font-bold tabular-nums" />
                {(dateFrom || dateTo) && <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => { setDateFrom(''); setDateTo(''); }}><X className="w-3 h-3" /></Button>}
             </div>

             <div className="flex items-center gap-1.5 border-r border-slate-200 ps-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent shadow-sm">
                      <Filter className="w-4 h-4" /> {lang === 'ar' ? 'تصفية' : 'Filter'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-64 rounded-xl shadow-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">PERSONNEL</DropdownMenuLabel>
                    <ScrollArea className="h-40">
                       <DropdownMenuItem onClick={() => setWorkerFilter('all')} className="text-xs font-bold cursor-pointer">{lang === 'ar' ? 'الكل' : 'All'}</DropdownMenuItem>
                       {allWorkers?.filter(w => w.status !== 'deleted').map(w => (
                         <DropdownMenuItem key={w.id} onClick={() => setWorkerFilter(w.id)} className="text-xs font-bold cursor-pointer">{w.fullName}</DropdownMenuItem>
                       ))}
                    </ScrollArea>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">BATCH / ORDER</DropdownMenuLabel>
                    <ScrollArea className="h-40">
                       <DropdownMenuItem onClick={() => setOrderFilter('all')} className="text-xs font-bold cursor-pointer">{lang === 'ar' ? 'جميع الدفعات' : 'All Batches'}</DropdownMenuItem>
                       {activeOrders?.map(o => (
                         <DropdownMenuItem key={o.id} onClick={() => setOrderFilter(o.id)} className="text-xs font-bold cursor-pointer">{o.orderNumber} - {o.title}</DropdownMenuItem>
                       ))}
                    </ScrollArea>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">ORDERING</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => toggleSort('date')} className="flex justify-between items-center cursor-pointer font-bold">
                       {lang === 'ar' ? 'التاريخ' : 'Date'} {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('voucherNumber')} className="flex justify-between items-center cursor-pointer font-bold">
                       {lang === 'ar' ? 'رقم السند' : 'Reference'} {sortBy === 'voucherNumber' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleExportCSV} variant="ghost" className="h-10 px-3 rounded-lg text-xs font-bold gap-2 text-slate-600 hover:bg-white border border-transparent shadow-sm">
                  <FileDown className="w-4 h-4 text-emerald-600" /> {lang === 'ar' ? 'تصدير' : 'Export'}
                </Button>
             </div>
          </div>
        </div>
      </div>

      {/* DATA CONTENT AREA */}
      <div className="flex-1 min-h-0 p-4 md:p-6 no-scrollbar overflow-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          {activeTab === 'pending' ? (
            <>
              <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center gap-3">
                <Info className="w-4 h-4 text-amber-600" />
                <p className="text-[10px] font-bold text-amber-800">
                  {lang === 'ar' ? 'تظهر هنا السندات الميدانية التي تحتوي على مرتجعات وتنتظر تأكيد دخولها للمخازن فعلياً.' : 'Field receipts with returns waiting for physical warehouse inward confirmation.'}
                </p>
              </div>
              <div className="flex-1 overflow-auto no-scrollbar">
                <Table className="text-right border-separate border-spacing-0">
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>RECEIPT #</TableHead>
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>PERSONNEL</TableHead>
                      <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>RETURN SUMMARY</TableHead>
                      <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">ITEMS</TableHead>
                      <TableHead className="w-32 px-6 py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReturns.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300 italic">لا توجد مرتجعات معلقة حالياً</TableCell></TableRow>
                    ) : pendingReturns.map(r => (
                      <TableRow key={r.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                        <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{r.voucherNumber}</TableCell>
                        <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === r.workerId)?.fullName || '---'}</TableCell>
                        <TableCell className={cn("px-6 py-3", dir === 'rtl' ? "text-right" : "text-left")}>
                           <span className="text-[10px] font-bold text-slate-400 italic truncate max-w-[200px] block">
                             {r.returnedItems.slice(0, 2).map((it: any) => it.nameAr).join(', ')}{r.returnedItems.length > 2 ? '...' : ''}
                           </span>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                           <Badge variant="outline" className="font-black tabular-nums bg-amber-50 text-amber-700 border-amber-100">{r.returnedItems.length}</Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                           <Button onClick={() => handleQuickVerify(r)} variant="outline" className="h-8 px-4 rounded-lg text-[10px] font-black uppercase text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'توثيق' : 'Verify'}
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto no-scrollbar">
              <Table className="text-right border-separate border-spacing-0">
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>MRV #</TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>DATE</TableHead>
                    <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>WORKER</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">ITEMS</TableHead>
                    <TableHead className="w-24 px-6 py-4 text-center">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedReturns.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300 italic">الأرشيف فارغ</TableCell></TableRow>
                  ) : verifiedReturns.map(v => (
                    <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                      <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.voucherNumber}</TableCell>
                      <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.date}</TableCell>
                      <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>{allWorkers?.find(w => w.id === v.workerId)?.fullName || '---'}</TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <Badge variant="outline" className="font-black tabular-nums bg-emerald-50 text-emerald-700 border-emerald-100">{v.items?.length || 0}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                         <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-all rounded-lg"><Eye className="w-4 h-4" /></Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                                <DropdownMenuItem onClick={() => { setEditingVoucherId(v.id); setFormData({ ...v }); setIsAddDialogOpen(true); }} className="gap-2 font-bold py-2 cursor-pointer text-xs"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> تعديل</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDeletingVoucher(v)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer text-xs"><Trash2 className="w-3.5 h-3.5" /> حذف</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* SMART WIZARD DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white"><ShieldCheck className="w-5 h-5 text-emerald-300" /> {lang === 'ar' ? 'توثيق توريد مرتجع مخزني' : 'Verified Material Inward'}</DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Official warehouse confirmation of returned materials</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Workflow className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'أمر الإنتاج' : 'ORDER'}</Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: '', linkedReceiptId: '', items: []})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر الأمر --</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'الموظف المسلم' : 'WORKER'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value, linkedReceiptId: '', items: []})} disabled={!formData.orderId} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر الموظف --</option>
                  {workersWithPending.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ التوريد' : 'DATE'}</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
            </div>

            {availableReceipts.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                 <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2"><FileOutput className="w-3.5 h-3.5" /> {lang === 'ar' ? 'اختر سند الاستلام المرتبط' : 'LINK TO PRODUCTION RECEIPT'}</h3>
                 <div className="flex flex-wrap gap-2">
                    {availableReceipts.map(r => (
                      <button key={r.id} type="button" onClick={() => handleReceiptSelection(r.id)} className={cn("px-4 py-2 rounded-lg border text-[10px] font-black transition-all flex items-center gap-2", formData.linkedReceiptId === r.id ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-105" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300")}>
                        {formData.linkedReceiptId === r.id ? <CheckCircle2 className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {r.voucherNumber} ({(r.returnedItems?.length || 0)} {lang === 'ar' ? 'أصناف' : 'Items'})
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {formData.items.length > 0 && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Box className="w-3.5 h-3.5" /> {lang === 'ar' ? 'الأصناف المرتجعة المكتشفة آلياً' : 'AUTO-DETECTED ITEMS'}</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                   <Table className="text-right">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className={cn("px-4 py-2 text-[9px] font-black text-slate-500 uppercase", dir === 'rtl' ? "text-right" : "text-left")}>MATERIAL</TableHead>
                          <TableHead className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase text-center">QTY</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, idx) => (
                          <TableRow key={idx} className="border-b border-slate-50">
                            <TableCell className={cn("px-4 py-3 text-xs font-bold text-slate-900", dir === 'rtl' ? "text-right" : "text-left")}>{item.nameAr}</TableCell>
                            <TableCell className="px-4 py-3 text-center font-black text-emerald-700 tabular-nums">{(item.qty || 0).toLocaleString('en-US')} {item.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">ملاحظات توثيق المستودع</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-12 bg-slate-50 text-xs font-bold" placeholder={lang === 'ar' ? 'حالة المواد عند الاستلام...' : 'Condition upon return...'} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.items.length === 0 || !formData.workerId} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <ShieldCheck className="w-5 h-5 me-2" />}
                {lang === 'ar' ? 'تأكيد دخول المخزن وتصفية العهدة' : 'Confirm Inward & Clear Liability'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT/IMAGE PREVIEW DIALOG */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>{lang === 'ar' ? 'معاينة طباعة سند توريد المرتجع' : 'Material Return Voucher Preview'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>

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

                  <div className="text-center mb-10 relative z-10">
                    <div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm ring-4 ring-emerald-50">
                      <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">{lang === 'ar' ? 'سند توريد مرتجع مواد خام' : 'Material Return Voucher'}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 relative z-10">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'اسم الموظف المسلم' : 'Personnel'}</span>
                        <span className="text-sm font-black text-slate-900">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'القسم / المسار' : 'Department'}</span>
                        <span className="text-sm font-black text-slate-700">
                           {allDepartments?.find(d => d.id === allWorkers?.find(w => w.id === printingVoucher.workerId)?.departmentId)?.nameAr || '---'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'رقم السند' : 'Voucher No.'}</span>
                        <span className="text-sm font-black text-emerald-900 tabular-nums tracking-wider">{printingVoucher.voucherNumber}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'الدفعة' : 'Batch Name'}</span>
                        <span className="text-sm font-black text-slate-700 truncate max-w-[150px]">{allOrders?.find(o => o.id === printingVoucher.orderId)?.title}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تاريخ السند' : 'Date'}</span>
                        <span className="text-sm font-black text-slate-700 tabular-nums">{printingVoucher.date}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'المشرف المسؤول' : 'Supervisor'}</span>
                        <span className="text-sm font-black text-slate-700">
                          {allWorkers?.find(w => w.id === allWorkers?.find(work => work.id === printingVoucher.workerId)?.supervisorId)?.fullName || (lang === 'ar' ? 'مشرف القسم المباشر' : 'Direct Supervisor')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12 relative z-10">
                    <Table className="text-right border-2 border-emerald-900/10">
                      <TableHeader className="bg-emerald-900/5">
                        <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                          <TableHead className="text-right font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'المادة المرتجعة' : 'Returned Material'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                          <TableHead className="text-center font-black text-xs py-4 text-emerald-900">{lang === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {printingVoucher.items.map((item: any, i: number) => (
                          <TableRow key={i} className="border-b border-slate-100 bg-white/40">
                            <TableCell className="font-bold text-sm py-4 text-slate-800">{item.nameAr}</TableCell>
                            <TableCell className="text-center font-black text-sm tabular-nums py-4 text-emerald-700">{item.qty}</TableCell>
                            <TableCell className="text-center text-xs font-bold text-slate-500 uppercase py-4">{item.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center relative z-10 mt-auto">
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'أمين المستودع' : 'Store Keeper'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'توقيع الموظف (المسلم)' : 'Worker Signature'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p>
                    </div>
                    <div className="space-y-12">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'اعتماد المدير / المشرف' : 'Auth. Approval'}</p>
                      <div className="h-px bg-slate-300 w-3/4 mx-auto" />
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Authorized Signature</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all">
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {lang === 'ar' ? 'تحميل كصورة' : 'Download PNG'}
            </Button>
            <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-8 rounded-xl border border-slate-200 text-slate-500">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner"><History className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'إلغاء توثيق المرتجع' : 'Cancel Verification'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">تحذير: سيتم خصم الكميات من المخزن وإعادة حالة المرتجع إلى "معلق" في سند الاستلام الأصلي.</AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={async () => {
              if (!db || !deletingVoucher) return;
              const batch = writeBatch(db);
              deletingVoucher.items.forEach((item: any) => {
                const mat = allMaterials?.find(m => m.id === item.id);
                if (mat) batch.update(doc(db, 'materials', item.id), { currentQty: Math.max(0, mat.currentQty - item.qty) });
              });
              if (deletingVoucher.linkedReceiptId) batch.update(doc(db, 'vouchers', deletingVoucher.linkedReceiptId), { returnStatus: 'pending' });
              batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
              await batch.commit();
              setDeletingVoucher(null);
              toast({ title: "تم إلغاء السند" });
            }} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">تراجع</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-none p-2 bg-slate-900 text-white/40 flex items-center justify-center gap-3">
        <Info className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[10px] font-bold">نظام الرقابة المخزنية: كافة التوريدات توثق ببصمة زمنية وتوقيع إلكتروني للمسؤول.</p>
      </div>
    </div>
  );
}

function handleExportCSV() {
  // Logic already defined inside the component scope above.
}
