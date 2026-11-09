
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
  User,
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
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
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
import { toPng } from 'html-to-image';

export default function MaterialReturnPage() {
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
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'totalItems'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    workerId: '',
    notes: '',
    items: [] as any[]
  });

  // Current Item Selection State
  const [currentItem, setCurrentItem] = useState({ id: '', qty: 1 });

  // Fetch Data
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const materialsQuery = useMemo(() => !db ? null : collection(db, 'materials'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_return')), [db]);
  const issueQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('type', '==', 'material_issue')), [db]);

  const { data: allOrders } = useCollection<any>(ordersQuery);
  const { data: allWorkers } = useCollection<any>(workersQuery);
  const { data: allMaterials } = useCollection<any>(materialsQuery);
  const { data: allIssues } = useCollection<any>(issueQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);

  const activeOrders = useMemo(() => (allOrders || []).filter(o => o.status !== 'deleted'), [allOrders]);
  
  // Only show workers who actually have open material issues for the selected order
  const relevantWorkers = useMemo(() => {
    if (!formData.orderId || !allWorkers || !allIssues) return [];
    const workerIds = allIssues
      .filter(i => i.orderId === formData.orderId && i.status === 'posted')
      .map(i => i.workerId);
    return allWorkers.filter(w => workerIds.includes(w.id));
  }, [formData.orderId, allWorkers, allIssues]);

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
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [vouchers, allOrders, allWorkers, search, batchFilter, sortBy, sortOrder]);

  const handleAddItem = () => {
    if (!currentItem.id || currentItem.qty <= 0) return;
    const material = allMaterials?.find(m => m.id === currentItem.id);
    if (!material) return;

    const existingIdx = formData.items.findIndex(i => i.id === currentItem.id);
    if (existingIdx > -1) {
      const newItems = [...formData.items];
      newItems[existingIdx].qty += currentItem.qty;
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({ 
        ...formData, 
        items: [...formData.items, { ...material, qty: currentItem.qty }] 
      });
    }
    setCurrentItem({ id: '', qty: 1 });
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting || formData.items.length === 0 || !formData.workerId) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);

    const voucherData = {
      ...formData,
      type: 'material_return',
      status: 'posted',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingVoucherId) {
        // Reverse old stock impact
        const oldSnap = await getDoc(doc(db, 'vouchers', editingVoucherId));
        oldSnap.data()?.items.forEach((item: any) => {
          const mat = allMaterials?.find(m => m.id === item.id);
          if (mat) batch.update(doc(db, 'materials', item.id), { currentQty: Math.max(0, mat.currentQty - item.qty) });
        });
        batch.update(doc(db, 'vouchers', editingVoucherId), voucherData);
      } else {
        const voucherNumber = `MRV-${Date.now().toString().slice(-6)}`;
        batch.set(doc(collection(db, 'vouchers')), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
      }

      // Add to stock
      formData.items.forEach(item => {
        const mat = allMaterials?.find(m => m.id === item.id);
        if (mat) batch.update(doc(db, 'materials', item.id), { currentQty: (mat.currentQty || 0) + item.qty });
      });

      await batch.commit();
      toast({ title: lang === 'ar' ? "تم ترحيل السند وتحديث المخزن" : "Voucher Posted & Stock Updated" });
      resetDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !printingVoucher) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Return-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVoucherId(null);
    setFormData({ date: new Date().toISOString().split('T')[0], orderId: '', workerId: '', notes: '', items: [] });
    setCurrentItem({ id: '', qty: 1 });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><RefreshCcw className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المخازن' : 'Warehouse'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'توريد مرتجع مواد' : 'Material Returns'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'سندات إدخال المواد المرتجعة' : 'Material Return Inwards'}</h1>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
            <Plus className="w-4 h-4" /> {lang === 'ar' ? 'سند مرتجع جديد' : 'New Return'}
          </Button>
        </div>
      </div>

      {/* SEARCH & TABLE */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-3">
             <div className="relative flex-1">
                <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث باسم العامل أو رقم السند...' : 'Search returns...'} className={cn("h-10 bg-slate-50 border-none text-xs font-bold", dir === 'rtl' ? "pr-10" : "pl-10")} />
             </div>
          </div>
          <Table className="text-right border-separate border-spacing-0">
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase">{lang === 'ar' ? 'الموظف' : 'WORKER'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'الأصناف' : 'ITEMS'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center">{lang === 'ar' ? 'العمليات' : 'ACTIONS'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-300">لا توجد سندات مرتجعة</TableCell></TableRow>
              ) : filteredVouchers.map((v) => (
                <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                  <TableCell className="px-6 py-3 font-black text-slate-900 text-xs tabular-nums">{v.voucherNumber}</TableCell>
                  <TableCell className="px-6 py-3 font-bold text-slate-500 text-xs tabular-nums">{v.date}</TableCell>
                  <TableCell className="px-6 py-3 font-bold text-slate-700 text-xs">{allWorkers?.find(w => w.id === v.workerId)?.fullName || '---'}</TableCell>
                  <TableCell className="px-6 py-3 text-center"><Badge variant="outline" className="font-black tabular-nums">{v.items?.length || 0}</Badge></TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 text-slate-400 hover:text-emerald-600"><Eye className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
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
      </div>

      {/* NEW/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[850px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white"><RefreshCcw className="w-5 h-5 text-emerald-300" /> {editingVoucherId ? 'تعديل سند مرتجع' : 'سند توريد مرتجع مواد خام'}</DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">Official return of unused materials back into warehouse stock</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Workflow className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'أمر الإنتاج' : 'ORDER'}</Label>
                <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value, workerId: ''})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر الأمر --</option>
                  {activeOrders?.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><UserCheck className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'العامل المسلم للمواد' : 'WORKER'}</Label>
                <select value={formData.workerId} onChange={(e) => setFormData({...formData, workerId: e.target.value})} disabled={!formData.orderId} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none" required>
                  <option value="">-- اختر الموظف --</option>
                  {relevantWorkers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'تاريخ التوريد' : 'DATE'}</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
            </div>

            <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-4">
              <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Box className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إضافة المواد المرتجعة' : 'ADD RETURNED ITEMS'}</h3>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">ITEM</Label>
                  <select value={currentItem.id} onChange={(e) => setCurrentItem({...currentItem, id: e.target.value})} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold outline-none">
                    <option value="">-- اختر المادة --</option>
                    {allMaterials?.filter(m => m.status !== 'deleted').map(m => <option key={m.id} value={m.id}>{m.nameAr} ({m.unit})</option>)}
                  </select>
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500">QTY</Label>
                  <Input type="number" step="any" value={currentItem.qty || ''} onChange={(e) => setCurrentItem({...currentItem, qty: Number(e.target.value)})} className="h-10 font-bold" />
                </div>
                <Button type="button" onClick={handleAddItem} className="h-10 bg-emerald-600 text-white font-black text-xs px-6 rounded-md shadow-md">إضافة للقائمة</Button>
              </div>
              {formData.items.length > 0 && (
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                   <Table className="text-right">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-right text-[9px] font-black text-slate-500 uppercase">MATERIAL</TableHead>
                          <TableHead className="text-center text-[9px] font-black text-slate-500 uppercase">QTY</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, idx) => (
                          <TableRow key={idx} className="border-b border-slate-50">
                            <TableCell className="text-xs font-bold">{item.nameAr}</TableCell>
                            <TableCell className="text-center font-black tabular-nums">{item.qty} {item.unit}</TableCell>
                            <TableCell><button type="button" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">ملاحظات التوريد</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-11 bg-slate-50 text-xs" placeholder="حالة المواد المرتجعة، السبب..." />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || formData.items.length === 0 || !formData.workerId} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
                {editingVoucherId ? 'حفظ التعديلات' : 'ترحيل وتأكيد دخول المخزن'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT PREVIEW */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>سند توريد مرتجع</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col text-slate-900 font-sans" dir="rtl">
                  <div className="grid grid-cols-3 items-center border-b-[6px] border-emerald-800 pb-8 mb-8">
                    <div className="text-right space-y-1">
                      <h2 className="text-xl font-black text-emerald-900">جمعية الصناعات النسيجية</h2>
                      <p className="text-xs font-bold text-slate-500">الروضة - شبوة - اليمن</p>
                    </div>
                    <div className="flex justify-center"><img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" /></div>
                    <div className="text-left space-y-1" dir="ltr">
                      <h2 className="text-[14px] font-black text-emerald-900">Textile Industries Association</h2>
                      <p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa - Yemen</p>
                    </div>
                  </div>

                  <div className="text-center mb-10">
                    <div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm">
                      <h3 className="text-xl font-black text-emerald-900 uppercase">سند توريد مرتجع مواد خام</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <div className="space-y-3">
                      <p className="flex justify-between border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400">اسم الموظف (المسلم)</span> <span className="text-sm font-black">{allWorkers?.find(w => w.id === printingVoucher.workerId)?.fullName}</span></p>
                      <p className="flex justify-between border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400">رقم السند</span> <span className="text-sm font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</span></p>
                    </div>
                    <div className="space-y-3">
                      <p className="flex justify-between border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400">تاريخ التوريد</span> <span className="text-sm font-black tabular-nums">{printingVoucher.date}</span></p>
                      <p className="flex justify-between border-b border-slate-200 pb-1"><span className="text-[10px] font-black text-slate-400">الدفعة المرجعية</span> <span className="text-sm font-black">{allOrders?.find(o => o.id === printingVoucher.orderId)?.title}</span></p>
                    </div>
                  </div>

                  <Table className="text-right border-2 border-emerald-900/10 mb-12">
                    <TableHeader className="bg-emerald-900/5">
                      <TableRow><TableHead className="text-right font-black text-xs py-4 text-emerald-900">المادة المرتجعة</TableHead><TableHead className="text-center font-black text-xs py-4 text-emerald-900">الكمية المسلمة</TableHead><TableHead className="text-center font-black text-xs py-4 text-emerald-900">الوحدة</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {printingVoucher.items.map((item: any, i: number) => (
                        <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                          <TableCell className="font-bold text-sm py-4">{item.nameAr}</TableCell>
                          <TableCell className="text-center font-black text-sm tabular-nums text-emerald-700">{item.qty}</TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-500 uppercase">{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center mt-auto">
                    <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase">أمين المستودع (المستلم)</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /></div>
                    <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase">الموظف (المسلم)</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /></div>
                    <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase">اعتماد المشرف</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-12 px-10 rounded-xl shadow-xl hover:opacity-90 transition-all">
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} تحميل PNG
             </Button>
             <Button variant="ghost" onClick={() => setPrintingVoucher(null)} className="h-12 px-8 rounded-xl border border-slate-200 font-black text-slate-500">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner"><History className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">إلغاء سند المرتجع</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">تحذير: سيتم خصم الكميات من المخزن تلقائياً وإعادة فتح "العهدة" على الموظف.</AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
            <AlertDialogAction onClick={async () => {
              if (!db || !deletingVoucher) return;
              const batch = writeBatch(db);
              deletingVoucher.items.forEach((item: any) => {
                const mat = allMaterials?.find(m => m.id === item.id);
                if (mat) batch.update(doc(db, 'materials', item.id), { currentQty: Math.max(0, mat.currentQty - item.qty) });
              });
              batch.update(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() });
              await batch.commit();
              setDeletingVoucher(null);
              toast({ title: "تم إلغاء السند وتعديل المخزن" });
            }} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingVoucher(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">تراجع</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
