'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft, 
  Workflow, 
  History, 
  FileText, 
  FileOutput, 
  FileInput, 
  HandCoins, 
  ChevronRight, 
  Target, 
  Clock, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  ShoppingBag,
  Info,
  Loader2,
  Plus,
  ShieldCheck,
  Calendar,
  Zap,
  LayoutGrid,
  BarChart3,
  ClipboardList,
  Type,
  User,
  ArrowUpRight,
  Edit2,
  Activity,
  Layers,
  Save,
  Tag,
  Search,
  Filter,
  RefreshCcw,
  Wallet,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Check,
  Eye,
  Download,
  Printer,
  FileDown,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';

export default function OrderDetailsDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const { lang, dir } = useTranslation();
  const db = useFirestore();

  // Tab State: 'info' | 'summary' | stageId
  const [activeTab, setActiveTab] = useState<string>('info');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Stage View Local Filters
  const [stageSearch, setStageSearch] = useState('');
  const [stageTypeFilter, setStageTypeFilter] = useState<'all' | 'material_issue' | 'production_receipt' | 'wage_payment'>('all');
  const [stageCurrencyFilter, setStageCurrencyFilter] = useState<string>('all');
  const [stageSortOrder, setStageSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch Data
  const orderRef = useMemo(() => !db ? null : doc(db, 'productionOrders', id as string), [db, id]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('orderId', '==', id)), [db, id]);
  const deptsQuery = useMemo(() => !db ? null : query(collection(db, 'departments'), where('status', '!=', 'deleted')), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);

  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);
  const { data: rawVouchers, loading: vouchersLoading } = useCollection<any>(vouchersQuery);
  const { data: departments, loading: deptsLoading } = useCollection<any>(deptsQuery);
  const { data: workers } = useCollection<any>(workersQuery);
  const { data: products } = useCollection<any>(productsQuery);

  // Edit Form State
  const [editFormData, setEditFormDate] = useState({
    title: '',
    productId: '',
    targetQty: 0,
    priority: 'normal',
    notes: ''
  });

  const handleOpenEdit = () => {
    if (!order) return;
    setEditFormDate({
      title: order.title || '',
      productId: order.productId || '',
      targetQty: order.targetQty || 0,
      priority: order.priority || 'normal',
      notes: order.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !order || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'productionOrders', order.id), {
        ...editFormData,
        targetQty: Number(editFormData.targetQty),
        updatedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم تحديث البيانات بنجاح" : "Order Updated Successfully" });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vouchers = useMemo(() => {
    if (!rawVouchers) return [];
    return [...rawVouchers].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [rawVouchers]);

  const product = useMemo(() => products?.find(p => p.id === order?.productId), [products, order]);

  // Calculations for Stats
  const finalStage = useMemo(() => departments?.[departments.length - 1], [departments]);
  const finalCompletedQty = useMemo(() => {
    if (!vouchers || !finalStage) return 0;
    return vouchers
      .filter(v => v.type === 'production_receipt' && v.currentStageId === finalStage.id && v.status !== 'deleted')
      .reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
  }, [vouchers, finalStage]);

  const totalProgress = useMemo(() => {
    if (!order?.targetQty) return 0;
    return Math.round((finalCompletedQty / order.targetQty) * 100);
  }, [finalCompletedQty, order]);

  const filteredStageVouchers = useMemo(() => {
    if (!vouchers || activeTab === 'info' || activeTab === 'summary') return [];
    
    let list = vouchers.filter(v => {
      if (v.status === 'deleted') return false;
      
      // Basic stage filtering
      let isInStage = false;
      if (v.type === 'production_receipt') {
        // Direct link in PRVs
        isInStage = v.currentStageId === activeTab;
      } else {
        // Indirect link via Worker's Dept for MIVs and PAYs
        const worker = workers?.find(w => w.id === v.workerId);
        isInStage = worker?.departmentId === activeTab;
      }
      
      if (!isInStage) return false;

      // Type Filter
      if (stageTypeFilter !== 'all' && v.type !== stageTypeFilter) return false;

      // Currency Filter
      if (stageCurrencyFilter !== 'all' && v.currency !== stageCurrencyFilter) return false;

      // Search Filter
      if (stageSearch) {
        const s = stageSearch.toLowerCase();
        const worker = workers?.find(w => w.id === v.workerId);
        return v.voucherNumber?.toLowerCase().includes(s) || 
               worker?.fullName?.toLowerCase().includes(s) ||
               v.notes?.toLowerCase().includes(s);
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime();
      const timeB = new Date(b.date || 0).getTime();
      return stageSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [vouchers, activeTab, workers, stageSearch, stageTypeFilter, stageCurrencyFilter, stageSortOrder]);

  const handleExportStageCSV = () => {
    const headers = [
      lang === 'ar' ? 'التاريخ' : 'Date',
      lang === 'ar' ? 'رقم السند' : 'Reference',
      lang === 'ar' ? 'النوع' : 'Type',
      lang === 'ar' ? 'الموظف' : 'Personnel',
      lang === 'ar' ? 'القيمة' : 'Value',
      lang === 'ar' ? 'العملة' : 'Currency'
    ];

    const rows = filteredStageVouchers.map(v => {
      const worker = workers?.find(w => w.id === v.workerId);
      const val = v.type === 'production_receipt' ? (v.qtyAccepted || 0) : (v.totalAmount || 0);
      return [
        v.date,
        v.voucherNumber,
        v.type,
        worker?.fullName || '---',
        val,
        v.currency || (v.type === 'production_receipt' ? 'Pcs' : '---')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stage_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: lang === 'ar' ? "تم تصدير سجل المرحلة" : "Stage Ledger Exported" });
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('printable-voucher');
    if (!element || !viewingVoucher) return;
    
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `Voucher-${viewingVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: lang === 'ar' ? "تم تحميل السند بنجاح" : "Voucher Downloaded" });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (orderLoading || deptsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">جاري فتح السجل الفني...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-xl font-black">{lang === 'ar' ? 'الأمر غير موجود' : 'Order Not Found'}</h2>
        <Button variant="outline" onClick={() => router.back()}>العودة للأوامر</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden" dir={dir}>
      
      {/* 1. ERP MASTER HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'أوامر الإنتاج' : 'Work Orders'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600 tabular-nums">{order.orderNumber}</span>
              </div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">{order.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</p>
                   <p className="text-xs font-black text-slate-700 tabular-nums">{order.targetQty}</p>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'الجاهز النهائي' : 'FINISHED'}</p>
                   <p className="text-xs font-black text-emerald-600 tabular-nums">{finalCompletedQty}</p>
                </div>
             </div>
             <Button onClick={handleOpenEdit} variant="outline" className="h-9 px-4 font-black gap-2 border-slate-200 text-slate-600 text-[11px] rounded-lg">
                <Edit2 className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'تعديل الأمر' : 'Edit Order'}
             </Button>
             <Button onClick={() => router.push(`/production/vouchers/issue?orderId=${order.id}`)} className="h-9 px-5 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 border-none text-[11px]">
                <Plus className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'عملية ميدانية' : 'New Transaction'}
             </Button>
          </div>
        </div>
      </div>

      {/* 2. STAGES NAVIGATION (SCROLLABLE) */}
      <div className="flex-none bg-slate-900 z-20 shadow-lg">
        <div className="flex items-center h-12 gap-1 overflow-x-auto no-scrollbar scroll-smooth px-4">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              "flex items-center gap-2 px-5 h-full transition-all whitespace-nowrap font-black text-[10px] uppercase tracking-wider relative shrink-0",
              activeTab === 'info' ? "bg-emerald-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'معلومات الدفعة' : 'Batch Info'}
          </button>

          <div className="h-4 w-px bg-white/10 shrink-0" />

          {departments?.map((dept, idx) => (
            <button
              key={dept.id}
              onClick={() => setActiveTab(dept.id)}
              className={cn(
                "flex items-center gap-2 px-5 h-full transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-wider relative group shrink-0",
                activeTab === dept.id 
                  ? "bg-emerald-600 text-white shadow-[inset_0_-3px_0_white]" 
                  : order.currentStageId === dept.id 
                    ? "text-emerald-400 bg-white/5"
                    : "text-white/40 hover:text-white/70"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded flex items-center justify-center text-[8px] font-black border",
                activeTab === dept.id ? "bg-emerald-500 border-white/20" : "bg-white/5 border-white/10"
              )}>
                {idx + 1}
              </span>
              <span>{dept.nameAr}</span>
            </button>
          ))}

          <div className="h-4 w-px bg-white/10 shrink-0" />

          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "flex items-center gap-2 px-5 h-full transition-all whitespace-nowrap font-black text-[10px] uppercase tracking-wider relative shrink-0",
              activeTab === 'summary' ? "bg-blue-600 text-white shadow-[inset_0_-3px_0_white]" : "text-white/40 hover:text-white/70"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'الملخص الإحصائي' : 'Batch Analytics'}
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC DATA LEDGER AREA */}
      <div className="flex-1 min-h-0 flex flex-col p-4 no-scrollbar">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* VIEW: BATCH DATA */}
          {activeTab === 'info' && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-300">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <ClipboardList className="w-4 h-4 text-emerald-600" />
                     {lang === 'ar' ? 'سجل المواصفات الفنية المعتمد' : 'MASTER BATCH LEDGER'}
                  </h3>
                  <Button onClick={handleOpenEdit} variant="outline" size="sm" className="h-8 text-[10px] font-black border-slate-200 rounded-md gap-2">
                     <Edit2 className="w-3 h-3" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Specs'}
                  </Button>
               </div>
               <div className="flex-1 overflow-auto">
                  <table className="w-full text-right border-separate border-spacing-0">
                     <tbody className="divide-y divide-slate-100">
                        <LedgerRow label={lang === 'ar' ? 'رقم السجل الموحد' : 'REFERENCE'} value={order.orderNumber} icon={<Hash className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'عنوان الدفعة' : 'BATCH TITLE'} value={order.title} icon={<Type className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'المنتج المستهدف' : 'PRODUCT'} value={product?.nameAr} icon={<ShoppingBag className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'} value={`${order.targetQty} قطعة`} icon={<Target className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'تاريخ البدء التشغيلي' : 'LAUNCH DATE'} value={order.startDate} icon={<Calendar className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الكمية المستلمة (نهائي)' : 'RECEIVED'} value={`${finalCompletedQty} قطعة`} icon={<CheckCircle2 className="w-4 h-4" />} color="text-emerald-700" />
                        <LedgerRow label={lang === 'ar' ? 'قيد العمل (WIP)' : 'WIP'} value={`${order.targetQty - finalCompletedQty} قطعة`} icon={<Package className="w-4 h-4" />} color="text-blue-600" />
                        <LedgerRow label={lang === 'ar' ? 'مستوى التقدم' : 'PROGRESS'} value={`${totalProgress}%`} icon={<Activity className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الأولوية التنظيمية' : 'PRIORITY'} value={order.priority} icon={<ShieldCheck className="w-4 h-4" />} />
                        <LedgerRow label={lang === 'ar' ? 'الحالة' : 'STATUS'} value={order.status} icon={<Tag className="w-4 h-4" />} />
                        {order.notes && (
                           <tr className="bg-slate-50/50">
                              <td className="px-6 py-5 w-72 font-black text-[10px] text-slate-400 uppercase border-l border-slate-100">{lang === 'ar' ? 'تعليمات وملاحظات' : 'INSTRUCTIONS'}</td>
                              <td className="px-6 py-5 text-xs font-bold text-slate-600 leading-relaxed italic">{order.notes}</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* VIEW: STAGE LEDGER (ACTION BAR + TABLE) */}
          {activeTab !== 'info' && activeTab !== 'summary' && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-hidden">
               {/* ENHANCED ERP ACTION BAR */}
               <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shadow-sm">
                  <div className="relative flex-1">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                    <Input 
                      value={stageSearch}
                      onChange={(e) => setStageSearch(e.target.value)}
                      placeholder={lang === 'ar' ? 'بحث في سجل المرحلة...' : 'Search stage log...'}
                      className={cn("h-9 bg-white text-xs font-bold border-slate-200", dir === 'rtl' ? "pr-9" : "pl-9")}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-1.5 border-x border-slate-200">
                    <Button 
                      onClick={handleExportStageCSV}
                      variant="ghost" 
                      size="sm" 
                      className="h-9 px-3 text-[10px] font-black gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                      {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 px-3 text-[10px] font-black gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200">
                          <Filter className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'تصفية' : 'Filter'}
                          {(stageTypeFilter !== 'all' || stageCurrencyFilter !== 'all') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-56 rounded-xl shadow-xl">
                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'نوع السند' : 'VOUCHER TYPE'}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('all')} className="text-xs font-bold flex justify-between cursor-pointer">
                          {lang === 'ar' ? 'الكل' : 'All Types'}
                          {stageTypeFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('material_issue')} className="text-xs font-bold flex justify-between cursor-pointer">
                          {lang === 'ar' ? 'صرف مواد' : 'Material Issue'}
                          {stageTypeFilter === 'material_issue' && <Check className="w-3 h-3 text-emerald-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('production_receipt')} className="text-xs font-bold flex justify-between cursor-pointer">
                          {lang === 'ar' ? 'استلام انتاج' : 'Production Receipt'}
                          {stageTypeFilter === 'production_receipt' && <Check className="w-3 h-3 text-emerald-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageTypeFilter('wage_payment')} className="text-xs font-bold flex justify-between cursor-pointer">
                          {lang === 'ar' ? 'صرف أجور' : 'Wage Payment'}
                          {stageTypeFilter === 'wage_payment' && <Check className="w-3 h-3 text-emerald-600" />}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'ar' ? 'حسب العملة' : 'CURRENCY'}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setStageCurrencyFilter('all')} className="text-xs font-bold flex justify-between cursor-pointer">
                          {lang === 'ar' ? 'جميع العملات' : 'All Currencies'}
                          {stageCurrencyFilter === 'all' && <Check className="w-3 h-3 text-emerald-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageCurrencyFilter('YER')} className="text-xs font-bold flex justify-between cursor-pointer">YER {stageCurrencyFilter === 'YER' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStageCurrencyFilter('SAR')} className="text-xs font-bold flex justify-between cursor-pointer">SAR {stageCurrencyFilter === 'SAR' && <Check className="w-3 h-3 text-emerald-600" />}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setStageSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="h-9 px-3 text-[10px] font-black gap-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                    >
                      {stageSortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
                      {lang === 'ar' ? 'ترتيب' : 'Sort'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                     {lang === 'ar' ? 'النتائج:' : 'COUNT:'} <span className="text-emerald-600">{filteredStageVouchers.length}</span>
                  </div>
               </div>

               <div className="flex-1 overflow-auto relative">
                  <Table className="text-right border-separate border-spacing-0">
                    <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'التاريخ' : 'DATE'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'رقم السند' : 'REF #'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'نوع العملية' : 'ACTIVITY'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'المسؤول / العامل' : 'PERSONNEL'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'البيان' : 'MEMO'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'القيمة / الأثر' : 'IMPACT'}</TableHead>
                        <TableHead className="px-6 py-3 border-b border-slate-200 w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStageVouchers.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-32 text-center text-slate-300 font-bold">لا توجد سجلات مطابقة</TableCell></TableRow>
                      ) : filteredStageVouchers.map((v) => (
                        <LedgerTransactionRow key={v.id} voucher={v} worker={workers?.find(w => w.id === v.workerId)} lang={lang} onView={(v) => setViewingVoucher(v)} />
                      ))}
                    </TableBody>
                  </Table>
               </div>
            </div>
          )}

          {/* VIEW: PERFORMANCE ANALYTICS */}
          {activeTab === 'summary' && (
            <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300">
               <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <BarChart3 className="w-4 h-4 text-emerald-400" />
                     {lang === 'ar' ? 'التحليل الإحصائي لخطوط الإنتاج' : 'MANUFACTURING PERFORMANCE ANALYTICS'}
                  </h3>
               </div>
               <div className="flex-1 overflow-auto">
                  <Table className="text-right border-separate border-spacing-0">
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-right border-b border-slate-200">{lang === 'ar' ? 'المرحلة / القسم' : 'WORK CENTER'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'المنجز (قطعة)' : 'COMPLETED'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'تكلفة الأجور' : 'WAGE COST'}</TableHead>
                        <TableHead className="px-6 py-3 font-black text-[10px] text-slate-500 uppercase text-center border-b border-slate-200">{lang === 'ar' ? 'الإنجاز' : 'PROGRESS'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map(d => {
                        const stageReceipts = vouchers.filter(v => v.currentStageId === d.id && v.type === 'production_receipt' && v.status !== 'deleted');
                        const done = stageReceipts.reduce((sum, v) => sum + (v.qtyAccepted || 0), 0);
                        const cost = stageReceipts.reduce((sum, v) => sum + (v.wageAmount || 0), 0);
                        const p = Math.round((done / (order.targetQty || 1)) * 100);
                        return (
                          <TableRow key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                             <TableCell className="px-6 py-4 font-black text-slate-900 text-xs">{d.nameAr}</TableCell>
                             <TableCell className="px-6 py-4 text-center font-bold text-slate-700 tabular-nums">{done.toLocaleString('en-US')}</TableCell>
                             <TableCell className="px-6 py-4 text-center font-black text-emerald-700 tabular-nums">{cost.toLocaleString('en-US')} YER</TableCell>
                             <TableCell className="px-6 py-4 text-center">
                                <div className="flex items-center gap-3 justify-center">
                                   <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-400 tabular-nums">{p}%</span>
                                </div>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* VOUCHER PREVIEW DIALOG (Restored Professional Style) */}
      <Dialog open={!!viewingVoucher} onOpenChange={(open) => !open && setViewingVoucher(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-white shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>معاينة السند</DialogTitle></DialogHeader>
          
          <ScrollArea className="max-h-[80vh]">
            <div className="p-10 bg-white relative z-0" id="printable-voucher">
              {viewingVoucher && (
                <div className="flex flex-col text-slate-900 font-sans relative" dir="rtl">
                  {/* WATERMARK */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none -z-10 select-none">
                    <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale" />
                  </div>

                  {/* PROFESSIONAL HEADER */}
                  <div className="grid grid-cols-3 items-center border-b-4 border-emerald-800 pb-6 mb-6">
                    <div className="text-center space-y-0.5">
                      <h2 className="text-base font-black text-emerald-900">جمعية الصناعات النسيجية</h2>
                      <p className="text-xs font-bold text-slate-500">الروضة - محافظة شبوة</p>
                    </div>
                    <div className="flex justify-center">
                      <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <div className="text-center space-y-0.5" dir="ltr">
                      <h2 className="text-[11px] font-black text-emerald-900">TIA Cooperative</h2>
                      <p className="text-[9px] font-bold text-slate-500">Shabwa - Yemen</p>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="inline-block border-2 border-emerald-800 px-8 py-1 rounded-full bg-white shadow-sm">
                      <h3 className="text-base font-black text-emerald-900 uppercase">
                        {viewingVoucher.type === 'material_issue' ? 'سند صرف مواد خام' : 
                         viewingVoucher.type === 'production_receipt' ? 'سند استلام وتسوية' : 'سند صرف أجور مالي'}
                      </h3>
                    </div>
                  </div>

                  {/* INFO GRID */}
                  <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'رقم السند' : 'REF #'}</p>
                       <p className="text-sm font-black text-emerald-900 tabular-nums">{viewingVoucher.voucherNumber}</p>
                    </div>
                    <div className="space-y-2 text-left">
                       <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'التاريخ' : 'DATE'}</p>
                       <p className="text-sm font-black text-slate-700 tabular-nums">{viewingVoucher.date}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المستلم / العامل' : 'PERSONNEL'}</p>
                       <p className="text-sm font-black text-slate-700">{workers?.find(w => w.id === viewingVoucher.workerId)?.fullName}</p>
                    </div>
                    <div className="space-y-2 text-left">
                       <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'أمر الإنتاج' : 'BATCH'}</p>
                       <p className="text-sm font-black text-slate-700">{order.orderNumber}</p>
                    </div>
                  </div>

                  {/* DETAILS TABLE */}
                  <div className="mb-8">
                    <Table className="text-right border-2 border-slate-100">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-black text-[10px] text-slate-500 py-2">{lang === 'ar' ? 'البيان / الصنف' : 'ITEM / MEMO'}</TableHead>
                          <TableHead className="font-black text-[10px] text-slate-500 py-2 text-center">{lang === 'ar' ? 'الكمية / المبلغ' : 'QTY / AMT'}</TableHead>
                          <TableHead className="font-black text-[10px] text-slate-500 py-2 text-center">{lang === 'ar' ? 'الوحدة' : 'UNIT'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingVoucher.type === 'material_issue' && viewingVoucher.items?.map((item: any, i: number) => (
                          <TableRow key={i} className="border-b border-slate-50">
                            <TableCell className="text-xs font-bold">{item.nameAr}</TableCell>
                            <TableCell className="text-center font-black text-xs tabular-nums">{item.qty}</TableCell>
                            <TableCell className="text-center text-[10px] font-bold text-slate-400 uppercase">{item.unit}</TableCell>
                          </TableRow>
                        ))}
                        {viewingVoucher.type === 'production_receipt' && (
                          <>
                            <TableRow className="border-b border-slate-50">
                              <TableCell className="text-xs font-bold">{lang === 'ar' ? 'إنتاج مقبول (جاهز)' : 'Accepted Production'}</TableCell>
                              <TableCell className="text-center font-black text-xs tabular-nums text-emerald-700">{viewingVoucher.qtyAccepted}</TableCell>
                              <TableCell className="text-center text-[10px] font-bold text-slate-400 uppercase">Pcs</TableCell>
                            </TableRow>
                            {viewingVoucher.returnedItems?.map((item: any, i: number) => (
                              <TableRow key={i} className="border-b border-slate-50 bg-blue-50/20">
                                <TableCell className="text-xs font-bold text-blue-700">{item.nameAr} ({lang === 'ar' ? 'مرتجع' : 'Return'})</TableCell>
                                <TableCell className="text-center font-black text-xs tabular-nums text-blue-700">{item.qty}</TableCell>
                                <TableCell className="text-center text-[10px] font-bold text-blue-400 uppercase">{item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                        {viewingVoucher.type === 'wage_payment' && (
                          <TableRow className="bg-emerald-50/50">
                            <TableCell className="text-xs font-black">{lang === 'ar' ? 'إجمالي الأجور المدفوعة' : 'Total Wages Paid'}</TableCell>
                            <TableCell className="text-center font-black text-sm tabular-nums text-emerald-700">{viewingVoucher.totalAmount}</TableCell>
                            <TableCell className="text-center text-[10px] font-bold text-slate-400 uppercase">{viewingVoucher.currency}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* SIGNATURES */}
                  <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-100 text-center">
                    <div className="space-y-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'توقيع المستلم' : 'Recipient'}</p>
                      <div className="h-px bg-slate-200 w-full" />
                    </div>
                    <div className="space-y-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'أمين المستودع' : 'Store Keeper'}</p>
                      <div className="h-px bg-slate-200 w-full" />
                    </div>
                    <div className="space-y-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'اعتماد المدير' : 'Approval'}</p>
                      <div className="h-px bg-slate-200 w-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
             <Button onClick={handleDownloadImage} disabled={isDownloading} className="premium-gradient font-black gap-2 h-11 px-8 rounded-xl shadow-lg">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {lang === 'ar' ? 'تحميل كصورة' : 'Download PNG'}
             </Button>
             <Button variant="ghost" onClick={() => setViewingVoucher(null)} className="h-11 px-6 rounded-xl border border-slate-200 font-black">
               {lang === 'ar' ? 'إغلاق' : 'Close'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ORDER DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Edit2 className="w-5 h-5 text-emerald-300" />
                {lang === 'ar' ? 'تحديث مواصفات الدفعة' : 'Update Batch Specs'}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Refining manufacturing targets and priorities
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleUpdateOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'عنوان الطلب المميز' : 'BATCH TITLE'}</Label>
              <Input value={editFormData.title} onChange={(e) => setEditFormDate({...editFormData, title: e.target.value})} className="h-11 font-bold text-xs bg-slate-50" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'نوع المعوز المستهدف' : 'PRODUCT TYPE'}</Label>
              <select 
                value={editFormData.productId} 
                onChange={(e) => setEditFormDate({...editFormData, productId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر نوع المعوز --' : '-- Select Product --'}</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input type="number" value={editFormData.targetQty} onChange={(e) => setEditFormDate({...editFormData, targetQty: Number(e.target.value)})} className="h-11 font-bold bg-slate-50 tabular-nums" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select value={editFormData.priority} onChange={(e) => setEditFormDate({...editFormData, priority: e.target.value})} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none">
                  <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                  <option value="normal">{lang === 'ar' ? 'عادية' : 'Normal'}</option>
                  <option value="high">{lang === 'ar' ? 'عاجلة' : 'High'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات إضافية' : 'ADDITIONAL NOTES'}</Label>
              <Textarea value={editFormData.notes} onChange={(e) => setEditFormDate({...editFormData, notes: e.target.value})} className="min-h-[100px] text-xs font-medium bg-slate-50" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 premium-gradient text-white rounded-lg font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'حفظ التعديلات' : 'Commit Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="px-6 h-12 font-black text-slate-400 rounded-lg">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function LedgerRow({ label, value, icon, color = "text-slate-900" }: { label: string, value: string | number, icon: any, color?: string }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
       <td className="px-6 py-4 w-72 font-black text-[10px] text-slate-400 uppercase border-l border-slate-100 flex items-center gap-3">
          <div className="p-1.5 bg-slate-100 rounded text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">{icon}</div>
          {label}
       </td>
       <td className={cn("px-6 py-4 text-xs font-black tabular-nums", color)}>{value || '---'}</td>
    </tr>
  );
}

function LedgerTransactionRow({ voucher, worker, lang, onView }: { voucher: any, worker: any, lang: string, onView: (v: any) => void }) {
  const typeMap: any = {
    'material_issue': { labelAr: 'صرف مواد', icon: <FileInput className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    'production_receipt': { labelAr: 'استلام انتاج', icon: <FileOutput className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    'wage_payment': { labelAr: 'صرف أجور', icon: <HandCoins className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  };
  const config = typeMap[voucher.type] || { labelAr: 'أخرى', icon: <FileText className="w-3.5 h-3.5" />, color: 'text-slate-500 bg-slate-50 border-slate-100' };

  return (
    <TableRow className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group">
      <TableCell className="px-6 py-3 font-bold text-slate-400 text-[10px] tabular-nums">{voucher.date}</TableCell>
      <TableCell className="px-6 py-3 font-black text-slate-900 text-[10px] tabular-nums tracking-wider">{voucher.voucherNumber}</TableCell>
      <TableCell className="px-6 py-3">
        <div className={cn("inline-flex items-center gap-2 px-2 py-0.5 rounded text-[9px] font-black uppercase border", config.color)}>
           {config.icon}
           {lang === 'ar' ? config.labelAr : voucher.type.replace('_', ' ')}
        </div>
      </TableCell>
      <TableCell className="px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase overflow-hidden border border-slate-200">
             {worker?.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          <div className="flex flex-col">
             <span className="text-[11px] font-black text-slate-800">{worker?.fullName || '---'}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 py-3 text-[11px] font-bold text-slate-500 max-w-[200px] truncate">
        {voucher.notes || (voucher.items ? `${voucher.items.length} مواد مصروفة` : '---')}
      </TableCell>
      <TableCell className="px-6 py-3 text-center">
        <div className="flex flex-col items-center">
           <span className={cn("text-xs font-black tabular-nums", voucher.type === 'material_issue' ? "text-amber-700" : "text-emerald-700")}>
              {voucher.type === 'production_receipt' ? (voucher.qtyAccepted || 0).toLocaleString('en-US') : (voucher.totalAmount || 0).toLocaleString('en-US')}
           </span>
           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              {voucher.type === 'production_receipt' ? (lang === 'ar' ? 'قطعة' : 'Pcs') : (voucher.currency || 'YER')}
           </span>
        </div>
      </TableCell>
      <TableCell className="px-6 py-3 text-center">
         <Button variant="ghost" size="icon" onClick={() => onView(voucher)} className="h-7 w-7 text-slate-400 hover:text-emerald-600 transition-colors">
            <Eye className="w-4 h-4" />
         </Button>
      </TableCell>
    </TableRow>
  );
}
