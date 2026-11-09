'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Workflow, 
  ShoppingBag, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  History, 
  Type, 
  Tag, 
  Activity, 
  Target, 
  Layers, 
  ArrowUpRight, 
  Loader2, 
  Boxes,
  Calendar,
  Save,
  AlertCircle,
  ShieldCheck,
  Users2,
  Building2,
  UserCheck,
  FileText,
  Eye,
  Settings2,
  ExternalLink,
  ChevronDown,
  ArrowRight
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export default function ProductionOrdersPage() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLogisticsDialogOpen, setIsLogisticsDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [managingOrder, setManagingOrder] = useState<any | null>(null);
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

  // Logistics Form State
  const [logisticsData, setLogisticsData] = useState({
    currentStageId: '',
    notes: ''
  });

  // Fetch Data
  const productsQuery = useMemo(() => !db ? null : collection(db, 'products'), [db]);
  const ordersQuery = useMemo(() => !db ? null : collection(db, 'productionOrders'), [db]);
  const deptsQuery = useMemo(() => !db ? null : collection(db, 'departments'), [db]);
  const workersQuery = useMemo(() => !db ? null : collection(db, 'workers'), [db]);
  const vouchersQuery = useMemo(() => !db ? null : query(collection(db, 'vouchers'), where('status', '==', 'posted')), [db]);

  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: departments } = useCollection<any>(deptsQuery);
  const { data: workers } = useCollection<any>(workersQuery);
  const { data: allReceipts } = useCollection<any>(vouchersQuery);

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

  const resetLogistics = useCallback(() => {
    setIsLogisticsDialogOpen(false);
    setManagingOrder(null);
    setLogisticsData({ currentStageId: '', notes: '' });
  }, []);

  const handleEditClick = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleManageTeams = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setManagingOrder(order);
    setLogisticsData({
      currentStageId: order.currentStageId || '',
      notes: ''
    });
    setIsLogisticsDialogOpen(true);
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
    }
  };

  const handleUpdateLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !managingOrder || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'productionOrders', managingOrder.id), {
        currentStageId: logisticsData.currentStageId,
        updatedAt: serverTimestamp()
      });
      toast({ title: lang === 'ar' ? "تم تحديث مرحلة التشغيل" : "Logistics Updated" });
      resetLogistics();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!db || !deletingOrder) return;
    
    const hasVouchers = allReceipts?.some(r => r.orderId === deletingOrder.id && r.status !== 'deleted');
    if (hasVouchers) {
      toast({ 
        variant: "destructive", 
        title: lang === 'ar' ? "فشل الحذف" : "Deletion Failed",
        description: lang === 'ar' ? "لا يمكن حذف أمر إنتاج بدأت فيه العمليات الميدانية." : "Cannot delete order with existing vouchers."
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
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden" dir={dir}>
      
      {/* ERP HUB - HEADER */}
      <div className="flex-none bg-white border-b border-slate-200 z-30 px-6 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-900 rounded-lg text-white shadow-lg">
              <Workflow className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{lang === 'ar' ? 'وحدة العمليات' : 'Operations'}</span>
                <ChevronRight className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                <span className="text-emerald-600">{lang === 'ar' ? 'أوامر الإنتاج' : 'Work Orders'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {lang === 'ar' ? 'تتبع مسارات التصنيع' : 'WIP Path Tracking'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث سريع...' : 'Quick search...'}
                className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-10 w-64 bg-slate-50 border-slate-200 text-xs font-bold`}
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 px-6 premium-gradient hover:opacity-90 text-white rounded-lg shadow-md font-black gap-2 transition-all border-none">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'أمر جديد' : 'New Order'}
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN ORDERS LIST */}
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 space-y-2 no-scrollbar">
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-slate-400 font-bold">{lang === 'ar' ? 'جاري سحب الأوامر...' : 'Fetching orders...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Boxes className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-400">{lang === 'ar' ? 'لا توجد أوامر نشطة' : 'No active orders'}</h3>
          </div>
        ) : filteredOrders.map((order) => {
          const product = products?.find(p => p.id === order.productId);
          
          const finalStage = departments?.[departments.length - 1];
          const finalStageReceipts = allReceipts?.filter(r => r.orderId === order.id && r.type === 'production_receipt' && r.currentStageId === finalStage?.id) || [];
          const finalCompletedQty = finalStageReceipts.reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);
          
          const progress = Math.round((finalCompletedQty / order.targetQty) * 100) || 0;
          const wip = Math.max(0, order.targetQty - finalCompletedQty);
          
          return (
            <div 
              key={order.id} 
              onClick={() => router.push(`/production/orders/${order.id}`)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer"
            >
              <div className="flex flex-row items-center h-16 px-4 gap-4">
                <div className="w-32 flex flex-col justify-center border-l border-slate-100 h-full">
                  <span className="text-[10px] font-black text-emerald-700 tabular-nums uppercase leading-none">{order.orderNumber}</span>
                  <span className="text-[9px] font-bold text-slate-400 tabular-nums mt-1">{order.startDate}</span>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{order.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 truncate">{product?.nameAr || '---'}</span>
                  </div>
                </div>

                <div className="w-48 flex flex-col justify-center gap-1.5 px-4 border-x border-slate-100 h-full">
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className="text-slate-400 uppercase tracking-tighter">{lang === 'ar' ? 'الإنجاز' : 'PROGRESS'}</span>
                    <span className="text-emerald-600 tabular-nums">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-slate-100" />
                </div>

                <div className="flex items-center gap-6 px-4">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none">{lang === 'ar' ? 'هدف' : 'TARGET'}</p>
                    <p className="text-xs font-black text-slate-700 tabular-nums mt-1">{order.targetQty}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-emerald-600 uppercase leading-none">{lang === 'ar' ? 'منجز' : 'READY'}</p>
                    <p className="text-xs font-black text-emerald-700 tabular-nums mt-1">{finalCompletedQty}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-rose-500 uppercase leading-none">{lang === 'ar' ? 'قيد العمل' : 'WIP'}</p>
                    <p className="text-xs font-black text-rose-600 tabular-nums mt-1">{wip}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-r border-slate-100 h-full px-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" onClick={(e) => { e.stopPropagation(); router.push(`/production/orders/${order.id}`); }}><Eye className="w-4 h-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-[10px] font-bold">{lang === 'ar' ? 'عرض السجل الفني' : 'View Ledger'}</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={(e) => handleManageTeams(order, e)}><Users2 className="w-4 h-4" /></Button>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-[10px] font-bold">{lang === 'ar' ? 'تحريك المرحلة' : 'Move Stage'}</p></TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                        <DropdownMenuItem onClick={(e) => handleEditClick(order, e)} className="gap-2 font-bold text-xs"><Edit2 className="w-3.5 h-3.5 text-emerald-600" /> {lang === 'ar' ? 'تعديل البيانات' : 'Edit Specs'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeletingOrder(order); }} className="gap-2 font-bold text-xs text-rose-600"><Trash2 className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نقل للأرشيف' : 'Archive Order'}</DropdownMenuItem>
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
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="premium-gradient p-6 text-white">
            <DialogHeader className="text-right rtl:text-right ltr:text-left">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Workflow className="w-5 h-5 text-emerald-300" />
                {editingOrderId ? (lang === 'ar' ? 'تعديل أمر الإنتاج' : 'Update Order') : (lang === 'ar' ? 'فتح أمر إنتاج جديد' : 'New Master Batch')}
              </DialogTitle>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Type className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'عنوان الطلب المميز' : 'BATCH TITLE'}</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-11 rounded-lg bg-slate-50 font-bold" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><ShoppingBag className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'نوع المعوز المستهدف' : 'PRODUCT'}</Label>
              <select value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none" required>
                <option value="">-- Select --</option>
                {products?.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input type="number" value={formData.targetQty} onChange={(e) => setFormData({...formData, targetQty: Number(e.target.value)})} className="h-11 font-bold tabular-nums" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold">
                  <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'ملاحظات إضافية' : 'NOTES'}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="min-h-[80px] bg-slate-50 resize-none text-xs font-medium" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 premium-gradient text-white font-black">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}{lang === 'ar' ? 'حفظ البيانات' : 'Commit'}</Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-12 font-black text-slate-400">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE LOGISTICS DIALOG */}
      <Dialog open={isLogisticsDialogOpen} onOpenChange={(open) => !open && resetLogistics()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white">
            <DialogHeader className="text-right">
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-400" />
                {lang === 'ar' ? 'تحريك مسار الإنتاج' : 'Production Routing'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                {managingOrder?.orderNumber} - {managingOrder?.title}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleUpdateLogistics} className="p-6 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">{lang === 'ar' ? 'المرحلة الحالية' : 'CURRENT STAGE'}</p>
                  <p className="text-sm font-black text-slate-900">{departments?.find(d => d.id === managingOrder?.currentStageId)?.nameAr || '---'}</p>
                </div>
                <ArrowRight className={cn("w-5 h-5 text-emerald-500", dir === 'rtl' ? "rotate-180" : "")} />
                <div className="space-y-1 text-right">
                   <p className="text-[10px] font-black text-emerald-600 uppercase">{lang === 'ar' ? 'المرحلة القادمة' : 'TARGET STAGE'}</p>
                   <p className="text-sm font-black text-emerald-700">
                     {departments?.find(d => d.id === logisticsData.currentStageId)?.nameAr || '...'}
                   </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'انتقال إلى المرحلة' : 'MOVE TO STAGE'}</Label>
                <div className="relative group">
                   <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                   <select 
                    value={logisticsData.currentStageId} 
                    onChange={(e) => setLogisticsData({...logisticsData, currentStageId: e.target.value})}
                    className="w-full h-12 pr-10 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none"
                    required
                  >
                    <option value="">-- Select Stage --</option>
                    {departments?.filter(d => d.status === 'active').map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'تعليمات للمرحلة القادمة' : 'NOTES FOR NEXT TEAM'}</Label>
                <Textarea 
                  value={logisticsData.notes} 
                  onChange={(e) => setLogisticsData({...logisticsData, notes: e.target.value})} 
                  placeholder={lang === 'ar' ? 'مثال: يرجى التركيز على جودة الخياطة في الحواف...' : 'Example: Please ensure QC on edges...'}
                  className="min-h-[80px] rounded-xl bg-slate-50 border-slate-200 resize-none text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || !logisticsData.currentStageId} className="flex-1 h-12 premium-gradient text-white rounded-xl font-black text-sm border-none shadow-lg shadow-emerald-900/10">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <RefreshCcw className="w-4 h-4 me-2" />}
                {lang === 'ar' ? 'تأكيد الانتقال' : 'Confirm Movement'}
              </Button>
              <Button type="button" variant="outline" onClick={resetLogistics} className="px-6 h-12 font-black text-slate-400 rounded-xl border-slate-200">إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE DIALOG */}
      <AlertDialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent className="rounded-lg p-0 overflow-hidden">
           <div className="bg-slate-950 p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20"><Trash2 className="w-8 h-8 text-rose-500" /></div>
              <AlertDialogTitle className="text-white text-xl font-black">{lang === 'ar' ? 'أرشفة أمر الإنتاج' : 'Confirm Archive'}</AlertDialogTitle>
           </div>
           <div className="bg-white p-6 flex gap-3">
              <AlertDialogAction onClick={handleDeleteOrder} className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-black">أرشفة</AlertDialogAction>
              <AlertDialogCancel className="flex-1 h-11 bg-slate-50 font-black">تراجع</AlertDialogCancel>
           </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
