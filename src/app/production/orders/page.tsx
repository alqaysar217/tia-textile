'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Factory, 
  PlayCircle, 
  Timer, 
  CheckCircle2, 
  FileText,
  AlertCircle,
  Filter,
  ArrowRight,
  TrendingUp,
  Boxes,
  Users,
  Layers,
  ArrowUpRight,
  Calendar,
  Save,
  Loader2,
  Workflow,
  ShoppingBag,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  History,
  Type,
  Tag,
  Activity,
  Gauge,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: departments } = useCollection<any>(deptsQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const activeOrders = orders.filter(o => o.status !== 'deleted');
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
  }, []);

  const handleEditClick = (order: any) => {
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

    setIsSubmitting(true);
    const orderData = {
      title: formData.title,
      productId: formData.productId,
      targetQty: Number(formData.targetQty),
      priority: formData.priority,
      notes: formData.notes,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingOrderId) {
        await updateDoc(doc(db, 'productionOrders', editingOrderId), orderData);
        toast({ title: lang === 'ar' ? "تم تحديث الأمر" : "Order Updated" });
      } else {
        const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newOrder = {
          ...orderData,
          orderNumber,
          completedQty: 0,
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
          currentStageId: departments?.[0]?.id || '',
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
    }
  };

  const handleDeleteOrder = async () => {
    if (!db || !deletingOrder) return;
    
    if (deletingOrder.completedQty > 0) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "فشل الحذف" : "Deletion Failed",
        description: lang === 'ar' ? "لا يمكن حذف أمر إنتاج يحتوي على كميات مستلمة." : "Cannot delete order with completed items."
      });
      setDeletingOrder(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'productionOrders', deletingOrder.id), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم نقل الأمر للأرشيف" : "Order Archived" });
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingOrder(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      
      {/* ERP HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 premium-gradient rounded-lg text-white shadow-lg shadow-emerald-900/20">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'الإنتاج' : 'Manufacturing'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-slate-600">{lang === 'ar' ? 'أوامر التشغيل' : 'Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تتبع أوامر الإنتاج والمراحل' : 'Production & Stage Tracking'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث بالأمر أو المنتج...' : 'Search orders...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold`}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إنشاء أمر جديد' : 'Open New Order'}
            </Button>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'أوامر نشطة' : 'Active Orders'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">{filteredOrders.length}</span>
              <PlayCircle className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'تحت التشغيل' : 'WIP Qty'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">
                {filteredOrders.reduce((acc, curr) => acc + (curr.targetQty - curr.completedQty), 0)}
              </span>
              <Timer className="w-4 h-4 text-amber-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'إجمالي المكتمل' : 'Total Done'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-emerald-600 tabular-nums">
                {filteredOrders.reduce((acc, curr) => acc + curr.completedQty, 0)}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{lang === 'ar' ? 'نسبة الإنجاز' : 'Avg Progress'}</p>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-slate-700 tabular-nums">
                {filteredOrders.length > 0 
                  ? Math.round((filteredOrders.reduce((acc, curr) => acc + (curr.completedQty / curr.targetQty), 0) / filteredOrders.length) * 100)
                  : 0}%
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500 mb-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-6 space-y-6 no-scrollbar">
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-slate-400 font-bold">{lang === 'ar' ? 'جاري جلب الأوامر...' : 'Loading Orders...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Boxes className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400">{lang === 'ar' ? 'لا توجد أوامر إنتاج حالياً' : 'No Production Orders'}</h3>
            <p className="text-slate-300 text-sm mt-1">{lang === 'ar' ? 'ابدأ بإنشاء أول أمر لتتبع مراحل العمل.' : 'Create your first order to start tracking stages.'}</p>
          </div>
        ) : filteredOrders.map((order) => {
          const product = products?.find(p => p.id === order.productId);
          const stage = departments?.find(d => d.id === order.currentStageId);
          const progress = Math.round((order.completedQty / order.targetQty) * 100) || 0;
          const priorityColor = order.priority === 'high' ? 'bg-rose-500' : order.priority === 'normal' ? 'bg-emerald-500' : 'bg-slate-400';

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                
                {/* 1. Header Identity Area (Technical Slate) */}
                <div className="w-full md:w-80 p-6 bg-slate-50 border-r border-slate-100 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg tabular-nums tracking-[0.1em] shadow-md">
                          {order.orderNumber}
                        </span>
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", priorityColor)} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuItem onClick={() => handleEditClick(order)} className="gap-3 font-bold py-2.5 cursor-pointer">
                            <Edit2 className="w-4 h-4 text-emerald-600" /> {lang === 'ar' ? 'تعديل الأمر' : 'Edit Order'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeletingOrder(order)} className="gap-3 font-bold py-2.5 cursor-pointer text-rose-600 focus:text-rose-700">
                            <Trash2 className="w-4 h-4" /> {lang === 'ar' ? 'حذف / أرشفة' : 'Archive Order'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                        {order.title || (product?.nameAr || '---')}
                      </h3>
                      {order.title && product && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3" />
                          {product.nameAr}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{order.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{order.priority}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Operations & Progress Area */}
                <div className="flex-1 p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-[0.2em]">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        {lang === 'ar' ? 'الحالة التشغيلية' : 'OPERATIONAL STAGE'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-800">
                          {stage?.nameAr || (lang === 'ar' ? 'بانتظار الإطلاق' : 'PENDING LAUNCH')}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'ar' ? 'مؤشر الإنجاز' : 'COMPLETION INDEX'}</p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">{progress}%</span>
                        <div className="p-1 bg-emerald-50 rounded text-emerald-600"><TrendingUp className="w-3 h-3" /></div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group/progress">
                    <Progress value={progress} className="h-3 bg-slate-100 border border-slate-200/50 shadow-inner" />
                    <div className="absolute -top-1 left-[progress%] w-0.5 h-5 bg-emerald-500/50 blur-[1px] hidden group-hover/progress:block" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col items-center">
                      <Target className="w-3.5 h-3.5 text-slate-400 mb-2" />
                      <span className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</span>
                      <span className="text-sm font-black text-slate-700 tabular-nums">{order.targetQty}</span>
                    </div>
                    <div className="bg-amber-50/30 border border-amber-100/50 rounded-xl p-3 flex flex-col items-center">
                      <Gauge className="w-3.5 h-3.5 text-amber-500 mb-2" />
                      <span className="text-[9px] font-black text-amber-700/60 uppercase mb-0.5">{lang === 'ar' ? 'المستلم' : 'ACTUAL'}</span>
                      <span className="text-sm font-black text-amber-700 tabular-nums">{order.completedQty}</span>
                    </div>
                    <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3 flex flex-col items-center">
                      <Timer className="w-3.5 h-3.5 text-emerald-500 mb-2" />
                      <span className="text-[9px] font-black text-emerald-700/60 uppercase mb-0.5">{lang === 'ar' ? 'المتبقي' : 'REM'}</span>
                      <span className="text-sm font-black text-emerald-700 tabular-nums">{order.targetQty - order.completedQty}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Action Hub Area */}
                <div className="w-full md:w-48 p-6 bg-slate-900 flex flex-row md:flex-col gap-3 items-center justify-center">
                  <Button variant="outline" className="flex-1 md:w-full h-11 rounded-xl font-black text-[10px] gap-2 border-white/10 bg-white/5 text-white hover:bg-white/20 transition-all uppercase tracking-widest">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    {lang === 'ar' ? 'السندات' : 'Vouchers'}
                  </Button>
                  <Button className="flex-1 md:w-full h-11 premium-gradient rounded-xl font-black text-[10px] gap-2 border-none shadow-xl shadow-black/20 uppercase tracking-widest">
                    {lang === 'ar' ? 'إدارة المرحلة' : 'Process'}
                    <ChevronRight className={cn("w-3.5 h-3.5", dir === 'rtl' && "rotate-180")} />
                  </Button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* NEW/EDIT ORDER DIALOG */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Workflow className="w-5 h-5 text-emerald-300" />
                {editingOrderId ? (lang === 'ar' ? 'تعديل أمر الإنتاج' : 'Edit Production Order') : (lang === 'ar' ? 'فتح أمر إنتاج جديد' : 'New Production Order')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                {editingOrderId ? 'Updating existing batch details' : 'Initiating a new manufacturing batch'}
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Type className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'عنوان الطلب (اختياري)' : 'ORDER TITLE'}
              </Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={lang === 'ar' ? 'مثال: طلبية معرض عتق - دفعة العيد' : 'e.g. Eid Batch - Ataq Showroom'}
                className="h-11 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'اختر المنتج من الكتالوج' : 'SELECT PRODUCT'}
              </Label>
              <select 
                value={formData.productId} 
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر المعوز --' : '-- Select Product --'}</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr}</option>
                ))}
              </select>
              
              {products?.length === 0 && !productsLoading && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ShoppingBag className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase">الكتالوج فارغ حالياً</p>
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                    {lang === 'ar' 
                      ? 'يجب إضافة أصناف المعاوز في "دليل المنتجات" أولاً لكي تظهر هنا.' 
                      : 'You must add product items in "Product Catalog" first to see them here.'}
                  </p>
                  <Button variant="link" className="text-amber-800 text-[10px] font-black p-0 h-auto w-fit" asChild>
                    <Link href="/production/products">{lang === 'ar' ? 'انتقل لإضافة منتجات' : 'Go to Product Catalog'}</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input 
                  type="number" 
                  value={formData.targetQty} 
                  onChange={(e) => setFormData({...formData, targetQty: Number(e.target.value)})}
                  className="h-11 rounded-xl bg-slate-50 font-bold tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                >
                  <option value="low">{lang === 'ar' ? 'عادية' : 'Low'}</option>
                  <option value="normal">{lang === 'ar' ? 'متوسطة' : 'Normal'}</option>
                  <option value="high">{lang === 'ar' ? 'عاجلة جداً' : 'High'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات إضافية' : 'NOTES'}</Label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none"
                placeholder={lang === 'ar' ? 'أي تعليمات خاصة لهذا الأمر...' : 'Special instructions...'}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || products?.length === 0} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-xl font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (editingOrderId ? 'تحديث البيانات' : 'حفظ والبدء') : (editingOrderId ? 'Update Order' : 'Create & Start')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-12 font-black text-slate-400 rounded-xl border-slate-200">
                {lang === 'ar' ? 'تراجع' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          {deletingOrder?.completedQty > 0 ? (
            <div className="p-0">
              <div className="bg-amber-50 p-8 text-center border-b border-amber-100">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <AlertDialogTitle className="text-amber-900 text-xl font-black">{lang === 'ar' ? 'الحذف محظور' : 'Deletion Locked'}</AlertDialogTitle>
                <AlertDialogDescription className="text-amber-700 font-bold mt-2 text-xs leading-relaxed">
                  {lang === 'ar' 
                    ? "لا يمكن حذف هذا الأمر لأنه يحتوي على إنتاج فعلي مستلم. يرجى إكمال الطلبية أو أرشفتها كـ 'مكتملة'." 
                    : "Cannot delete this order because it has recorded production output."}
                </AlertDialogDescription>
              </div>
              <div className="bg-white p-6">
                <Button onClick={() => setDeletingOrder(null)} className="w-full h-11 bg-slate-900 font-black rounded-md text-white">
                  {lang === 'ar' ? 'فهمت ذلك' : 'Got it'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-0">
              <div className="bg-slate-950 p-8 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
                  <History className="w-8 h-8 text-red-500" />
                </div>
                <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة أمر الإنتاج' : 'Archive Order'}</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-xs leading-relaxed">
                  {lang === 'ar' 
                    ? 'هل أنت متأكد؟ سيتم نقل هذا الأمر إلى الأرشيف. يمكنك استعادته لاحقاً من سلة المهملات.' 
                    : 'Are you sure? This order will be moved to the smart trash.'}
                </AlertDialogDescription>
              </div>
              <div className="bg-white p-6 flex gap-3">
                <AlertDialogAction onClick={handleDeleteOrder} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-md font-black border-none">
                  {lang === 'ar' ? 'تأكيد الأرشفة' : 'Confirm'}
                </AlertDialogAction>
                <AlertDialogCancel onClick={() => setDeletingOrder(null)} className="flex-1 h-11 bg-slate-50 border-slate-200 text-slate-400 rounded-md font-black">
                  {lang === 'ar' ? 'تراجع' : 'Cancel'}
                </AlertDialogCancel>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* SYSTEM NOTES */}
      <div className="flex-none p-4 bg-slate-900 text-white/50 flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center"><AlertCircle className="w-4 h-4" /></div>
        <p className="text-[10px] font-medium leading-tight">
          {lang === 'ar' 
            ? 'تنبيه: يتم تحديث تكلفة القطعة آلياً عند إتمام كل مرحلة بناءً على المواد المصروفة وأجور العمال المسجلة في السندات.' 
            : 'Note: Unit cost is recalculated automatically upon stage completion based on issued materials and labor wages.'}
        </p>
      </div>

    </div>
  );
}
