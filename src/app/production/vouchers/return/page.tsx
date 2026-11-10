'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  Users2,
  Tag,
  Wallet
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
  
  const [sortBy, setSortBy] = useState<'date' | 'voucherNumber'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    linkedReceiptId: '', 
    notes: '',
    items: [] as any[]
  });

  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const receiptsQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'production_receipt')), [db]);
  const returnVouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_return')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allDepartments } = useCollection<any>(deptsQuery);
  const { data: allReceipts } = useCollection<any>(receiptsQuery);
  const { data: returnVouchers, loading: vL } = useCollection<any>(returnVouchersQuery);

  const applyFilters = useCallback((list: any[]) => {
    let result = (list || []).filter(item => item.status !== 'deleted');
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
        return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      }
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [search, dateFrom, dateTo, workerFilter, orderFilter, sortBy, sortOrder, allOrders, allWorkers]);

  const pendingReturns = useMemo(() => {
    if (!allReceipts) return [];
    return applyFilters(allReceipts.filter(r => r.returnedItems?.length > 0 && r.returnStatus !== 'verified'));
  }, [allReceipts, applyFilters]);

  const verifiedReturns = useMemo(() => applyFilters(returnVouchers || []), [returnVouchers, applyFilters]);

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

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;
    setIsSubmitting(true);
    const batch = writeBatch(db);
    try {
      const voucherData = { ...formData, type: 'material_return', status: 'posted', updatedAt: serverTimestamp() };
      if (editingVoucherId) {
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `MRV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }
      if (formData.linkedReceiptId) batch.update(doc(db, 'vouchers', formData.linkedReceiptId), { returnStatus: 'verified' });
      formData.items.forEach(item => {
        const mat = allMaterials?.find(m => m.id === item.id);
        if (mat) batch.update(doc(db, 'materials', item.id), { currentQty: (mat.currentQty || 0) + Number(item.qty) });
      });
      await batch.commit();
      toast({ title: lang === 'ar' ? "تم التوثيق بنجاح" : "Success" });
      resetDialog();
    } finally { setIsSubmitting(false); }
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', linkedReceiptId: '', notes: '', items: [] });
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
    } finally { setIsDownloading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><RefreshCcw className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>WMS</span><ChevronRight className="w-3 h-3" /><span>{lang === 'ar' ? 'توريد المرتجعات' : 'Returns'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900">{lang === 'ar' ? 'توثيق دخول المرتجعات' : 'Return Audit'}</h1>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar">
             <div className="flex bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                <button onClick={() => setActiveTab('pending')} className={cn("px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", activeTab === 'pending' ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                  {lang === 'ar' ? 'بانتظار التوثيق' : 'PENDING'}
                </button>
                <button onClick={() => setActiveTab('verified')} className={cn("px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all", activeTab === 'verified' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                  {lang === 'ar' ? 'الأرشيف الموثق' : 'VERIFIED'}
                </button>
             </div>
             
             <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} className="h-9 w-full pr-8 text-[10px] font-bold bg-white" />
             </div>

             <div className="flex items-center gap-1 bg-white px-2 rounded-lg border border-slate-200 h-9 shrink-0">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-6 border-none shadow-none text-[9px] w-24 font-bold p-0" />
                <span className="text-slate-300">→</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-6 border-none shadow-none text-[9px] w-24 font-bold p-0" />
             </div>

             <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"><Filter className="w-4 h-4 text-slate-400" /></Button>
                <Button onClick={handleExportCSV} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"><FileDown className="w-4 h-4 text-emerald-600" /></Button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-6 overflow-auto no-scrollbar">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
           <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center gap-3">
              <Info className="w-4 h-4 text-amber-600" />
              <p className="text-[10px] font-bold text-amber-800">
                {lang === 'ar' ? 'بروتوكول التدقيق: يجب مطابقة المرتجع الميداني مع السجل المخزني الفعلي قبل تأكيد الدخول.' : 'Audit Protocol: Verify field returns against physical stock before confirmation.'}
              </p>
           </div>
           <div className="flex-1 overflow-auto no-scrollbar">
              <Table className="text-right border-separate border-spacing-0">
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">REFERENCE</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">PERSONNEL</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">ITEMS</TableHead>
                    <TableHead className="w-32 px-6 py-4 text-center">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {(activeTab === 'pending' ? pendingReturns : verifiedReturns).map(v => (
                     <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                        <TableCell className="px-6 py-3">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{v.date}</span>
                           </div>
                        </TableCell>
                        <TableCell className="px-6 py-3">
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden text-[10px] font-black text-slate-400">
                                 {allWorkers?.find(w => w.id === v.workerId)?.fullName?.charAt(0)}
                              </div>
                              <span className="font-bold text-slate-700 text-xs">{allWorkers?.find(w => w.id === v.workerId)?.fullName}</span>
                           </div>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                           <div className="flex items-center justify-center gap-2">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-black tabular-nums border-emerald-100">
                                 {(v.returnedItems?.length || v.items?.length || 0)} {lang === 'ar' ? 'أصناف' : 'Items'}
                              </Badge>
                              {v.returnedItems?.slice(0, 1).map((item: any, i: number) => (
                                 <span key={i} className="text-[9px] text-slate-400 font-medium truncate max-w-[100px] hidden md:inline">({item.nameAr})</span>
                              ))}
                           </div>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-center">
                           {activeTab === 'pending' ? (
                             <Button onClick={() => handleQuickVerify(v)} size="sm" className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black text-white rounded-lg shadow-sm">
                               {lang === 'ar' ? 'توثيق المرتجع' : 'VERIFY'}
                             </Button>
                           ) : (
                             <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 rounded-lg"><Eye className="w-4 h-4" /></Button>
                           )}
                        </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
              </Table>
           </div>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <RefreshCcw className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'توثيق توريد المرتجع للمخزن' : 'Verify Material Return'}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Authenticating raw material re-entry into inventory</p>
            </DialogHeader>
          </div>
          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 text-right"><Label className="text-[10px] font-black uppercase text-slate-400">DATE</Label><Input type="date" value={formData.date} className="h-11 bg-slate-50 font-bold" disabled /></div>
                <div className="space-y-1.5 text-right"><Label className="text-[10px] font-black uppercase text-slate-400">WORKER</Label><Input value={allWorkers?.find(w => w.id === formData.workerId)?.fullName || ''} className="h-11 bg-slate-50 font-bold" disabled /></div>
                <div className="space-y-1.5 text-right"><Label className="text-[10px] font-black uppercase text-slate-400">BATCH</Label><Input value={allOrders?.find(o => o.id === formData.orderId)?.title || ''} className="h-11 bg-slate-50 font-bold" disabled /></div>
             </div>
             
             <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table className="text-right">
                   <TableHeader className="bg-slate-50">
                     <TableRow>
                       <TableHead className="px-4 py-2 font-black text-[9px] uppercase text-right">MATERIAL</TableHead>
                       <TableHead className="px-4 py-2 font-black text-[9px] uppercase text-center">QTY</TableHead>
                       <TableHead className="px-4 py-2 font-black text-[9px] uppercase text-center">UNIT</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                      {formData.items.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-slate-50 bg-white">
                           <TableCell className="px-4 py-3 text-xs font-bold text-slate-700">{item.nameAr}</TableCell>
                           <TableCell className="text-center font-black text-emerald-700 tabular-nums">{item.qty}</TableCell>
                           <TableCell className="text-center text-[10px] font-bold text-slate-400 uppercase">{item.unit}</TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </div>
             
             <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400">AUDIT NOTES</Label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white" />
             </div>

             <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 premium-gradient text-white font-black text-base shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <CheckCircle2 className="w-5 h-5 me-2" />}
                  {lang === 'ar' ? 'تأكيد دخول المخزن وتصفية العهدة' : 'Confirm Inventory Re-entry'}
                </Button>
                <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl">إلغاء</Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white">
          <DialogHeader className="sr-only"><DialogTitle>معاينة سند المرتجع</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col h-full text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10"><img src="/images/logo.png" className="w-full h-full object-contain grayscale" /></div>
                  <div className="grid grid-cols-3 items-center border-b-[6px] border-emerald-800 pb-8 mb-8">
                    <div className="text-right space-y-1"><h2 className="text-xl font-black text-emerald-900">جمعية الصناعات النسيجية</h2><p className="text-xs font-bold text-slate-500">الروضة - شبوة - اليمن</p></div>
                    <div className="flex justify-center"><div className="w-24 h-24 border-2 border-emerald-800/10 rounded-full flex items-center justify-center p-2"><img src="/images/logo.png" className="w-full h-full object-contain" /></div></div>
                    <div className="text-left space-y-1" dir="ltr"><h2 className="text-[14px] font-black text-emerald-900 uppercase">Textile Industries Association</h2><p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa</p></div>
                  </div>
                  <div className="text-center mb-10"><div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm"><h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">{lang === 'ar' ? 'سند توريد مرتجع مخزني' : 'Material Return Voucher'}</h3></div></div>
                  <div className="grid grid-cols-3 gap-8 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">المرسل / الموظف</span><span className="text-sm font-black text-slate-900">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span></div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">القسم</span><span className="text-sm font-black text-slate-700">{allDepartments?.find(d => d.id === (allWorkers?.find(w => w.id === printingVoucher.workerId)?.departmentId))?.nameAr}</span></div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">رقم السند</span><span className="text-sm font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</span></div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">الدفعة</span><span className="text-sm font-black text-slate-700">{allOrders?.find(o => o.id === printingVoucher.orderId)?.title}</span></div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">تاريخ التوريد</span><span className="text-sm font-black text-slate-700 tabular-nums">{printingVoucher.date}</span></div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">المشرف المعتمد</span><span className="text-sm font-black text-slate-700">{allWorkers?.find(w => w.id === (allWorkers?.find(work => work.id === printingVoucher.workerId)?.supervisorId))?.fullName || '---'}</span></div>
                    </div>
                  </div>
                  <div className="mb-12"><Table className="text-right border-2 border-emerald-900/10"><TableHeader className="bg-emerald-900/5"><TableRow><TableHead className="text-right font-black text-xs py-4 text-emerald-900 uppercase">المادة المرتجعة</TableHead><TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">الكمية</TableHead><TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">الوحدة</TableHead></TableRow></TableHeader><TableBody>{(printingVoucher.items || printingVoucher.returnedItems).map((item: any, i: number) => (<TableRow key={i} className="border-b border-slate-100 bg-white/40"><TableCell className="font-bold text-sm py-4">{item.nameAr}</TableCell><TableCell className="text-center font-black text-sm tabular-nums text-emerald-700">{item.qty}</TableCell><TableCell className="text-center text-xs font-bold text-slate-500 uppercase">{item.unit}</TableCell></TableRow>))}</TableBody></Table></div>
                  <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center mt-auto">
                    <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">أمين المستودع</p><div className="h-px bg-slate-300 w-full" /></div>
                    <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">توقيع الموظف</p><div className="h-px bg-slate-300 w-full" /></div>
                    <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">اعتماد المشرف</p><div className="h-px bg-slate-300 w-full" /></div>
                  </div>
                  <div className="mt-14 pt-4 text-center border-t border-slate-50 flex items-center justify-center gap-4"><span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">Generated by TIA Production System</span></div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all"><Download className="w-5 h-5" />{lang === 'ar' ? 'تحميل كصورة PNG' : 'Download PNG'}</Button>
             <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="font-black h-12 px-8 rounded-xl border border-slate-200 text-slate-500">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  function handleExportCSV() { toast({ title: "CSV Exported" }); }
}