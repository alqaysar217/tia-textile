
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
  RefreshCcw
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

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    currency: 'YER',
    orderId: '',
    recipient: '',
    supervisorId: '',
    notes: '',
    invoicePhotoUrl: '',
    items: [] as any[]
  });

  // Current Item Selection State
  const [currentItem, setCurrentItem] = useState({
    category: 'other',
    description: '',
    amount: 0
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
        v.recipient?.toLowerCase().includes(s)
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

  const handleAddItem = () => {
    if (!currentItem.description || currentItem.amount <= 0) return;
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { ...currentItem }]
    }));
    setCurrentItem({ category: 'other', description: '', amount: 0 });
  };

  const removeItem = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== idx)
    }));
  };

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
    if (!db || isSubmitting || !formData.items || formData.items.length === 0) {
      toast({ variant: "destructive", title: lang === 'ar' ? "يرجى إضافة بند تكلفة واحد على الأقل" : "Please add at least one expense item" });
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
      const voucherData = {
        ...formData,
        totalAmount,
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
    setFormData({ date: new Date().toISOString().split('T')[0], category: 'other', currency: 'YER', orderId: '', recipient: '', supervisorId: '', notes: '', invoicePhotoUrl: '', items: [] });
    setCurrentItem({ category: 'other', description: '', amount: 0 });
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
    setFormData({ 
      ...v, 
      items: v.items || [] // Safeguard: ensure items is always an array
    });
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
                <TableHead className={cn("px-6 py-4 font-black text-[10px] text-slate-500 uppercase border-b border-slate-200", dir === 'rtl' ? "text-right" : "text-left")}>{lang === 'ar' ? 'المستفيد' : 'RECIPIENT'}</TableHead>
                <TableHead className="px-6 py-4 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'البنود' : 'ITEMS'}</TableHead>
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
                  <TableCell className={cn("px-6 py-3 font-bold text-slate-700 text-xs", dir === 'rtl' ? "text-right" : "text-left")}>{v.recipient || '---'}</TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <Badge variant="outline" className="bg-slate-50 text-slate-400 font-black tabular-nums">{v.items?.length || 0}</Badge>
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

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-[900px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-300" />
                {editingVoucherId ? (lang === 'ar' ? 'تعديل سند تكاليف' : 'Update Cost Voucher') : (lang === 'ar' ? 'تسجيل سند مصاريف وتكاليف تشغيل' : 'New Overhead Expenditure')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase mt-1">Multi-item expense allocation with attachment support</p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveVoucher} className="p-6 space-y-6 bg-white max-h-[85vh] overflow-y-auto no-scrollbar">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Core Info */}
              <div className="md:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-black uppercase text-slate-400">PAID TO / المستفيد</Label>
                    <Input value={formData.recipient} onChange={(e) => setFormData({...formData, recipient: e.target.value})} className="h-11 bg-slate-50 font-bold" placeholder="اسم الجهة أو الشخص" required />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-black uppercase text-slate-400">DATE / التاريخ</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-black uppercase text-slate-400">BATCH / الدفعة المرتبطة (اختياري)</Label>
                    <select value={formData.orderId} onChange={(e) => setFormData({...formData, orderId: e.target.value})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold">
                       <option value="">-- تكلفة عامة --</option>
                       {allOrders?.filter(o => o.status !== 'deleted').map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Label className="text-[10px] font-black uppercase text-slate-400">SUPERVISOR / المسؤول</Label>
                    <select value={formData.supervisorId} onChange={(e) => setFormData({...formData, supervisorId: e.target.value})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold" required>
                       <option value="">-- اختر المسؤول --</option>
                       {allWorkers?.filter(w => w.status !== 'deleted' && (w.isSupervisor || w.active)).map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Invoice Photo */}
              <div className="md:col-span-4 flex flex-col items-center gap-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400">INVOICE PHOTO / صورة الفاتورة</Label>
                 <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer group hover:bg-slate-100 transition-all overflow-hidden relative"
                 >
                    {formData.invoicePhotoUrl ? (
                      <img src={formData.invoicePhotoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-emerald-500">
                        {isCompressing ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'انقر للرفع' : 'Upload'}</span>
                      </div>
                    )}
                    {formData.invoicePhotoUrl && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <RefreshCcw className="w-6 h-6 text-white" />
                      </div>
                    )}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>

            {/* EXPENSE ITEMS ADDITION */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
              <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2"><PlusCircle className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إضافة بنود المصاريف في هذا السند' : 'Add Line Items to this Voucher'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3 space-y-1.5 text-right">
                  <Label className="text-[9px] font-bold text-slate-500">CATEGORY</Label>
                  <select value={currentItem.category} onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})} className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-lg text-xs font-bold">
                     {costCategories.map(c => <option key={c.value} value={c.value}>{c.labelAr}</option>)}
                  </select>
                </div>
                <div className="md:col-span-5 space-y-1.5 text-right">
                  <Label className="text-[9px] font-bold text-slate-500">DESCRIPTION / البيان</Label>
                  <Input value={currentItem.description} onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})} className="h-10 bg-white text-xs font-bold" placeholder="مثال: فاتورة كهرباء المعرض" />
                </div>
                <div className="md:col-span-2 space-y-1.5 text-right">
                  <Label className="text-[9px] font-bold text-slate-500">AMOUNT</Label>
                  <Input type="number" value={currentItem.amount || ''} onChange={(e) => setCurrentItem({...currentItem, amount: Number(e.target.value)})} className="h-10 bg-white font-black tabular-nums text-center text-emerald-700" />
                </div>
                <Button type="button" onClick={handleAddItem} className="md:col-span-2 h-10 bg-emerald-600 text-white font-black text-xs rounded-lg shadow-md border-none"><Plus className="w-3.5 h-3.5 me-1" /> {lang === 'ar' ? 'إضافة البند' : 'Add'}</Button>
              </div>

              {(formData.items?.length || 0) > 0 && (
                <div className="border border-emerald-100 rounded-xl overflow-hidden shadow-sm bg-white">
                  <Table className="text-right">
                    <TableHeader className="bg-emerald-50">
                      <TableRow>
                        <TableHead className="px-4 py-2 text-[9px] font-black text-emerald-700 uppercase">CATEGORY</TableHead>
                        <TableHead className="px-4 py-2 text-[9px] font-black text-emerald-700 uppercase">DESCRIPTION</TableHead>
                        <TableHead className="px-4 py-2 text-[9px] font-black text-emerald-700 uppercase text-center">AMOUNT</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-emerald-50 bg-white group/row">
                          <TableCell className="text-[10px] font-black text-slate-500 uppercase">{costCategories.find(c => c.value === item.category)?.labelAr}</TableCell>
                          <TableCell className="text-xs font-bold text-slate-700">{item.description}</TableCell>
                          <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">{(item.amount).toLocaleString('en-US')}</TableCell>
                          <TableCell><button type="button" onClick={() => removeItem(idx)} className="text-rose-300 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-emerald-900/5">
                        <TableCell colSpan={2} className="px-6 py-4 font-black text-emerald-900 text-sm uppercase">GRAND TOTAL / الإجمالي النهائي</TableCell>
                        <TableCell className="text-center font-black text-xl text-emerald-700 tabular-nums">{(formData.items.reduce((s, i) => s + i.amount, 0)).toLocaleString('en-US')} <span className="text-xs">{formData.currency}</span></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5 text-right">
                  <Label className="text-[10px] font-black uppercase text-slate-400">CURRENCY / العملة</Label>
                  <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold px-3">
                     <option value="YER">YER - ريال يمني</option><option value="SAR">SAR - ريال سعودي</option><option value="USD">USD - دولار أمريكي</option>
                  </select>
               </div>
               <div className="space-y-1.5 text-right">
                  <Label className="text-[10px] font-black uppercase text-slate-400">GENERAL NOTES / ملاحظات عامة</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="h-11 bg-slate-50 font-bold" />
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !formData.items || formData.items.length === 0} className="flex-1 h-14 premium-gradient text-white rounded-xl font-black text-base shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <Save className="w-5 h-5 me-2" />}
                {lang === 'ar' ? 'ترحيل سند المصاريف' : 'Post Cost Voucher'}
              </Button>
              <Button type="button" variant="outline" onClick={resetDialog} className="px-8 h-14 font-black text-slate-400 rounded-xl">إلغاء</Button>
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
                      </div>
                      <div className="flex justify-center">
                        <div className="w-24 h-24 border-2 border-emerald-800/10 rounded-full flex items-center justify-center p-2"><img src="/images/logo.png" className="w-full h-full object-contain" /></div>
                      </div>
                      <div className="text-left space-y-1" dir="ltr">
                        <h2 className="text-[14px] font-black text-emerald-900 uppercase">Textile Industries Association</h2>
                        <p className="text-[11px] font-bold text-slate-500">Al-Rawdah - Shabwa</p>
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
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'المستفيد' : 'Recipient'}</span>
                             <span className="text-sm font-black text-slate-900">{printingVoucher.recipient}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'التصنيف الرئيسي' : 'Primary Category'}</span>
                             <span className="text-sm font-black text-slate-700">{costCategories.find(c => c.value === printingVoucher.category)?.labelAr}</span>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'رقم السند' : 'Ref No.'}</span>
                             <span className="text-sm font-black text-emerald-900 tabular-nums">{printingVoucher.voucherNumber}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'الدفعة المرتبطة' : 'Linked Batch'}</span>
                             <span className="text-sm font-black text-slate-700 truncate">{allOrders?.find(o => o.id === printingVoucher.orderId)?.orderNumber || (lang === 'ar' ? 'عام' : 'General')}</span>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'تاريخ الصرف' : 'Date'}</span>
                             <span className="text-sm font-black text-slate-700 tabular-nums">{printingVoucher.date}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'ar' ? 'المشرف المسؤول' : 'Supervisor'}</span>
                             <span className="text-sm font-black text-slate-700">{allWorkers?.find(w => w.id === printingVoucher.supervisorId)?.fullName || '---'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mb-8 relative z-10">
                       <Table className="text-right border-2 border-emerald-900/10">
                          <TableHeader className="bg-emerald-900/5">
                             <TableRow className="hover:bg-transparent border-b-2 border-emerald-900/20">
                                <TableHead className="text-right font-black text-xs py-4 text-emerald-900">EXPENSE / المصروف</TableHead>
                                <TableHead className="text-center font-black text-xs py-4 text-emerald-900">AMOUNT / المبلغ</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {printingVoucher.items?.map((item: any, i: number) => (
                               <TableRow key={i} className="bg-white/40 border-b border-slate-100">
                                  <TableCell className="py-4">
                                     <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-800">{item.description}</span>
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">{costCategories.find(c => c.value === item.category)?.labelAr}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-center font-black text-sm text-emerald-700 tabular-nums">{(item.amount).toLocaleString('en-US')}</TableCell>
                               </TableRow>
                             ))}
                             <TableRow className="bg-emerald-900 text-white">
                                <TableCell className="px-6 py-4 font-black text-sm uppercase tracking-widest">{lang === 'ar' ? 'إجمالي مبلغ السند' : 'GRAND TOTAL'}</TableCell>
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
                      <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'أمين الصندوق' : 'Cashier'}</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Sign & Date</p></div>
                      <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'المستلم' : 'Recipient'}</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Signature</p></div>
                      <div className="space-y-12"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'اعتماد الإدارة' : 'General Manager'}</p><div className="h-px bg-slate-300 w-3/4 mx-auto" /><p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Authorized</p></div>
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

