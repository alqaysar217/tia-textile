'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Workflow, 
  ShoppingBag, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Type, 
  Tag, 
  Activity, 
  Target, 
  Loader2, 
  Boxes,
  Calendar,
  Save,
  CheckCircle2,
  FileText,
  Eye,
  Settings2,
  ChevronDown,
  ArrowRight,
  RefreshCcw,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/components/LanguageProvider';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useProduction } from '../ProductionContext';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [completingOrder, setCompletingOrder] = useState<any | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استيراد الصلاحيات من المحرك المركزي
  const { permissions, isAdmin } = useProduction();
  const canCreate = isAdmin || permissions.orders?.create;
  const canEdit = isAdmin || permissions.orders?.edit;
  const canDelete = isAdmin || permissions.orders?.delete;

  const isRtl = lang === 'ar';

  /**
   * دالة حارس الأمان لفك تجمد الواجهة يدوياً (بروتوكول المطهر الشامل)
   * تضمن تحرير المتصفح من كافة الأقفال فور إغلاق أي نافذة
   */
  const forceUIUnlock = useCallback(() => {
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.body.removeAttribute('data-scroll-locked');
      
      const html = document.documentElement;
      html.style.pointerEvents = 'auto';
      html.style.overflow = 'auto';
      html.removeAttribute('data-scroll-locked');
    }, 200);
  }, []);

  /**
   * نظام المراقبة الذكي - يراقب حالة إغلاق النوافذ (بما فيها الضغط بالخارج)
   * ويقوم باستدعاء المطهر البرمجي فوراً لضمان عدم تجمد الشاشة
   */
  useEffect(() => {
    if (!isAddDialogOpen && !completingOrder && !deletingOrder) {
      forceUIUnlock();
    }
  }, [isAddDialogOpen, completingOrder, deletingOrder, forceUIUnlock]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    productId: '',
    targetQty: 300,
    priority: 'normal',
    notes: ''
  });

  // Fetch Data
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('status', '==', 'posted')), [db]);

  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: departments } = useCollection<any>(deptsQuery);
  const { data: allReceipts } = useCollection<any>(vouchersQuery);

  const sortedDepts = useMemo(() => {
    if (!departments) return [];
    return [...departments].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [departments]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'completed');
    return activeOrders.filter(o => {
      const product = products?.find(p => p.id === o.productId);
      const productName = product?.nameAr || '';
      const orderNo = o.orderNumber || '';
      const orderTitle = o.title || '';
      const s = search.toLowerCase();
      return productName.includes(s) || orderNo.toLowerCase().includes(s) || orderTitle.toLowerCase().includes(s);
    });
  }, [orders, products, search]);

  const resetForm = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingOrderId(null);
    setFormData({ title: '', productId: '', targetQty: 300, priority: 'normal', notes: '' });
    forceUIUnlock();
  }, [forceUIUnlock]);

  const handleEditClick = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    setEditingOrderId(order.id);
    setFormData({
      title: order.title || '',
      productId: order.productId || '',
      targetQty: order.targetQty || 0,
      priority: order.priority || 'normal',
      notes: order.notes || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || isSubmitting) return;

    if (editingOrderId && !canEdit) {
      toast({ variant: "destructive", title: lang === 'ar' ? "غير مسموح بالتعديل" : "Access Denied" });
      return;
    }
    if (!editingOrderId && !canCreate) {
      toast({ variant: "destructive", title: lang === 'ar' ? "غير مسموح بإنشاء طلبات" : "Access Denied" });
      return;
    }

    setIsSubmitting(true);
    const orderData = {
      title: formData.title,
      productId: formData.productId,
      targetQty: Number(formData.targetQty),
      priority: formData.priority,
      notes: formData.notes,
      updatedAt: serverTimestamp()
    };

    // إغلاق المودال وتحرير الواجهة فوراً
    setIsAddDialogOpen(false);
    forceUIUnlock();

    try {
      if (editingOrderId) {
        await updateDoc(doc(db, 'productionOrders', editingOrderId), orderData);
        toast({ title: lang === 'ar' ? "تم تحديث الأمر بنجاح" : "Order Updated" });
      } else {
        const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder = {
          ...orderData,
          orderNumber,
          completedQty: 0,
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
          currentStageId: departments?.find(d => d.status === 'active')?.id || '',
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'productionOrders'), newOrder);
        toast({ title: lang === 'ar' ? "تم إنشاء أمر الإنتاج" : "Order Created" });
      }
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleCompleteOrder = async () => {
    if (!db || !completingOrder || isSubmitting || !canEdit) return;

    setIsSubmitting(true);
    const targetOrder = completingOrder;
    
    // إغلاق المودال وتحرير الواجهة فوراً
    setCompletingOrder(null); 
    forceUIUnlock();

    try {
      await updateDoc(doc(db, 'productionOrders', targetOrder.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم إغلاق أمر الإنتاج بنجاح" : "Order Closed Successfully" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  const handleDeleteOrder = async () => {
    if (!db || !deletingOrder || !canDelete || isSubmitting) return;
    
    const hasVouchers = allReceipts?.some(r => r.orderId === deletingOrder.id && r.status !== 'deleted');
    if (hasVouchers) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "فشل الحذف" : "Deletion Failed",
        description: lang === 'ar' ? "لا يمكن حذف أمر إنتاج بدأت فيه العمليات الميدانية." : "Cannot delete order with existing vouchers."
      });
      setDeletingOrder(null);
      forceUIUnlock();
      return;
    }

    setIsSubmitting(true);
    const targetId = deletingOrder.id;
    
    // إغلاق المودال وتحرير الواجهة فوراً
    setDeletingOrder(null); 
    forceUIUnlock();

    try {
      await updateDoc(doc(db, 'productionOrders', targetId), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم نقل الأمر للأرشيف" : "Order Archived" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
      forceUIUnlock();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300" dir={dir}>
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 dark:bg-emerald-900/20 rounded-lg text-white shadow-lg">
              <Workflow className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'وحدة العمليات' : 'Operations'}</span>
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? "rotate-180" : "")} />
                <span className="text-emerald-600 dark:text-emerald-400">{lang === 'ar' ? 'أوامر الإنتاج النشطة (WIP)' : 'Active Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {lang === 'ar' ? 'إدارة ومتابعة طلبات الإنتاج' : 'Work Order Management'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500", dir === 'rtl' ? "right-3" : "left-3")} />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={lang === 'ar' ? 'بحث سريع...' : 'Quick search...'} 
                className={cn(
                  dir === 'rtl' ? 'pr-10' : 'pl-10',
                  "h-10 w-64 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-slate-100"
                )}
              />
            </div>
            {canCreate && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
                <Plus className="w-4 h-4" />
                {lang === 'ar' ? 'أمر جديد' : 'New Order'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 space-y-2 no-scrollbar">
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-slate-400 dark:text-slate-500 font-bold">{lang === 'ar' ? 'جاري سحب الأوامر...' : 'Fetching orders...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Boxes className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-400 dark:text-slate-600">{lang === 'ar' ? 'لا توجد أوامر نشطة حالياً' : 'No active orders'}</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">{lang === 'ar' ? 'قم بإنشاء أمر جديد لبدء العمل' : 'Create a new order to start processing'}</p>
          </div>
        ) : filteredOrders.map((order) => {
          const product = products?.find(p => p.id === order.productId);
          
          const finalStage = sortedDepts[sortedDepts.length - 1];
          const orderReceipts = allReceipts?.filter(r => r.orderId === order.id && r.type === 'production_receipt') || [];
          
          const finalCompletedQty = orderReceipts.reduce((acc, curr) => {
             const isFinalStage = curr.currentStageId === finalStage?.id;
             const isTransferred = curr.isTransferred === true;
             if (isFinalStage || isTransferred) return acc + (curr.qtyAccepted || 0);
             return acc;
          }, 0);

          const progress = Math.round((finalCompletedQty / (order.targetQty || 1)) * 100) || 0;
          
          return (
            <div 
              key={order.id} 
              onClick={() => router.push(`/production/orders/${order.id}`)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer"
            >
              <div className="flex flex-row items-center h-16 px-4 gap-4">
                <div className="w-32 flex flex-col justify-center border-l border-slate-100 dark:border-slate-800 h-full">
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 tabular-nums uppercase leading-none">{order.orderNumber}</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tabular-nums mt-1">{order.startDate}</span>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">{order.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{product?.nameAr || '---'}</span>
                  </div>
                </div>

                <div className="w-48 flex flex-col justify-center gap-1.5 px-4 border-x border-slate-100 dark:border-slate-800 h-full">
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{lang === 'ar' ? 'الإنجاز النهائي' : 'READY PROGRESS'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                </div>

                <div className="flex items-center gap-8 px-4">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</p>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums mt-1">{order.targetQty}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase leading-none">{lang === 'ar' ? 'منجز نهائي' : 'READY'}</p>
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">{finalCompletedQty}</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 px-4 h-full">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    order.status === 'completed' || progress >= 100 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  )} />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    {order.status === 'completed' || progress >= 100 
                      ? (lang === 'ar' ? 'مكتمل' : 'COMPLETED') 
                      : (lang === 'ar' ? 'قيد الإنتاج' : 'IN PROGRESS')}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 h-full px-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all" onClick={(e) => { e.stopPropagation(); router.push(`/production/orders/${order.id}`); }}><Eye className="w-4 h-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"><p className="text-[10px] font-bold">{lang === 'ar' ? 'عرض السجل الفني' : 'View Ledger'}</p></TooltipContent>
                    </Tooltip>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl dark:bg-slate-900 dark:border-slate-800">
                        {canEdit && (
                          <>
                            <DropdownMenuItem onClick={(e) => handleEditClick(order, e)} className="gap-2 font-bold py-2 cursor-pointer text-xs dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800">
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'تعديل بيانات الدفعة' : 'Edit Specs'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="dark:bg-slate-800" />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setCompletingOrder(order); }} className="gap-2 font-bold py-2 text-emerald-600 dark:text-emerald-400 cursor-pointer text-xs focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'إتمام وإغلاق الطلب' : 'Complete & Close Order'}
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator className="dark:bg-slate-800" />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeletingOrder(order); }} className="gap-2 font-bold py-2 text-rose-600 dark:text-rose-400 cursor-pointer text-xs focus:bg-rose-50 dark:focus:bg-rose-900/20"><Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive Order'}</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW/EDIT ORDER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); forceUIUnlock(); }}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Workflow className="w-5 h-5 text-emerald-300" />
                {editingOrderId ? (lang === 'ar' ? 'تعديل أمر الإنتاج' : 'Update Order') : (lang === 'ar' ? 'فتح أمر إنتاج جديد' : 'New Master Batch')}
              </DialogTitle>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveOrder} className="p-6 space-y-4 bg-white dark:bg-slate-900">
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end"><Type className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'عنوان الطلب المميز' : 'BATCH TITLE'}</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-11 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold dark:text-slate-100 text-right" required />
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-2 justify-end"><ShoppingBag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {lang === 'ar' ? 'نوع المعوز المستهدف' : 'PRODUCT'}</Label>
              <select value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none dark:text-slate-100 text-right" dir={dir} required>
                <option value="">-- {isRtl ? 'اختر المنتج' : 'Select'} --</option>
                {products?.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input type="number" value={formData.targetQty} onChange={(e) => setFormData({...formData, targetQty: Number(e.target.value)})} className="h-11 font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 text-center" required />
              </div>
              <div className="space-y-1.5 text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-slate-100 text-right" dir={dir}>
                  <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{lang === 'ar' ? 'ملاحظات إضافية' : 'NOTES'}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="min-h-[80px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none text-xs font-medium dark:text-slate-300 text-right" dir={dir} />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 premium-gradient text-white font-black">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}{lang === 'ar' ? 'حفظ البيانات' : 'Commit'}</Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-12 font-black text-slate-400 dark:text-slate-500 dark:border-slate-700"> {lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* COMPLETE ORDER CONFIRMATION */}
      <AlertDialog open={!!completingOrder} onOpenChange={(open) => { if(!open) setCompletingOrder(null); forceUIUnlock(); }}>
        <AlertDialogContent className="rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
           <div className="bg-emerald-950 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><CheckCircle2 className="w-32 h-32 text-white" /></div>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-inner">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'تأكيد إتمام وإغلاق الطلب' : 'Confirm Order Completion'}</AlertDialogTitle>
              <AlertDialogDescription className="text-emerald-100/50 font-bold mt-2 text-xs leading-relaxed text-center">
                 {lang === 'ar' 
                   ? `أنت على وشك إغلاق أمر الإنتاج (${completingOrder?.orderNumber}). سيتم اعتبار هذا الطلب منجزاً بالكامل وسيختفي من القائمة النشطة. هل أنت متأكد من اكتمال كافة العمليات؟` 
                   : `You are about to close order (${completingOrder?.orderNumber}). It will be marked as fully completed and hidden from the active list.`}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={handleCompleteOrder} disabled={isSubmitting} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg border-none">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <CheckCircle2 className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'نعم، إتمام الإغلاق' : 'Yes, Complete Order'}
              </AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 font-black rounded-xl text-slate-400 dark:text-slate-500 border-none">تراجع</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ARCHIVE DIALOG */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => { if(!open) setDeletingOrder(null); forceUIUnlock(); }}>
        <AlertDialogContent className="rounded-[1.5rem] p-0 overflow-hidden dark:bg-slate-900">
           <div className="bg-slate-950 p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20"><Trash2 className="w-8 h-8 text-rose-500" /></div>
              <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة أمر الإنتاج' : 'Confirm Archive'}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs">
                {lang === 'ar' ? 'سيتم نقل هذا الطلب للأرشيف (سلة المهملات). لن يتم حذفه نهائياً إلا بطلب منك.' : 'This order will be moved to the smart trash archive.'}
              </AlertDialogDescription>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 flex gap-3">
              <AlertDialogAction onClick={handleDeleteOrder} disabled={isSubmitting} className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl border-none">أرشفة</AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 font-black rounded-xl text-slate-400 dark:text-slate-500 border-none">تراجع</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-none p-3 bg-slate-900 dark:bg-slate-900/80 text-white/40 dark:text-slate-500 flex items-center justify-center gap-4 border-t border-white/5 shadow-2xl transition-colors duration-300">
         <ShieldCheck className="w-4 h-4 text-emerald-500" />
         <p className="text-[10px] font-bold tracking-tight">
           {lang === 'ar' 
             ? 'بروتوكول الرقابة: المنجز النهائي يحسب بناءً على الكميات الواصلة للمرحلة الأخيرة أو المرحلة للمستودع فعلياً.' 
             : 'Audit Protocol: Final yield is calculated based on items reaching the last stage or transferred to warehouse.'}
         </p>
      </div>

    </div>
  );
}
