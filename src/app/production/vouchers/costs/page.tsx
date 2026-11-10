
'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
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
  
  const [sortBy, setSortBy] = useState<'voucherNumber' | 'date' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Unified Form State (Single Item Approach)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    currency: 'YER',
    orderId: '',
    recipient: '',
    supervisorId: '',
    description: '',
    totalAmount: 0,
    notes: '',
    invoicePhotoUrl: ''
  });

  const costCategories = [
    { value: 'electricity', labelAr: 'كهرباء', icon: <Zap className="w-3.5 h-3.5" /> },
    { value: 'internet', labelAr: 'انترنت', icon: <Hash className="w-3.5 h-3.5" /> },
    { value: 'maintenance', labelAr: 'صيانة', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'spare_parts', labelAr: 'قطع غيار', icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'rent', labelAr: 'إيجار', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'communications', labelAr: 'اتصالات', icon: <Hash className="w-3.5 h-3.5" /> },
    { value: 'transport', labelAr: 'نقل', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'marketing', labelAr: 'تسويق', icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'design', labelAr: 'تصميم', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'photography', labelAr: 'تصوير', icon: <Tag className="w-3.5 h-3.5" /> },
    { value: 'training', labelAr: 'تدريب', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { value: 'services', labelAr: 'خدمات', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { value: 'other', labelAr: 'أخرى', icon: <Receipt className="w-3.5 h-3.5" /> },
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
    return result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'date') return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
      if (sortBy === 'totalAmount') return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [vouchers, search, categoryFilter, sortBy, sortOrder]);

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
      toast({ variant: "destructive", title: lang === 'ar' ? "يرجى إكمال البيانات المطلوبة" : "Please complete required fields" });
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
        toast({ title: lang === 'ar' ? "تم التحديث بنجاح" : "Updated Successfully" });
      } else {
        const voucherNumber = `CST-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, 'vouchers'), { ...voucherData, voucherNumber, createdAt: serverTimestamp() });
        toast({ title: lang === 'ar' ? "تم تسجيل السند بنجاح" : "Voucher Recorded" });
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
      currency: 'YER', 
      orderId: '', 
      recipient: '', 
      supervisorId: '', 
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
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true, fontEmbedCSS: '' });
      const link = document.createElement('a');
      link.download = `Cost-${printingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally { setIsDownloading(false); }
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
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* HEADER SECTION */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg"><Receipt className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'المالية' : 'Accounting'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'سند تكاليف تشغيلية' : 'Overhead Costs'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{lang === 'ar' ? 'إدارة المصاريف والتشغيل' : 'Expense Master'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} className={`${dir === 'rtl' ? "pr-10" : "pl-10"} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`} />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" /> {lang === 'ar' ? 'سند تكاليف جديد' : 'New Cost Voucher'}
            </Button>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 no-scrollbar">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table className="text-right border-separate border-spacing-0">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>
                   <button onClick={() => toggleSort('voucherNumber')} className="flex items-center gap-2">REF #{sortBy === 'voucherNumber' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</button>
                </TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>
                   <button onClick={() => toggleSort('date')} className="flex items-center gap-2">DATE {sortBy === 'date' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</button>
                </TableHead>
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'البيان والمستفيد' : 'RECIPIENT'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'التصنيف' : 'CATEGORY'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">
                   <button onClick={() => toggleSort('totalAmount')} className="flex items-center gap-2 mx-auto">TOTAL {sortBy === 'totalAmount' ? (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</button>
                </TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-400 animate-pulse">جاري التحميل...</TableCell></TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 font-bold text-slate-300">لا توجد سجلات</TableCell></TableRow>
              ) : filteredVouchers.map((v) => (
                <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
                  <TableCell className={cn("px-6 py-3 font-black text-slate-900 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.voucherNumber}</TableCell>
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-500 text-xs tabular-nums", dir === 'rtl' ? "text-right" : "text-left")}>{v.date}</TableCell>
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">{v.description}</span>
                      <span className="text-[10px] text-slate-400 font-bold">إلى: {v.recipient}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <Badge variant="outline" className="bg-slate-50 text-slate-400 font-black uppercase text-[10px]">{costCategories.find(c => c.value === v.category)?.labelAr || v.category}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center font-black text-emerald-700 tabular-nums">
                    {(v.totalAmount || 0).toLocaleString('en-US')} <span className="text-[9px] text-slate-400 uppercase ms-1">{v.currency}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPrintingVoucher(v)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"><Eye className="w-4 h-4" /></Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={() => handleEditVoucher(v)} className="gap-2 font-bold py-2 cursor-pointer text-xs"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل السند' : 'Edit Voucher'}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingVoucher(v)} className="gap-2 font-bold py-2 text-rose-600 cursor-pointer text-xs"><Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للمهملات' : 'Move to Trash'}</DropdownMenuItem>
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

      {/* ADD/EDIT DIALOG (COMPACT & SCROLLABLE) */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[700px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-5 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-lg font-black flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-300" />
                {editingVoucherId ? (lang === 'ar' ? 'تعديل سند المصروف' : 'Update Expenditure') : (lang === 'ar' ? 'تسجيل سند مصروفات تشغيلية' : 'New Overhead Expenditure')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[9px] uppercase mt-1">Single entry expense allocation for better tracking</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="bg-white flex flex-col max-h-[85vh]">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 text-right">
                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-emerald-600" /> DATE</Label>
                        <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-10 bg-slate-50 font-bold text-xs" required />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Tag className="w-3 h-3 text-emerald-600" /> CATEGORY</Label>
                        <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none">
                           {costCategories.map(c => <option key={c.value} value={c.value}>{c.labelAr}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Workflow className="w-3 h-3 text-emerald-600" /> BATCH (OPTIONAL)</Label>
                      <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none">
                         <option value="">-- عام (غير مرتبط بطلب) --</option>
                         {allOrders?.filter(o => o.status !== 'deleted').map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><UserCheck className="w-3 h-3 text-emerald-600" /> PERSONNEL</Label>
                      <select value={formData.supervisorId} onChange={(e) => setFormData({...formData, supervisorId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold outline-none" required>
                         <option value="">-- اختر المسؤول عن الصرف --</option>
                         {allWorkers?.filter(w => w.status !== 'deleted').map(w => <option key={w.id} value={w.id}>{w.fullName} ({w.isSupervisor ? 'مشرف' : 'موظف'})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 block text-center">ATTACHMENT / صورة السند</Label>
                    <div 
                      onClick={() => !isCompressing && fileInputRef.current?.click()}
                      className="w-full aspect-video md:aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer group hover:bg-slate-100 transition-all overflow-hidden relative"
                    >
                      {formData.invoicePhotoUrl ? (
                        <img src={formData.invoicePhotoUrl} className="w-full h-full object-cover" alt="invoice" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-emerald-500">
                          {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
                          <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'ar' ? 'انقر للرفع' : 'Upload'}</span>
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
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-black uppercase text-emerald-700">PAID TO / المستفيد</Label>
                    <Input value={formData.recipient} onChange={(e) => setFormData({...formData, recipient: e.target.value})} className="h-10 bg-white border-emerald-200 font-bold text-xs" placeholder="مثال: شركة الكهرباء / اسم المورد" required />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-black uppercase text-emerald-700">DESCRIPTION / البيان</Label>
                    <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="h-10 bg-white border-emerald-200 font-bold text-xs" placeholder="مثال: قيمة فاتورة شهر أكتوبر" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-right">
                       <Label className="text-[10px] font-black uppercase text-emerald-700">AMOUNT / القيمة</Label>
                       <div className="relative">
                          <Input type="number" step="any" value={formData.totalAmount || ''} onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})} className="h-12 font-black text-xl text-center tabular-nums bg-white border-emerald-200 text-emerald-700" required />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="h-8 px-1 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-black outline-none">
                               <option value="YER">YER</option><option value="SAR">SAR</option><option value="USD">USD</option>
                            </select>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                       <Label className="text-[10px] font-black uppercase text-slate-400">NOTES / ملاحظات</Label>
                       <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-12 bg-white border-slate-200 text-[11px] font-bold" />
                    </div>
                  </div>
                </div>

              </div>
            </ScrollArea>

            <div className="flex-none p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button type="submit" disabled={isSubmitting || isCompressing || formData.totalAmount <= 0} className="flex-1 h-12 premium-gradient text-white rounded-lg font-black text-sm shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'ترحيل سند المصروف' : 'Post Cost Voucher'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-6 h-12 font-black text-slate-400 rounded-lg">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT PREVIEW */}
      <Dialog open={!!printingVoucher} onOpenChange={(open) => !open && setPrintingVoucher(null)}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>معاينة سند صرف مصاريف</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-12 bg-white relative z-0" id="printable-voucher">
              {printingVoucher && (
                <div className="flex flex-col text-slate-900 font-sans relative overflow-hidden" dir="rtl">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.04] pointer-events-none -z-10"><img src="/images/logo.png" className="w-full h-full object-contain grayscale" /></div>
                   
                   <div className="grid grid-cols-3 items-center border-b-[6px] border-emerald-800 pb-8 mb-8 relative z-10">
                      <div className="text-right space-y-1">
                        <h2 className="text-xl font-black text-emerald-900 leading-tight">جمعية الصناعات النسيجية</h2>
                        <p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة - اليمن</p>
                        <p className="text-[11px] font-bold text-slate-400 tabular-nums" dir="ltr">0777 263 091 | nseeg202020@gmail.com</p>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-24 h-24 border-2 border-emerald-800/10 rounded-full flex items-center justify-center p-2"><img src="/images/logo.png" className="w-full h-full object-contain" /></div>
                      </div>
                      <div className="text-left space-y-1" dir="ltr">
                        <h2 className="text-[14px] font-black text-emerald-900 uppercase">Textile Industries Association</h2>
                        <p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa</p>
                        <p className="text-[10px] font-bold text-slate-400 tabular-nums">0777 263 091 | nseeg202020@gmail.com</p>
                      </div>
                    </div>

                    <div className="text-center mb-10 relative z-10">
                      <div className="inline-block border-[2.5px] border-emerald-800 px-12 py-2 rounded-full bg-white shadow-sm ring-4 ring-emerald-50">
                        <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest">{lang === 'ar' ? 'سند صرف تكاليف تشغيلية' : 'Overhead Cost Voucher'}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10 bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 relative z-10">
                       <div className="space-y-4">
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'المستفيد' : 'Paid To'}</span>
                             <span className="text-sm font-black text-slate-900">{printingVoucher.recipient}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تصنيف المصروف' : 'Expense Category'}</span>
                             <span className="text-sm font-black text-slate-700">{costCategories.find(c => c.value === printingVoucher.category)?.labelAr || printingVoucher.category}</span>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'رقم السند' : 'Ref No.'}</span>
                             <span className="text-sm font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'الدفعة المرتبطة' : 'Linked Batch'}</span>
                             <span className="text-sm font-black text-slate-700 truncate">{allOrders?.find(o => o.id === printingVoucher.orderId)?.orderNumber || (lang === 'ar' ? 'مصروف إداري عام' : 'General Admin Expense')}</span>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تاريخ الصرف' : 'Payment Date'}</span>
                             <span className="text-sm font-black text-slate-700 tabular-nums">{printingVoucher.date}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'المسؤول / المشرف' : 'Authorized By'}</span>
                             <span className="text-sm font-black text-slate-700">{allWorkers?.find(w => w.id === printingVoucher.supervisorId)?.fullName || '---'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mb-8 relative z-10">
                       <Table className="text-right border-2 border-emerald-900/10">
                          <TableHeader className="bg-emerald-900/5">
                             <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                                <TableHead className="text-right font-black text-xs py-4 text-emerald-900 uppercase">DESCRIPTION / البيان</TableHead>
                                <TableHead className="text-center font-black text-xs py-4 text-emerald-900 uppercase">AMOUNT / القيمة</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             <TableRow className="bg-white/40 border-b border-slate-100">
                                <TableCell className="py-6 px-6">
                                   <div className="flex flex-col gap-1">
                                      <span className="font-black text-base text-slate-900">{printingVoucher.description}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{printingVoucher.notes || '---'}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center font-black text-xl text-emerald-700 tabular-nums">{(printingVoucher.totalAmount || 0).toLocaleString('en-US')} <span className="text-xs opacity-60">{printingVoucher.currency}</span></TableCell>
                             </TableRow>
                             <TableRow className="bg-emerald-900 text-white">
                                <TableCell className="px-6 py-4 font-black text-sm uppercase tracking-widest">{lang === 'ar' ? 'إجمالي السند نقداً' : 'TOTAL AMOUNT IN CASH'}</TableCell>
                                <TableCell className="text-center font-black text-2xl tabular-nums">{(printingVoucher.totalAmount || 0).toLocaleString('en-US')} <span className="text-xs opacity-70">{printingVoucher.currency}</span></TableCell>
                             </TableRow>
                          </TableBody>
                       </Table>
                    </div>

                    {printingVoucher.invoicePhotoUrl && (
                      <div className="mb-12 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative z-10">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 text-center">{lang === 'ar' ? 'صورة المرفق / الفاتورة الأصلية' : 'ATTACHED INVOICE PHOTO'}</h4>
                        <img src={printingVoucher.invoicePhotoUrl} className="w-full h-auto rounded-xl shadow-lg border-4 border-white" />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100 text-center relative z-10 mt-auto">
                      <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'أمين الصندوق' : 'Cashier'}</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature / التاريخ</p></div>
                      <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'المستلم' : 'Recipient'}</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Full Name & Sign</p></div>
                      <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'اعتماد الإدارة' : 'Authorization'}</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Authorized Seal</p></div>
                    </div>
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

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingVoucher} onOpenChange={() => setDeletingVoucher(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-950 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner"><History className="w-8 h-8 text-red-500" /></div>
            <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'إلغاء السند المالي' : 'Cancel Transaction'}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
              {lang === 'ar' ? 'تحذير: سيتم إلغاء السند وعكس أثره على الحسابات وتكاليف الإنتاج فوراً.' : 'Warning: This will reverse the fiscal impact on accounting and production costs.'}
            </AlertDialogDescription>
          </div>
          <div className="bg-white p-6 flex gap-3">
             <AlertDialogAction onClick={async () => { if (!db || !deletingVoucher) return; await updateDoc(doc(db, 'vouchers', deletingVoucher.id), { status: 'deleted', deletedAt: serverTimestamp() }); setDeletingVoucher(null); toast({ title: lang === 'ar' ? "تم الإلغاء" : "Reversed" }); }} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black">Confirm</AlertDialogAction>
             <AlertDialogCancel className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
