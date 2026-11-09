
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
  UserCheck
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
      <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6 space-y-3 no-scrollbar">
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-slate-400 font-bold">{lang === 'ar' ? 'جاري سحب الأوامر...' : 'Fetching orders...'}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Boxes className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-400">{lang === 'ar' ? 'لا توجد أوامر نشطة' : 'No active orders'}</h3>
            <p className="text-slate-300 text-sm mt-1">{lang === 'ar' ? 'ابدأ بإضافة أول أمر تشغيل من الزر أعلاه.' : 'Add your first order to begin.'}</p>
          </div>
        ) : filteredOrders.map((order) => {
          const product = products?.find(p => p.id === order.productId);
          const stage = departments?.find(d => d.id === order.currentStageId);
          const stageSupervisor = workers?.find(w => w.departmentId === order.currentStageId && w.isSupervisor && w.active);
          
          const finalStage = departments?.[departments.length - 1];
          const finalStageReceipts = allReceipts?.filter(r => r.orderId === order.id && r.type === 'production_receipt' && r.currentStageId === finalStage?.id) || [];
          const finalCompletedQty = finalStageReceipts.reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);
          
          const currentStageReceipts = allReceipts?.filter(r => r.orderId === order.id && r.type === 'production_receipt' && r.currentStageId === order.currentStageId) || [];
          const currentStageDone = currentStageReceipts.reduce((acc, curr) => acc + (curr.qtyAccepted || 0), 0);

          const progress = Math.round((finalCompletedQty / order.targetQty) * 100) || 0;
          const currentStageProgress = Math.round((currentStageDone / order.targetQty) * 100) || 0;
          
          return (
            <div key={order.id} onClick={() => router.push(`/production/orders/${order.id}`)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer">
              <div className="flex flex-col lg:flex-row items-stretch">
                
                <div className="w-full lg:w-1/4 p-4 flex flex-col justify-between relative border-l border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded border border-slate-200 tabular-nums uppercase tracking-tight">
                        {order.orderNumber}
                      </span>
                      <div className={cn("w-2 h-2 rounded-full", order.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500')} />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {order.title || (product?.nameAr || '---')}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        <Tag className="w-2.5 h-2.5" />
                        {product?.nameAr || '---'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tabular-nums">
                      <Calendar className="w-3 h-3" />
                      {order.startDate}
                    </div>
                    <Badge variant="ghost" className="text-[8px] font-black text-slate-400 uppercase p-0">{order.priority}</Badge>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-4 bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        {lang === 'ar' ? 'المرحلة والمسؤولية' : 'CURRENT PHASE'}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-black text-slate-800">
                          {stage?.nameAr || (lang === 'ar' ? 'بانتظار البدء' : 'PENDING')}
                        </p>
                        {stageSupervisor && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-md shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px] font-black text-slate-600">{lang === 'ar' ? 'بإشراف:' : 'Lead:'} {stageSupervisor.fullName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-black text-slate-900 tabular-nums">{progress}%</span>
                          <div className="p-0.5 bg-emerald-50 rounded text-emerald-600"><Target className="w-3.5 h-3.5" /></div>
                        </div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{lang === 'ar' ? 'جاهز نهائي' : 'FINISHED'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                      <span>{lang === 'ar' ? 'إنجاز المرحلة الحالية' : 'STAGE PROGRESS'}</span>
                      <span className="tabular-nums">{currentStageProgress}%</span>
                    </div>
                    <Progress value={currentStageProgress} className="h-1.5 bg-slate-200/50" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 bg-white/40 p-2 rounded-xl border border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'المستهدف' : 'TARGET'}</p>
                      <p className="text-xs font-black text-slate-700 tabular-nums">{order.targetQty}</p>
                    </div>
                    <div className="space-y-1 bg-white/40 p-2 rounded-xl border border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'تم الاستلام' : 'RECEIVED'}</p>
                      <p className="text-xs font-black text-emerald-600 tabular-nums">{currentStageDone}</p>
                    </div>
                    <div className="space-y-1 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50 text-center">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">{lang === 'ar' ? 'قيد العمل' : 'WIP'}</p>
                      <p className="text-xs font-black text-emerald-700 tabular-nums">{order.targetQty - currentStageDone}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-40 p-4 flex flex-row lg:flex-col gap-2 border-r border-slate-100 bg-white items-center justify-center">
                  <Button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/production/vouchers/issue?orderId=${order.id}`); }}
                    variant="outline" 
                    className="flex-1 lg:w-full h-10 rounded-xl text-[10px] font-black gap-2 border-slate-200 hover:bg-slate-50 transition-all uppercase"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    {lang === 'ar' ? 'سندات الأمر' : 'Vouchers'}
                  </Button>
                  <Button 
                    onClick={(e) => handleManageTeams(order, e)}
                    className="flex-1 lg:w-full h-10 premium-gradient rounded-xl text-[10px] font-black gap-2 border-none shadow-md hover:opacity-90 uppercase"
                  >
                    <Users2 className="w-4 h-4" />
                    {lang === 'ar' ? 'إدارة الفرق' : 'Manage Teams'}
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
                {editingOrderId ? (lang === 'ar' ? 'تعديل أمر الإنتاج' : 'Update Order') : (lang === 'ar' ? 'فتح أمر إنتاج جديد' : 'New Master Batch')}
              </DialogTitle>
              <p className="text-emerald-100/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Initiating manufacturing cycle & target metrics
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveOrder} className="p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Type className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'عنوان الطلب المميز' : 'BATCH TITLE'}
              </Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={lang === 'ar' ? 'مثال: طلبية معرض عتق - دفعة العيد' : 'e.g. Eid Batch - Main Branch'}
                className="h-11 rounded-lg bg-slate-50 font-bold border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'نوع المعوز المستهدف' : 'PRODUCT SELECTION'}
              </Label>
              <select 
                value={formData.productId} 
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر المعوز --' : '-- Select Item --'}</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الكمية المستهدفة' : 'TARGET QTY'}</Label>
                <Input 
                  type="number" 
                  value={formData.targetQty} 
                  onChange={(e) => setFormData({...formData, targetQty: Number(e.target.value)})}
                  className="h-11 rounded-lg bg-slate-50 font-bold tabular-nums"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">{lang === 'ar' ? 'الأولوية' : 'PRIORITY'}</Label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                >
                  <option value="low">{lang === 'ar' ? 'عادية' : 'Normal'}</option>
                  <option value="normal">{lang === 'ar' ? 'متوسطة' : 'Priority'}</option>
                  <option value="high">{lang === 'ar' ? 'عاجلة' : 'Urgent'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <FileText className="w-3 h-3 text-emerald-600" />
                {lang === 'ar' ? 'ملاحظات إضافية' : 'ADDITIONAL NOTES'}
              </Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder={lang === 'ar' ? 'أدخل أي تعليمات خاصة هنا...' : 'Enter any special instructions...'}
                className="min-h-[80px] rounded-lg bg-slate-50 font-medium border-slate-200 resize-none text-xs"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || products?.length === 0} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-lg font-black text-sm border-none shadow-md">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                {lang === 'ar' ? (editingOrderId ? 'تحديث' : 'بدء الإنتاج') : (editingOrderId ? 'Update' : 'Launch Batch')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="px-6 h-12 font-black text-slate-400 rounded-lg">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE LOGISTICS DIALOG */}
      <Dialog open={isLogisticsDialogOpen} onOpenChange={(open) => !open && resetLogistics()}>
        <DialogContent className="sm:max-w-[500px] rounded-lg p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Users2 className="w-24 h-24" /></div>
            <DialogHeader className="text-right rtl:text-right ltr:text-left relative z-10">
              <DialogTitle className="text-xl font-black flex items-center gap-3 text-white">
                <Building2 className="w-5 h-5 text-emerald-400" />
                {lang === 'ar' ? 'إدارة الفرق واللوجستيات' : 'Order Logistics & Teams'}
              </DialogTitle>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Routing batches through production work centers
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleUpdateLogistics} className="p-6 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Layers className="w-3 h-3 text-emerald-600" />
                  {lang === 'ar' ? 'تغيير مرحلة الإنتاج الحالية' : 'MOVE TO STAGE'}
                </Label>
                <select 
                  value={logisticsData.currentStageId} 
                  onChange={(e) => setLogisticsData({...logisticsData, currentStageId: e.target.value})}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                >
                  <option value="">{lang === 'ar' ? '-- اختر القسم --' : '-- Select Stage --'}</option>
                  {departments?.filter(d => d.status === 'active').map(d => (
                    <option key={d.id} value={d.id}>{d.nameAr}</option>
                  ))}
                </select>
              </div>

              {logisticsData.currentStageId && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{lang === 'ar' ? 'المشرف المسؤول في هذا القسم' : 'STAGE LEAD'}</p>
                    <p className="text-xs font-bold text-emerald-700">
                      {workers?.find(w => w.departmentId === logisticsData.currentStageId && w.isSupervisor && w.active)?.fullName || (lang === 'ar' ? 'لم يعين مشرف لهذا القسم' : 'No lead assigned')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={isSubmitting || !logisticsData.currentStageId} className="flex-1 h-12 premium-gradient hover:opacity-90 text-white rounded-xl font-black text-sm border-none shadow-xl">
                {lang === 'ar' ? 'تحديث المرحلة' : 'Commit Stage Change'}
              </Button>
              <Button type="button" variant="outline" onClick={resetLogistics} className="px-6 h-12 font-black text-slate-400 rounded-xl">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
